/* 通用工具函数（无副作用，可在浏览器与 Node 中复用） */

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** HTML 转义：所有动态内容插入 innerHTML 前必须调用 */
export function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** 属性安全转义（同 esc，额外处理换行） */
export const attr = (v) => esc(v).replace(/\n/g, '&#10;');

export function uid(prefix = 'id') {
  return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

/** 本地日期 YYYY-MM-DD（不用 toISOString，避免 UTC 跨日） */
export function today(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export const nowISO = () => new Date().toISOString();
export const nowMs = () => Date.now();

export function dayDiff(a, b) {
  const pa = String(a).slice(0, 10).split('-').map(Number);
  const pb = String(b).slice(0, 10).split('-').map(Number);
  const da = Date.UTC(pa[0], pa[1] - 1, pa[2]);
  const db = Date.UTC(pb[0], pb[1] - 1, pb[2]);
  return Math.round((db - da) / 86400000);
}
export function daysFromNow(n, from = Date.now()) { return from + n * 86400000; }

export function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
export function fmtShort(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  const p = (n) => String(n).padStart(2, '0');
  const t = today(d) === today() ? '今天' : `${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  return `${t} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
export function fmtDuration(sec) {
  sec = Math.max(0, Math.floor(sec || 0));
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
export function fmtClock(ms) {
  const d = new Date(ms);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }
export function pct(a, b) { return b > 0 ? Math.round((a / b) * 100) : 0; }
export function sum(arr) { return arr.reduce((s, x) => s + (Number(x) || 0), 0); }

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function pick(arr, n) { return shuffle(arr).slice(0, Math.max(0, n)); }

export function normalizeWord(w) {
  return String(w || '').trim().toLowerCase().replace(/[^a-z'-]/g, '');
}

/** 稳定去重 */
export function uniq(arr) { return Array.from(new Set(arr)); }

export function debounce(fn, wait = 250) {
  let t;
  return function (...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), wait); };
}

/** 下载文本文件 */
export function downloadFile(filename, text, mime = 'application/json;charset=utf-8') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 400);
}

export function readFileText(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('文件读取失败'));
    r.readAsText(file, 'utf-8');
  });
}

/** 把多行英文文本按段落渲染成带编号的 HTML */
export function paragraphsHTML(text, cls = 'prose') {
  return String(text || '').split(/\n\s*\n|\n/).filter(s => s.trim())
    .map((p, i) => `<p data-para="${i + 1}"><span class="para-no">${i + 1}</span>${esc(p.trim())}</p>`).join('');
}

export function plural(n, word) { return `${n} ${word}`; }

/** 简易 CSV/JSON 行解析：用于批量导入词条（每行 "单词,音标,词性,释义" 或 JSON 数组） */
export function parseWordLines(text) {
  const t = String(text || '').trim();
  if (!t) return [];
  if (t.startsWith('[') || t.startsWith('{')) {
    try {
      const j = JSON.parse(t);
      const arr = Array.isArray(j) ? j : (j.words || []);
      return arr.map(x => typeof x === 'string' ? { word: x } : (x || {})).filter(x => x.word);
    } catch { return []; }
  }
  return t.split(/\r?\n/).map(line => {
    const parts = line.split(/\t|,|，/).map(s => s.trim()).filter(Boolean);
    if (!parts.length) return null;
    const [word, phonetic, pos, ...rest] = parts;
    return { word, phonetic: phonetic || '', pos: pos || '', meaning: rest.join('，') || '' };
  }).filter(x => x && x.word);
}
