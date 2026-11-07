/* 翻译训练：逐句输入 / 自动保存 / 历史译文 / 参考译文对照 / 语法与长难句 */
import * as store from '../store.js';
import { ui } from '../ui.js';
import { esc, attr, fmtShort, fmtDate } from '../utils.js';
import { TRANSLATION_TASKS, TRANSLATION_REFS, TRANSLATION_META } from '../../data/translation.js';

let showRef = false;
let saveTimer = null;

function ensureDraft(taskId, ctx) {
  const s = store.get();
  const qid = ctx.query.get('draft');
  let rec = qid ? s.translations.find(t => t.id === qid && t.taskId === taskId) : null;
  if (!rec) rec = s.translations.filter(t => t.taskId === taskId)[0];
  if (!rec) {
    const task = TRANSLATION_TASKS.find(t => t.id === taskId);
    const id = 'tr-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    store.update(s2 => s2.translations.unshift({
      id, taskId, title:task.title, at:new Date().toISOString(),
      updatedAt:new Date().toISOString(), sentences:{}, note:''
    }));
    rec = store.get().translations.find(t => t.id === id);
  }
  return rec;
}

/** 把页面上的译文立即写入本地存储 */
function flushSave() {
  const root = document.querySelector('[data-draft-id]');
  if (!root) return;
  const id = root.dataset.draftId;
  const inputs = document.querySelectorAll('[data-input="trans"]');
  const sentences = {};
  inputs.forEach(el => { sentences[el.dataset.no] = el.value; });
  store.update(s => {
    const r = s.translations.find(t => t.id === id);
    if (r) { r.sentences = sentences; r.updatedAt = new Date().toISOString(); }
  });
  return sentences;
}

