/* ============================================================
   本地持久化层 —— 所有学习数据保存在 localStorage
   ------------------------------------------------------------
   - 单一 key，版本化 schema，导入时自动迁移
   - 静态内容（词库/文章/题目）不写入 localStorage，只写「用户状态」
   - 导出/恢复为 JSON；支持 replace 与 merge 两种恢复方式
   - localStorage 不可用时降级为内存存储并给出提示（不静默丢数据）
   ============================================================ */
import { nowISO, uid, today, uniq } from './utils.js';

export const STORAGE_KEY = 'ky-english-state-v1';
export const SCHEMA_VERSION = 1;
export const APP_TAG = 'kaoyan-english-selfstudy';

const DEFAULT_STATE = () => ({
  version: SCHEMA_VERSION,
  createdAt: nowISO(),
  updatedAt: nowISO(),
  settings: {
    dailyWordGoal: 20,
    dailyReviewGoal: 30,
    speechRate: 0.9,
    speechVoiceURI: '',
    showPhonetic: true,
    autoSpeak: false
  },
  /* 单词掌握记录：key = 规范化后的英文词形 */
  wordProgress: {},
  /* 用户自建/导入/编辑的完整词条（覆盖内置同名演示词条） */
  customWords: [],
  /* 用户批量导入的阅读文章（含题目与答案解析） */
  customArticles: [],
  /* 课程：done / note / inReview */
  courses: {},
  readingAttempts: [],
  clozeAttempts: [],
  wordTests: [],
  translations: [],
  essays: [],
  examResults: [],
  examCurrent: null,
  mistakes: [],
  activity: [],
  /* 进行中的练习草稿（阅读/完形作答等），保证刷新不丢 */
  drafts: {},
  /* 每日目标完成情况缓存（按日期） */
  daily: {}
});

let storageOK = true;
let memoryFallback = null;
function rawGet() {
  try { return globalThis.localStorage ? globalThis.localStorage.getItem(STORAGE_KEY) : memoryFallback; }
  catch { storageOK = false; return memoryFallback; }
}
function rawSet(v) {
  try {
    if (globalThis.localStorage) globalThis.localStorage.setItem(STORAGE_KEY, v);
    else { storageOK = false; memoryFallback = v; }
  } catch { storageOK = false; memoryFallback = v; }
}

let state = null;
const listeners = new Set();

function deepDefaults(target, defaults) {
  for (const k of Object.keys(defaults)) {
    if (target[k] === undefined || target[k] === null) {
      target[k] = (defaults[k] && typeof defaults[k] === 'object' && !Array.isArray(defaults[k]))
        ? JSON.parse(JSON.stringify(defaults[k])) : defaults[k];
    } else if (defaults[k] && typeof defaults[k] === 'object' && !Array.isArray(defaults[k])
               && typeof target[k] === 'object' && !Array.isArray(target[k])) {
      deepDefaults(target[k], defaults[k]);
    }
  }
  return target;
}

function migrate(s) {
  if (!s || typeof s !== 'object') return DEFAULT_STATE();
  s.version = SCHEMA_VERSION;
  deepDefaults(s, DEFAULT_STATE());
  // 数组字段容错
  ['customWords', 'customArticles', 'readingAttempts', 'clozeAttempts', 'wordTests', 'translations', 'essays',
   'examResults', 'mistakes', 'activity'].forEach(k => { if (!Array.isArray(s[k])) s[k] = []; });
  ['wordProgress', 'courses', 'daily', 'drafts'].forEach(k => {
    if (!s[k] || typeof s[k] !== 'object' || Array.isArray(s[k])) s[k] = {};
  });
  return s;
}

export function init() {
  const raw = rawGet();
  if (raw) {
    try { state = migrate(JSON.parse(raw)); }
    catch { state = DEFAULT_STATE(); }
  } else {
    state = DEFAULT_STATE();
    rawSet(JSON.stringify(state));
  }
  return state;
}

export function get() { if (!state) init(); return state; }
export function isPersistenceOK() { return storageOK && !!globalThis.localStorage; }

