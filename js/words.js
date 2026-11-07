/* ============================================================
   词库索引层 —— 合并三类词条，统一查询与分类
   优先级：用户导入/编辑 > 核心演示词条 > 资料抽取词形
   静态词库不写入 localStorage；只有掌握进度写入 store
   ============================================================ */
import { CORE_WORDS, CORE_META } from '../data/words.core.js';
import { CORPUS_WORDS, CORPUS_BY_YEAR, CORPUS_META } from '../data/words.corpus.js';
import * as store from './store.js';
import { normalizeWord } from './utils.js';

export { CORE_META, CORPUS_META, CORPUS_BY_YEAR };

let cache = null;
let cacheStamp = '';

export function allWords() {
  const s = store.get();
  const stamp = String(s.customWords.length) + ':' + String(s.updatedAt);
  if (cache && cacheStamp === stamp) return cache;
  const map = new Map();

  // 1) 用户资料抽取词形（仅词形 + 年份，无释义）
  for (const c of CORPUS_WORDS) {
    map.set(c.w, {
      id: 'u-' + c.w, word: c.w, phonetic: '', pos: '', meaning: '',
      example: '', exampleZh: '', collocations: [], rare: '',
      tier: c.tier, years: c.years || [], freq: c.freq || 0, tags: [],
      source: 'corpus', label: 'user'
    });
  }
  // 2) 核心演示词条（完整字段，覆盖同名资料词形）
  for (const c of CORE_WORDS) {
    const k = normalizeWord(c.word);
    map.set(k, { ...c, years: [], freq: 0, source: 'core', label: c.label || 'ai' });
  }
  // 3) 用户导入 / 手工编辑（最高优先级）
  for (const c of (s.customWords || [])) {
    const k = normalizeWord(c.word);
    if (!k) continue;
    map.set(k, {
      id: c.id || 'x-' + k, word: k, phonetic: c.phonetic || '', pos: c.pos || '',
      meaning: c.meaning || '', example: c.example || '', exampleZh: c.exampleZh || '',
      collocations: Array.isArray(c.collocations) ? c.collocations : [],
      rare: c.rare || '', tier: c.tier || 'mid', years: c.years || [], freq: 0,
      tags: Array.isArray(c.tags) ? c.tags : [], source: 'custom', label: 'user',
      exampleLabel: c.exampleLabel || 'user'
    });
  }
  cache = Array.from(map.values());
  cacheStamp = stamp;
  return cache;
}

export function wordMap() {
  const m = new Map();
  for (const w of allWords()) m.set(w.word, w);
  return m;
}
export function getWord(w) { return wordMap().get(normalizeWord(w)) || null; }
export function invalidate() { cache = null; cacheStamp = ''; }

/** 保存/覆盖一个词条到用户自定义层 */
export function upsertCustomWord(obj) {
  const k = normalizeWord(obj.word);
  if (!k) return false;
  store.update(s => {
    const idx = (s.customWords || []).findIndex(x => normalizeWord(x.word) === k);
    const item = { ...obj, word: k, id: obj.id || 'x-' + k, updatedAt: new Date().toISOString() };
    if (idx >= 0) s.customWords[idx] = { ...s.customWords[idx], ...item };
    else s.customWords.unshift(item);
  });
  invalidate();
  return true;
}

/** 词表分类（按词汇表 + 词频） */
export function wordLists() {
  const years = Object.keys(CORPUS_BY_YEAR).sort();
  return [
    { id: 'core', name: '核心演示词库', desc: `${CORE_WORDS.length} 词 · 含音标/例句/搭配/熟词僻义`, label: 'ai', filter: w => w.source === 'core' },
    { id: 'high', name: '资料词形 · 高频', desc: '出现在 ≥3 个年份段的词形', label: 'user', filter: w => w.source === 'corpus' && w.tier === 'high' },
    { id: 'mid', name: '资料词形 · 中频', desc: '出现在 2 个年份段的词形', label: 'user', filter: w => w.source === 'corpus' && w.tier === 'mid' },
    { id: 'low', name: '资料词形 · 低频', desc: '仅出现在 1 个年份段的词形', label: 'user', filter: w => w.source === 'corpus' && w.tier === 'low' },
    { id: 'custom', name: '我导入 / 编辑的词', desc: '用户自建词条，优先显示', label: 'user', filter: w => w.source === 'custom' },
    ...years.map(y => ({ id: 'y' + y, name: `${y} 年词形`, desc: `来自用户资料的 ${y} 年段（仅词形）`, label: 'user',
      filter: w => Array.isArray(w.years) && w.years.includes(y) && w.source === 'corpus' }))
  ];
}

export function listWords(listId) {
  const l = wordLists().find(x => x.id === listId);
  if (!l) return allWords();
  return allWords().filter(l.filter);
}

export function searchWords(q, limit = 60) {
  const s = String(q || '').trim().toLowerCase();
  if (!s) return allWords().slice(0, limit);
  return allWords().filter(w => w.word.includes(s) || (w.meaning || '').includes(s)).slice(0, limit);
}

/** 词条的掌握记录 */
export function recOf(word) { return store.wordRec(normalizeWord(word)); }

/** 来源标签文案 */
export function sourceLabel(w) {
  if (w.source === 'core') return { cls: 'label-ai', text: '演示·AI示例' };
  if (w.source === 'custom') return { cls: 'label-user', text: '我导入/编辑' };
  return { cls: 'label-import', text: '用户资料·仅词形' };
}
