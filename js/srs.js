/* ============================================================
   间隔复习（SRS）—— 简化 SM-2 + 逾期优先
   ------------------------------------------------------------
   level 0 = 未学；1-7 = 熟练度；间隔按天数递增
   评分：again(忘了) / hard(勉强) / good(记得) / easy(很熟)
   逾期越久、熟练度越低，复习优先级越高
   ============================================================ */
import { nowISO, today } from './utils.js';
import * as store from './store.js';

export const INTERVALS = [0, 1, 2, 4, 7, 15, 30, 60]; // 各 level 对应的复习间隔（天）
export const LEVEL_NAMES = ['未学', '初识', '熟悉中', '有印象', '较熟', '熟练', '很熟', '掌握'];

export function levelName(n) { return LEVEL_NAMES[Math.min(LEVEL_NAMES.length - 1, Math.max(0, n | 0))]; }

/** 对某个词评分；直接改写 rec 并返回摘要 */
export function grade(rec, g) {
  const now = Date.now();
  let level = rec.level || 0;
  let interval = rec.interval || 0;

  if (g === 'again') {
    level = Math.max(0, level - 2);
    interval = 0;
    rec.dueAt = now + 10 * 60 * 1000;   // 10 分钟后重现，当天必须再过一遍
    rec.lapses = (rec.lapses || 0) + 1;
    rec.wrong = (rec.wrong || 0) + 1;
  } else if (g === 'hard') {
    level = Math.max(1, level);
    interval = Math.max(1, Math.round((interval || 1) * 1.2));
    rec.dueAt = now + interval * 86400000;
    rec.correct = (rec.correct || 0) + 1;
  } else if (g === 'easy') {
    level = Math.min(7, level + 2);
    interval = Math.round((INTERVALS[level] || 60) * 1.5);
    rec.dueAt = now + interval * 86400000;
    rec.correct = (rec.correct || 0) + 1;
  } else { // good
    level = Math.min(7, level + 1);
    interval = INTERVALS[level] || 60;
    rec.dueAt = now + interval * 86400000;
    rec.correct = (rec.correct || 0) + 1;
  }

  rec.level = level;
  rec.interval = interval;
  rec.lastAt = nowISO();
  rec.reviews = (rec.reviews || 0) + 1;
  rec.seen = (rec.seen || 0) + 1;
  return { level, interval, dueAt: rec.dueAt, g };
}

/** 到期复习队列：按「逾期天数降序 + 熟练度升序」排列 */
export function dueQueue(words) {
  const prog = store.get().wordProgress;
  const now = Date.now();
  const out = [];
  for (const w of words) {
    const r = prog[w.word];
    if (!r || !r.dueAt || r.mastered) continue;
    if (r.dueAt > now) continue;
    const overdueDays = (now - r.dueAt) / 86400000;
    out.push({ word: w, rec: r, overdueDays, priority: overdueDays * 10 + (7 - (r.level || 0)) });
  }
  out.sort((a, b) => b.priority - a.priority);
  return out;
}

/** 新词队列：从未学过（seen=0）的词中按词频/年份优先取 */
export function newQueue(words, limit = 20) {
  const prog = store.get().wordProgress;
  const pool = words.filter(w => {
    const r = prog[w.word];
    return !r || !r.seen;
  });
  pool.sort((a, b) => {
    // 有完整释义的演示词条优先，其次按年份覆盖数、词频
    const sa = (a.source === 'core' ? 1000 : 0) + (a.years || []).length * 10 + (a.freq || 0);
    const sb = (b.source === 'core' ? 1000 : 0) + (b.years || []).length * 10 + (b.freq || 0);
    return sb - sa;
  });
  return pool.slice(0, limit);
}

/** 今日复习完成率：已完成本次到期的比例 */
export function reviewProgress() {
  const s = store.get();
  const prog = Object.values(s.wordProgress);
  const started = prog.filter(r => r.seen > 0);
  const due = prog.filter(r => r.dueAt && r.dueAt <= Date.now() && !r.mastered);
  const doneToday = s.daily[today()] || {};
  return { started: started.length, due: due.length, doneToday: doneToday.reviews || 0 };
}

/** 未来 7 天复习量预测（用于首页/统计） */
export function forecast(words, days = 7) {
  const prog = store.get().wordProgress;
  const now = Date.now();
  const out = Array.from({ length: days }, (_, i) => ({ day: i, count: 0 }));
  for (const r of Object.values(prog)) {
    if (!r.dueAt || r.mastered) continue;
    const diff = Math.ceil((r.dueAt - now) / 86400000);
    if (diff < 0) out[0].count++;
    else if (diff < days) out[diff].count++;
  }
  return out;
}

/** 掌握度分布（用于统计页） */
export function levelDistribution() {
  const prog = Object.values(store.get().wordProgress);
  const out = Array(8).fill(0);
  for (const r of prog) out[Math.min(7, r.level || 0)]++;
  return out;
}