/** 修改状态并立即落盘；fn 接收 state，返回值忽略 */
export function update(fn) {
  const s = get();
  fn(s);
  s.updatedAt = nowISO();
  rawSet(JSON.stringify(s));
  listeners.forEach(l => { try { l(s); } catch { /* 单个订阅者失败不影响落盘 */ } });
  return s;
}
export function save() { return update(() => {}); }
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

/* ---------------- 具体业务写入 ---------------- */

/** 取/建某个词的掌握记录 */
export function wordRec(word) {
  const s = get();
  const key = String(word || '').trim().toLowerCase();
  if (!s.wordProgress[key]) {
    s.wordProgress[key] = {
      level: 0, seen: 0, correct: 0, wrong: 0,
      favorite: false, mastered: false,
      lastAt: null, dueAt: null, interval: 0, lapses: 0, reviews: 0,
      note: ''
    };
  }
  return s.wordProgress[key];
}

export function addActivity(type, title, detail = '') {
  update(s => {
    s.activity.unshift({ id: uid('act'), at: nowISO(), type, title, detail });
    if (s.activity.length > 250) s.activity.length = 250;
    const d = today();
    if (!s.daily[d]) s.daily[d] = { newWords: 0, reviews: 0, practice: 0, minutes: 0 };
  });
}

export function bumpDaily(field, n = 1) {
  update(s => {
    const d = today();
    if (!s.daily[d]) s.daily[d] = { newWords: 0, reviews: 0, practice: 0, minutes: 0 };
    s.daily[d][field] = (s.daily[d][field] || 0) + n;
  });
}

/** 错题归档：同一来源+题号且未掌握则更新，不重复堆积 */
export function addMistake(m) {
  const item = {
    id: uid('mk'),
    source: m.source || 'practice',
    refId: m.refId || '',
    questionId: m.questionId || uid('q'),
    typeName: m.typeName || '练习',
    knowledge: m.knowledge || '',
    stem: m.stem || '',
    options: Array.isArray(m.options) ? m.options : [],
    userAnswer: m.userAnswer,
    correctAnswer: m.correctAnswer,
    explanation: m.explanation || '',
    at: nowISO(),
    mastered: false,
    reviewCount: 0,
    lastReviewAt: null,
    nextReviewAt: null
  };
  update(s => {
    const idx = s.mistakes.findIndex(x => !x.mastered && x.source === item.source && x.questionId === item.questionId);
    if (idx >= 0) {
      s.mistakes[idx] = { ...s.mistakes[idx], ...item, id: s.mistakes[idx].id, reviewCount: s.mistakes[idx].reviewCount + 1 };
    } else s.mistakes.unshift(item);
    if (s.mistakes.length > 800) s.mistakes.length = 800;
  });
  return item;
}

/* ---------------- 导出 / 恢复 ---------------- */

export function exportBundle() {
  const s = get();
  return JSON.stringify({
    app: APP_TAG,
    version: SCHEMA_VERSION,
    exportedAt: nowISO(),
    note: '考研英语二自学网站 · 本地学习数据备份（不含内置静态词库与题库）',
    state: s
  }, null, 2);
}
export function exportFilename() {
  const d = new Date(), p = n => String(n).padStart(2, '0');
  return `英语二-学习数据备份-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.json`;
}

/** 校验备份文件结构；返回 {ok, state, error} */
export function parseBundle(text) {
  let obj;
  try { obj = JSON.parse(text); }
  catch { return { ok: false, error: '不是合法的 JSON 文件' }; }
  if (!obj || typeof obj !== 'object') return { ok: false, error: '文件内容不是对象' };
  const st = obj.state || obj;
  if (obj.app && obj.app !== APP_TAG) return { ok: false, error: `备份来自其他应用（${String(obj.app).slice(0, 40)}），已拒绝恢复` };
  if (!st || typeof st !== 'object' || !('wordProgress' in st || 'mistakes' in st || 'essays' in st)) {
    return { ok: false, error: '不像本网站的学习数据备份（缺少必要字段）' };
  }
  return { ok: true, state: migrate(JSON.parse(JSON.stringify(st))), exportedAt: obj.exportedAt || null };
}

