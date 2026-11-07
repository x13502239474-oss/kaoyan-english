/* ============================================================
   通用 UI 组件 —— 与考研系列共享设计系统（tokens.css / app.css）
   ============================================================ */
import { esc, attr } from './utils.js';

/* ---- 图标（统一 24x24 stroke 风格） ---- */
const P = {
  home:'<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  book:'<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 1 4 17.5z"/><path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20"/>',
  card:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 10h10M7 14h6"/>',
  pen:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/>',
  chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.56V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9v.09a1.7 1.7 0 0 0 1.56 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1z"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check:'<path d="M20 6 9 17l-5-5"/>',
  x:'<path d="M18 6 6 18M6 6l12 12"/>',
  arrow:'<path d="M9 18l6-6-6-6"/>',
  back:'<path d="M15 18l-6-6 6-6"/>',
  sound:'<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>',
  star:'<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
  refresh:'<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>',
  download:'<path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M4 17v3h16v-3"/>',
  upload:'<path d="M12 21V9m0 0 4 4m-4-4-4 4"/><path d="M4 7V4h16v3"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  alert:'<path d="M12 3 2 20h20z"/><path d="M12 9v5M12 17h.01"/>',
  note:'<path d="M5 3h14v18H5z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  play:'<path d="m8 5 11 7-11 7z"/>',
  layers:'<path d="m12 2 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>',
  shuffle:'<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
  filter:'<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
  trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'
};
export function icon(name, size = 20) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || P.info}</svg>`;
}

/* ---- Toast ---- */
export function toast(msg, type = '') {
  const root = document.getElementById('toast-root');
  if (!root) return;
  const el = document.createElement('div');
  el.className = 'toast ' + (type || '');
  el.textContent = msg;
  root.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .25s'; }, 2200);
  setTimeout(() => el.remove(), 2550);
}

/* ---- 底部抽屉 / 弹层 ---- */
let sheetEl = null;
export function openSheet({ title = '', body = '', actions = [], onClose = null }) {
  closeSheet(true);
  const root = document.getElementById('overlay-root');
  if (!root) return;
  sheetEl = document.createElement('div');
  sheetEl.className = 'overlay';
  sheetEl.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">
    <div class="sheet-handle"></div>
    ${title ? `<div class="sheet-title">${title}</div>` : ''}
    <div class="sheet-body">${body}</div>
    ${actions.length ? `<div class="sheet-actions">${actions.map((a, i) =>
      `<button class="btn ${a.cls || 'btn-outline'}" data-sheet-act="${i}">${esc(a.label)}</button>`).join('')}</div>` : ''}
  </div>`;
  root.appendChild(sheetEl);
  sheetEl.addEventListener('click', (e) => {
    if (e.target === sheetEl) { closeSheet(); onClose && onClose(); }
    const b = e.target.closest('[data-sheet-act]');
    if (b) {
      const a = actions[Number(b.dataset.sheetAct)];
      if (!a) return;
      // 先执行回调（此时弹层 DOM 仍在，可读取表单值），再关闭弹层
      if (a.keepOpen) { a.onClick && a.onClick(sheetEl); }
      else { try { a.onClick && a.onClick(sheetEl); } finally { closeSheet(); } }
    }
  });
  return sheetEl;
}
export function closeSheet(silent = false) {
  if (sheetEl) { const el = sheetEl; sheetEl = null; el.remove(); }
}
export function confirmSheet({ title = '确认操作', desc = '', okText = '确定', danger = false, onOk }) {
  return openSheet({
    title,
    body: `<div class="sheet-desc">${desc}</div>`,
    actions: [
      { label: '取消', cls: 'btn-outline' },
      { label: okText, cls: danger ? 'btn-danger' : 'btn-primary', onClick: () => onOk && onOk() }
    ]
  });
}

/* ---- 内容来源标注（全站统一） ---- */
const LABELS = {
  demo:  { cls: 'label-demo',   text: '演示内容' },
  ai:    { cls: 'label-ai',     text: 'AI生成示例' },
  user:  { cls: 'label-user',   text: '用户资料' },
  import:{ cls: 'label-import', text: '用户导入' }
};
export function labelChip(label, text) {
  const L = LABELS[label] || LABELS.demo;
  return `<span class="chip ${L.cls}">${esc(text || L.text)}</span>`;
}
export function contentNotice(meta, extra = '') {
  if (!meta) return '';
  return `<div class="notice">${icon('info', 16)}<div>
    ${labelChip(meta.contentLabel || 'demo', meta.labelText)} ${esc(meta.disclaimer || '')}
    ${extra ? `<div class="mt-1">${esc(extra)}</div>` : ''}
  </div></div>`;
}

/* ---- 常用片段 ---- */
export function empty(iconName, title, desc, actionHTML = '') {
  return `<div class="empty"><div class="e-ico">${icon(iconName, 38)}</div>
    <div class="e-title">${esc(title)}</div>
    <div class="e-desc">${esc(desc)}</div>${actionHTML}</div>`;
}
export function progressBar(percent, thin = false) {
  return `<div class="progress ${thin ? 'thin' : ''}"><i style="width:${Math.max(0, Math.min(100, percent))}%"></i></div>`;
}
export function statCard(num, label, sub = '') {
  return `<div class="card card-pad"><div class="stat-num">${esc(num)}</div>
    <div class="stat-label">${esc(label)}</div>${sub ? `<div class="t-xs t-muted mt-1">${esc(sub)}</div>` : ''}</div>`;
}
export function sectionHead(title, moreHTML = '', cap = '') {
  return `<div class="section-head"><h2>${esc(title)}</h2>${cap ? `<span class="cap">${esc(cap)}</span>` : ''}${moreHTML}</div>`;
}
export function backLink(href, text) {
  return `<a class="btn btn-ghost btn-sm mb-3" href="${attr(href)}">${icon('back', 16)} ${esc(text)}</a>`;
}
export function optionLetters(n = 4) { return 'ABCD'.slice(0, n).split(''); }

/** 生成一个带有 data-action 的按钮 */
export function actionBtn(action, label, cls = 'btn-outline btn-sm', extra = '') {
  return `<button class="btn ${cls}" data-action="${attr(action)}" ${extra}>${label}</button>`;
}

/** 命名空间导出：视图层统一使用 `import { ui } from '../ui.js'` */
export const ui = {
  icon, toast, openSheet, closeSheet, confirmSheet, labelChip, contentNotice,
  empty, progressBar, statCard, sectionHead, backLink, optionLetters, actionBtn
};