export function render(ctx) {
  const id = ctx.params[0];
  if (!id) {
    const s = store.get();
    return `${ui.contentNotice(TRANSLATION_META)}
      ${ui.sectionHead('翻译训练', '', `${TRANSLATION_TASKS.length} 个演示段落`)}
      <div class="grid grid-md-2">${TRANSLATION_TASKS.map(t => {
        const hist = s.translations.filter(x => x.taskId === t.id);
        return `<a class="card card-pad" href="#/translation/${attr(t.id)}">
          <div class="article-title" style="font-size:18px">${esc(t.title)}</div>
          <div class="meta-row mt-2 mb-3"><span class="chip">${t.sentences.length} 句</span>
            <span class="chip chip-outline">建议 ${t.minutes} 分钟</span>${ui.labelChip('ai','演示材料')}</div>
          <div class="t-sm t-muted clamp-3">${esc(t.fullText)}</div>
          <div class="chips mt-3"><span class="chip ${hist.length ? 'chip-success' : ''}">历史译文 ${hist.length} 份</span></div>
          <div class="btn btn-soft btn-block btn-sm mt-3">开始翻译</div></a>`;
      }).join('')}</div>
      ${ui.sectionHead('我的译文记录')}
      ${s.translations.length ? `<div class="list">${s.translations.slice(0, 10).map(r => `
        <a class="list-item" href="#/translation/${attr(r.taskId)}?draft=${attr(r.id)}">
          <span class="li-ico">${ui.icon('pen', 18)}</span>
          <span class="li-main"><span class="li-title">${esc(r.title)}</span>
            <span class="li-sub">${Object.values(r.sentences || {}).filter(Boolean).length} 句已填 · ${esc(fmtShort(r.updatedAt))}</span></span>
          <span class="li-r">${ui.icon('arrow', 16)}</span></a>`).join('')}</div>`
        : `<div class="card card-pad t-sm t-muted t-center">还没有译文。逐句输入会自动保存，关闭浏览器也不会丢失。</div>`}`;
  }
  const task = TRANSLATION_TASKS.find(t => t.id === id);
  if (!task) return ui.empty('pen', '练习不存在', '请返回列表。', `<a class="btn btn-primary" href="#/translation">返回列表</a>`);
  const rec = ensureDraft(id, ctx);
  const s = store.get();
  const hist = s.translations.filter(x => x.taskId === id);
  const refs = TRANSLATION_REFS[id] || [];
  const filled = Object.values(rec.sentences || {}).filter(v => (v || '').trim()).length;
  const chars = Object.values(rec.sentences || {}).join('').length;

  return `${ui.backLink('#/translation', '返回翻译列表')}
    ${ui.contentNotice(TRANSLATION_META)}
    <div data-draft-id="${attr(rec.id)}">
    <div class="card card-pad mb-3">
      <div class="flex between wrap gap-2"><div><div class="t-lg t-bold">${esc(task.title)}</div>
        <div class="t-xs t-muted">原文来源：${esc(task.source)} · ${task.sentences.length} 句</div></div>
        <span class="chip chip-brand">第 ${hist.findIndex(h => h.id === rec.id) + 1} 份译文</span></div>
      <div class="btn-row mt-3">
        <button class="btn btn-outline btn-sm" data-action="toggle-ref">${showRef ? '隐藏参考译文' : '显示参考译文'}</button>
        <button class="btn btn-outline btn-sm" data-action="new-draft">新建一次翻译</button>
        <button class="btn btn-primary btn-sm" data-action="save-now">保存</button>
      </div>
      <div class="t-xs t-muted mt-2" id="save-state">已填 ${filled}/${task.sentences.length} 句 · 共 ${chars} 字 · 输入后自动保存（${esc(fmtShort(rec.updatedAt))}）</div>
    </div>

    <div class="card card-pad mb-3">
      <div class="t-sm t-bold mb-2">英文原文（可点句末朗读）</div>
      <div class="prose" style="font-size:16px"><p class="no-indent">${esc(task.fullText)}</p></div>
      <button class="speak-btn mt-2" data-speak="${attr(task.fullText)}">${ui.icon('sound', 17)} 朗读全文</button>
    </div>

    ${ui.sectionHead('逐句翻译')}
    ${task.sentences.map((sn, i) => {
      const ref = refs.find(r => r.no === sn.no);
      return `<div class="card card-pad mb-3">
        <div class="flex between mb-2"><b>第 ${sn.no} 句</b>
          <button class="btn btn-xs btn-ghost" data-speak="${attr(sn.en)}">${ui.icon('sound', 15)} 朗读</button></div>
        <div class="sentence-card"><div class="sentence-en">${esc(sn.en)}</div></div>
        <div class="t-sm t-bold mt-3">重点语法</div><div class="t-sm t-ink2">${esc(sn.grammar)}</div>
        <div class="t-sm t-bold mt-2">长难句拆解</div><div class="sentence-split">${esc(sn.split)}</div>
        <div class="t-sm t-bold mt-3">我的译文</div>
        <textarea class="editor mt-2" data-input="trans" data-no="${sn.no}" placeholder="在这里输入中文译文，输入后自动保存…">${esc((rec.sentences || {})[sn.no] || '')}</textarea>
        ${showRef && ref ? `<div class="ref-box mt-3">
          <div class="t-xs t-bold t-success mb-1">参考译文（演示）</div>${esc(ref.ref)}
          <div class="t-xs t-muted mt-2">译法说明：${esc(ref.note)}</div></div>` : ''}
      </div>`;
    }).join('')}

    ${showRef ? `<div class="notice warn">${ui.icon('info',16)}<div>参考译文为演示示例，非官方参考译文，仅用于自评对照；请重点关注语法分析与拆句方法。</div></div>` : ''}

    ${ui.sectionHead('历史翻译', '', `${hist.length} 份`)}
    ${hist.length ? `<div class="list">${hist.map(h => `<button class="list-item ${h.id === rec.id ? 'active-draft' : ''}"
      data-action="open-draft" data-id="${attr(h.id)}">
      <span class="li-ico grey">${ui.icon('note', 18)}</span>
      <span class="li-main"><span class="li-title">${esc(fmtDate(h.at))} 创建</span>
        <span class="li-sub">${Object.values(h.sentences || {}).filter(Boolean).length} 句已填 · 最近编辑 ${esc(fmtShort(h.updatedAt))}</span></span>
      <span class="li-r">${h.id === rec.id ? '<span class="chip chip-brand">当前</span>' : '打开'}</span></button>`).join('')}</div>` : ''}
    </div>`;
}

export const actions = {
  'toggle-ref': (el, ctx) => { flushSave(); showRef = !showRef; ctx.refresh(); },
  'save-now': (el, ctx) => {
    flushSave();
    store.addActivity('翻译训练', TRANSLATION_TASKS.find(t => t.id === ctx.params[0]).title, '保存译文');
    ui.toast('译文已保存到本机', 'ok');
    ctx.refresh();
  },
  'new-draft': (el, ctx) => {
    flushSave();
    const taskId = ctx.params[0];
    const task = TRANSLATION_TASKS.find(t => t.id === taskId);
    const id = 'tr-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    store.update(s => s.translations.unshift({ id, taskId, title:task.title,
      at:new Date().toISOString(), updatedAt:new Date().toISOString(), sentences:{}, note:'' }));
    showRef = false;
    ctx.go(`#/translation/${taskId}?draft=${id}`);
  },
  'open-draft': (el, ctx) => { flushSave(); showRef = false; ctx.go(`#/translation/${ctx.params[0]}?draft=${el.dataset.id}`); }
};

export function onInput(el, ctx) {
  if (el.dataset.input !== 'trans') return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    flushSave();
    const st = document.getElementById('save-state');
    if (st) st.textContent = '已自动保存 · ' + new Date().toLocaleTimeString('zh-CN', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  }, 350);
}

export function unmount() { if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; } try { flushSave(); } catch {} }