/** mode: replace（覆盖） | merge（合并：数组按 id 去重拼接，进度取较新） */
export function restore(text, mode = 'replace') {
  const parsed = parseBundle(text);
  if (!parsed.ok) return parsed;
  const incoming = parsed.state;
  if (mode === 'replace') {
    state = incoming;
    rawSet(JSON.stringify(state));
    listeners.forEach(l => { try { l(state); } catch {} });
    return { ok: true, mode, exportedAt: parsed.exportedAt };
  }
  update(s => {
    // 对象型：以导入数据为准（用户明确选择合并时保留本地较新记录）
    for (const key of ['wordProgress', 'courses', 'daily', 'drafts']) {
      const a = s[key] || {}, b = incoming[key] || {};
      for (const k of Object.keys(b)) {
        if (!a[k]) a[k] = b[k];
        else if (key === 'wordProgress') {
          const A = a[k], B = b[k];
          a[k] = {
            ...B,
            level: Math.max(A.level || 0, B.level || 0),
            seen: (A.seen || 0) + (B.seen || 0),
            correct: (A.correct || 0) + (B.correct || 0),
            wrong: (A.wrong || 0) + (B.wrong || 0),
            reviews: (A.reviews || 0) + (B.reviews || 0),
            favorite: A.favorite || B.favorite,
            mastered: A.mastered || B.mastered,
            lastAt: (A.lastAt && B.lastAt) ? (A.lastAt > B.lastAt ? A.lastAt : B.lastAt) : (A.lastAt || B.lastAt),
            dueAt: A.dueAt || B.dueAt
          };
        }
      }
      s[key] = a;
    }
    // 数组型：按 id 去重
    for (const key of ['customWords', 'customArticles', 'readingAttempts', 'clozeAttempts', 'wordTests', 'translations',
                       'essays', 'examResults', 'mistakes', 'activity']) {
      const a = Array.isArray(s[key]) ? s[key] : [];
      const b = Array.isArray(incoming[key]) ? incoming[key] : [];
      const ids = new Set(a.map(x => x && x.id).filter(Boolean));
      const merged = a.concat(b.filter(x => !(x && x.id && ids.has(x.id))));
      merged.sort((x, y) => String(y.at || y.updatedAt || '').localeCompare(String(x.at || x.updatedAt || '')));
      s[key] = merged.slice(0, 800);
    }
    s.settings = { ...s.settings, ...(incoming.settings || {}) };
  });
  return { ok: true, mode, exportedAt: parsed.exportedAt };
}

export function resetAll() {
  state = DEFAULT_STATE();
  rawSet(JSON.stringify(state));
  listeners.forEach(l => { try { l(state); } catch {} });
  return state;
}

/** 统计概览（供首页/统计页复用） */
export function snapshot() {
  const s = get();
  const wp = Object.values(s.wordProgress);
  const d = today();
  const daily = s.daily[d] || { newWords: 0, reviews: 0, practice: 0, minutes: 0 };
  const mastered = wp.filter(x => x.mastered).length;
  const started = wp.filter(x => x.seen > 0).length;
  const due = wp.filter(x => x.dueAt && x.dueAt <= Date.now() && !x.mastered).length;
  const favorites = wp.filter(x => x.favorite).length;
  return {
    daily, started, mastered, due, favorites,
    reviewsDone: wp.reduce((n, x) => n + (x.reviews || 0), 0),
    coursesDone: Object.values(s.courses).filter(x => x.done).length,
    readingAttempts: s.readingAttempts.length,
    clozeAttempts: s.clozeAttempts.length,
    wordTests: s.wordTests.length,
    translations: s.translations.length,
    essays: s.essays.length,
    examResults: s.examResults.length,
    mistakesOpen: s.mistakes.filter(x => !x.mastered).length
  };
}
