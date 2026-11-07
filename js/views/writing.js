/* 写作训练：小作文/大作文/格式/素材/范文拆解/限时/草稿/历史/人工自评 */
import * as store from '../store.js';
import { ui } from '../ui.js';
import { esc, attr, fmtShort, fmtDate, fmtDuration } from '../utils.js';
import { WRITING_TOPICS, WRITING_FORMATS, WRITING_MATERIALS, WRITING_SAMPLES, WRITING_META } from '../../data/writing.js';

const TABS = [
  { id:'topics', name:'题目' }, { id:'materials', name:'素材库' }, { id:'formats', name:'应用文格式' },
  { id:'samples', name:'范文拆解' }, { id:'mine', name:'我的作文' }
];
let matCat = '全部';
let saveTimer = null;
let timer = { on:false, startedAt:0, accum:0, id:null, warned:false };

function ensureEssay(topicId, ctx) {
  const s = store.get();
  const qid = ctx.query.get('essay');
  let rec = qid ? s.essays.find(e => e.id === qid && e.topicId === topicId) : null;
  if (!rec) rec = s.essays.filter(e => e.topicId === topicId)[0];
  if (!rec) {
    const t = WRITING_TOPICS.find(x => x.id === topicId);
    const id = 'es-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    store.update(s2 => s2.essays.unshift({ id, topicId, title:t.title, content:'', status:'draft',
      at:new Date().toISOString(), updatedAt:new Date().toISOString(),
      minutes:0, selfScore:null, selfNote:'' }));
    rec = store.get().essays.find(e => e.id === id);
  }
  return rec;
}
function flushEssay() {
  const root = document.querySelector('[data-essay-id]');
  if (!root) return;
  const id = root.dataset.essayId;
  const ta = document.getElementById('essay-content');
  if (!ta) return;
  store.update(s => {
    const e = s.essays.find(x => x.id === id);
    if (e) { e.content = ta.value; e.updatedAt = new Date().toISOString(); e.minutes = Math.round((timer.accum + (timer.on ? Date.now() - timer.startedAt : 0)) / 60000); }
  });
}
function wordCount(text) {
  const en = String(text || '').match(/[A-Za-z][A-Za-z'-]*/g);
  return en ? en.length : 0;
}

function editorHTML(topic, rec, ctx) {
  const s = store.get();
  const hist = s.essays.filter(e => e.topicId === topic.id);
  const wc = wordCount(rec.content);
  const chart = topic.chart ? `<div class="card card-pad mb-3">
    <div class="t-sm t-bold mb-2">${esc(topic.chart.caption)}</div>
    <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead><tr>${topic.chart.headers.map(h => `<th style="text-align:left;padding:8px;border-bottom:1px solid var(--border-strong)">${esc(h)}</th>`).join('')}</tr></thead>
      <tbody>${topic.chart.rows.map(r => `<tr>${r.map(c => `<td style="padding:8px;border-bottom:1px solid var(--border)">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></div></div>` : '';
  const quickExpr = WRITING_MATERIALS.filter(m => ['开头','原因分析','结尾'].includes(m.cat)).slice(0, 6);

  return `<div data-essay-id="${attr(rec.id)}">
    <div class="card card-pad mb-3">
      <div class="flex between wrap gap-2"><div><div class="t-lg t-bold">${esc(topic.title)}</div>
        <div class="t-xs t-muted">${topic.kind === 'small' ? '小作文' : '大作文'} · ${esc(topic.wordLimit)} · 建议 ${topic.minutes} 分钟</div></div>
        <span class="chip ${rec.status === 'done' ? 'chip-success' : 'chip-warn'}">${rec.status === 'done' ? '已完成' : '草稿'}</span></div>
      <div class="bodytext mt-3" style="font-size:14px">${esc(topic.prompt)}</div>
    </div>
    ${chart}
    <div class="sticky-timer flex between wrap gap-2">
      <div class="flex gap-2"><span class="t-sm t-muted">限时写作</span><span class="timer" id="timer">${fmtDuration(Math.floor((timer.accum + (timer.on ? Date.now() - timer.startedAt : 0)) / 1000))}</span>
        <span class="t-xs t-muted">/ 建议 ${topic.minutes} 分钟</span></div>
      <div class="btn-row">
        <button class="btn btn-xs ${timer.on ? 'btn-outline' : 'btn-soft'}" data-action="toggle-timer">${timer.on ? '暂停计时' : '开始计时'}</button>
        <button class="btn btn-xs btn-ghost" data-action="reset-timer">重置</button>
      </div>
    </div>
    <div class="card card-pad mb-3">
      <div class="flex between mb-2"><b>作文正文</b><span class="t-xs t-muted" id="wc">约 ${wc} 词</span></div>
      <textarea class="editor" id="essay-content" data-input="essay" placeholder="在这里写作…输入会自动保存为草稿，关闭浏览器也不会丢失。">${esc(rec.content || '')}</textarea>
      <div class="t-xs t-muted mt-2" id="essay-save-state">最近保存：${esc(fmtShort(rec.updatedAt))}</div>
      <div class="btn-row mt-3">
        <button class="btn btn-outline btn-sm" data-action="save-essay">保存草稿</button>
        <button class="btn btn-outline btn-sm" data-action="self-rate">人工自评</button>
        <button class="btn btn-outline btn-sm" data-action="new-essay">新建一篇</button>
        <button class="btn btn-primary btn-sm" data-action="finish-essay">标记完成</button>
      </div>
    </div>
    ${rec.selfScore ? `<div class="card card-pad mb-3"><div class="t-sm t-bold mb-2">人工自评记录</div>
      ${Object.entries(rec.selfScore).map(([k, v]) => `<div class="kv"><span class="k">${esc(k)}</span><span class="v">${v} / 5</span></div>`).join('')}
      ${rec.selfNote ? `<div class="bodytext mt-2 t-sm">${esc(rec.selfNote)}</div>` : ''}</div>` : ''}
    <div class="card card-pad mb-3">
      <div class="t-sm t-bold mb-2">快捷插入常用表达</div>
      <div class="chips">${quickExpr.map(m => `<button class="chip chip-brand" data-action="insert-expr" data-expr="${attr(m.expr)}">${esc(m.expr.slice(0, 28))}…</button>`).join('')}</div>
      <div class="t-xs t-muted mt-2">更多句型见 <a href="#/writing?tab=materials">素材库</a>；插入后可自行改写。</div>
    </div>
    ${ui.sectionHead('这个题目的历史作文', '', `${hist.length} 篇`)}
    ${hist.length ? `<div class="list">${hist.map(h => `<button class="list-item" data-action="open-essay" data-id="${attr(h.id)}">
      <span class="li-ico ${h.status === 'done' ? 'green' : 'grey'}">${ui.icon('note', 18)}</span>
      <span class="li-main"><span class="li-title">${esc(fmtDate(h.at))} · ${h.status === 'done' ? '已完成' : '草稿'} · 约 ${wordCount(h.content)} 词</span>
        <span class="li-sub">${esc((h.content || '').slice(0, 46) || '（空白）')}</span></span>
      <span class="li-r">${h.id === rec.id ? '<span class="chip chip-brand">当前</span>' : '打开'}</span></button>`).join('')}</div>` : ''}
  </div>`;
}

export function render(ctx) {
  const topicId = ctx.params[0];
  if (topicId) {
    const topic = WRITING_TOPICS.find(t => t.id === topicId);
    if (!topic) return ui.empty('note', '题目不存在', '请返回题目列表。', `<a class="btn btn-primary" href="#/writing">返回</a>`);
    const rec = ensureEssay(topicId, ctx);
    return `${ui.backLink('#/writing?tab=topics', '返回题目列表')}
      ${ui.contentNotice(WRITING_META)}
      ${editorHTML(topic, rec, ctx)}`;
  }

  const tab = ctx.query.get('tab') || 'topics';
  const s = store.get();
  const tabBar = `<div class="tabs">${TABS.map(t => `<button class="${t.id === tab ? 'active' : ''}" data-action="tab" data-tab="${t.id}">${t.name}</button>`).join('')}</div>`;

  if (tab === 'topics') {
    return `${ui.contentNotice(WRITING_META)}${tabBar}
      ${ui.sectionHead('写作题目', '', `${WRITING_TOPICS.length} 道演示题`)}
      <div class="grid grid-md-2">${WRITING_TOPICS.map(t => {
        const hist = s.essays.filter(e => e.topicId === t.id);
        return `<a class="card card-pad" href="#/writing/${attr(t.id)}">
          <div class="flex between"><span class="chip ${t.kind === 'small' ? 'chip-brand' : 'chip-seal'}">${t.kind === 'small' ? '小作文' : '大作文'}</span>
            <span class="t-xs t-muted">${esc(t.wordLimit)}</span></div>
          <div class="t-md t-bold mt-2">${esc(t.title)}</div>
          <div class="t-sm t-muted clamp-3 mt-2">${esc(t.prompt)}</div>
          <div class="chips mt-3"><span class="chip ${hist.length ? 'chip-success' : ''}">已写 ${hist.length} 篇</span>
            <span class="chip chip-outline">建议 ${t.minutes} 分钟</span></div>
          <div class="btn btn-soft btn-block btn-sm mt-3">开始写作</div></a>`;
      }).join('')}</div>`;
  }

  if (tab === 'materials') {
    const cats = ['全部', ...Array.from(new Set(WRITING_MATERIALS.map(m => m.cat)))];
    const list = matCat === '全部' ? WRITING_MATERIALS : WRITING_MATERIALS.filter(m => m.cat === matCat);
    return `${tabBar}
      <div class="filter-row">${cats.map(c => `<button class="${c === matCat ? 'active' : ''}" data-action="mat-cat" data-cat="${attr(c)}">${esc(c)}</button>`).join('')}</div>
      <div class="list">${list.map(m => `<div class="list-item" style="align-items:flex-start">
        <span class="li-main"><span class="li-title">${esc(m.expr)}</span>
          <span class="li-sub">${esc(m.zh)} · ${esc(m.usage)}</span></span>
        <span class="chip chip-outline">${esc(m.cat)}</span></div>`).join('')}</div>
      <div class="notice mt-3">${ui.icon('info',16)}<div>以上为 AI 整理的通用写作表达，非教材原文；请在正式练习中自行核对语体与适用性。</div></div>`;
  }

  if (tab === 'formats') {
    return `${tabBar}${WRITING_FORMATS.map(f => `<div class="card card-pad mb-3">
      <div class="flex between"><b>${esc(f.name)}</b><span class="chip chip-brand">${esc(f.scene)}</span></div>
      <div class="t-sm t-ink2 mt-2"><b>结构：</b>${esc(f.structure)}</div>
      <div class="bodytext mt-3 mono" style="background:var(--surface-2);padding:12px;border-radius:var(--r-md);font-size:13px">${esc(f.skeleton)}</div>
      <div class="t-sm t-bold mt-3">要点</div><ul style="font-size:14px;color:var(--ink-2);line-height:1.9">${f.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>`).join('')}`;
  }

  if (tab === 'samples') {
    return `${tabBar}${WRITING_SAMPLES.map(sm => `<div class="card card-pad mb-3">
      <div class="flex between"><b>${esc(sm.title)}</b><span class="chip chip-warn">演示范文·AI编写</span></div>
      <div class="bodytext mt-3" style="font-family:var(--font-read);font-size:16px">${esc(sm.body)}</div>
      ${ui.sectionHead('逐段拆解')}
      ${sm.breakdown.map(b => `<div class="analysis mb-2"><h4>${esc(b.part)} · ${esc(b.role)}</h4>${esc(b.note)}</div>`).join('')}</div>`).join('')}`;
  }

  return `${tabBar}${ui.sectionHead('我的作文', '', `${s.essays.length} 篇`)}
    ${s.essays.length ? `<div class="list">${s.essays.map(e => `<div class="list-item">
      <span class="li-ico ${e.status === 'done' ? 'green' : 'grey'}">${ui.icon('note', 18)}</span>
      <span class="li-main"><span class="li-title">${esc(e.title)}</span>
        <span class="li-sub">${e.status === 'done' ? '已完成' : '草稿'} · 约 ${wordCount(e.content)} 词 · ${esc(fmtShort(e.updatedAt))}</span></span>
      <a class="btn btn-xs btn-soft" href="#/writing/${attr(e.topicId)}?essay=${attr(e.id)}">打开</a>
      <button class="btn btn-xs btn-ghost" data-action="delete-essay" data-id="${attr(e.id)}">删除</button></div>`).join('')}</div>`
      : ui.empty('note', '还没有作文', '从「题目」选一道开始写，草稿会自动保存。', `<a class="btn btn-primary" href="#/writing?tab=topics">去看题目</a>`)}`;
}

export const actions = {
  tab: (el, ctx) => ctx.setQuery('tab', el.dataset.tab),
  'mat-cat': (el, ctx) => { matCat = el.dataset.cat; ctx.refresh(); },
  'toggle-timer': (el, ctx) => {
    if (timer.on) { timer.accum += Date.now() - timer.startedAt; timer.on = false; stopTimer(); }
    else { timer.startedAt = Date.now(); timer.on = true; timer.warned = false; startTimer(ctx); }
    flushEssay(); ctx.refresh();
  },
  'reset-timer': (el, ctx) => { stopTimer(); timer = { on:false, startedAt:0, accum:0, id:null, warned:false }; flushEssay(); ctx.refresh(); },
  'insert-expr': (el, ctx) => {
    const ta = document.getElementById('essay-content');
    if (!ta) return ui.toast('请先打开一篇作文', 'err');
    const text = el.dataset.expr;
    const p = ta.selectionStart ?? ta.value.length;
    ta.value = ta.value.slice(0, p) + text + ta.value.slice(p);
    ta.focus(); ta.selectionStart = ta.selectionEnd = p + text.length;
    flushEssay();
    const wc = document.getElementById('wc'); if (wc) wc.textContent = '约 ' + wordCount(ta.value) + ' 词';
    ui.toast('已插入表达', 'ok');
  },
  'save-essay': (el, ctx) => { flushEssay(); store.addActivity('写作训练', '保存草稿', ''); ui.toast('草稿已保存', 'ok'); ctx.refresh(); },
  'finish-essay': (el, ctx) => {
    flushEssay();
    const root = document.querySelector('[data-essay-id]');
    store.update(s => { const e = s.essays.find(x => x.id === root.dataset.essayId); if (e) e.status = 'done'; });
    store.bumpDaily('practice', 1);
    store.addActivity('写作训练', '完成作文', wordCount(document.getElementById('essay-content').value) + ' 词');
    ui.toast('已标记为完成', 'ok'); ctx.refresh();
  },
  'new-essay': (el, ctx) => {
    flushEssay();
    const topicId = ctx.params[0], t = WRITING_TOPICS.find(x => x.id === topicId);
    const id = 'es-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    store.update(s => s.essays.unshift({ id, topicId, title:t.title, content:'', status:'draft',
      at:new Date().toISOString(), updatedAt:new Date().toISOString(), minutes:0, selfScore:null, selfNote:'' }));
    ctx.go(`#/writing/${topicId}?essay=${id}`);
  },
  'open-essay': (el, ctx) => { flushEssay(); ctx.go(`#/writing/${ctx.params[0]}?essay=${el.dataset.id}`); },
  'delete-essay': (el, ctx) => {
    ui.confirmSheet({ title:'删除这篇作文？', desc:'删除后无法恢复，建议先在「数据与设置」导出备份。', okText:'删除', danger:true,
      onOk:() => { store.update(s => { s.essays = s.essays.filter(e => e.id !== el.dataset.id); }); ui.toast('已删除', 'ok'); ctx.refresh(); } });
  },
  'self-rate': (el, ctx) => {
    flushEssay();
    const root = document.querySelector('[data-essay-id]');
    const rec = store.get().essays.find(e => e.id === root.dataset.essayId);
    const dims = ['内容要点完整','结构清晰','语言表达','格式规范'];
    const prev = rec.selfScore || {};
    ui.openSheet({ title:'人工自评', body:`
      <div class="sheet-desc">本站不自动评阅作文。请对照题目要点与范文拆解自行评分，结果仅保存在本机。</div>
      ${dims.map((d, i) => `<label class="field"><span class="field-label">${esc(d)}</span>
        <select class="select" id="sr-${i}">${[1,2,3,4,5].map(v => `<option value="${v}" ${prev[d] === v ? 'selected' : ''}>${v} 分</option>`).join('')}</select></label>`).join('')}
      <label class="field"><span class="field-label">自评备注</span><textarea class="textarea" id="sr-note">${esc(rec.selfNote || '')}</textarea></label>`,
      actions:[{ label:'取消', cls:'btn-outline' }, { label:'保存自评', cls:'btn-primary',
        onClick:() => {
          const sc = {};
          dims.forEach((d, i) => { sc[d] = Number(document.getElementById('sr-' + i)?.value || 3); });
          const note = document.getElementById('sr-note')?.value || '';
          store.update(s => { const e = s.essays.find(x => x.id === rec.id); if (e) { e.selfScore = sc; e.selfNote = note; } });
          ui.toast('自评已保存', 'ok');
          ctx.refresh();
        } }] });
  }
};

function startTimer(ctx) {
  stopTimer();
  timer.id = setInterval(() => {
    const el = document.getElementById('timer');
    if (!el) { stopTimer(); return; }
    const sec = Math.floor((timer.accum + (timer.on ? Date.now() - timer.startedAt : 0)) / 1000);
    el.textContent = fmtDuration(sec);
    const topic = WRITING_TOPICS.find(t => t.id === ctx.params[0]);
    if (topic && sec >= topic.minutes * 60 && !timer.warned) {
      timer.warned = true; ui.toast('建议用时已到，可继续写或标记完成', 'ok');
      el.classList.add('urgent');
    }
  }, 1000);
}
function stopTimer() { if (timer.id) { clearInterval(timer.id); timer.id = null; } }

export function onInput(el, ctx) {
  if (el.dataset.input !== 'essay') return;
  clearTimeout(saveTimer);
  const wc = document.getElementById('wc');
  if (wc) wc.textContent = '约 ' + wordCount(el.value) + ' 词';
  saveTimer = setTimeout(() => {
    flushEssay();
    const st = document.getElementById('essay-save-state');
    if (st) st.textContent = '已自动保存 · ' + new Date().toLocaleTimeString('zh-CN', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  }, 350);
}
export function mount(root, ctx) { if (ctx.params[0] && timer.on) startTimer(ctx); }
export function unmount() {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
  try { flushEssay(); } catch {}
  stopTimer();
}
