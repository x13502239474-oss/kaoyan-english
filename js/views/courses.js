/* 课程学习：六类分类 / 知识点 / 重点难点 / 例句 / 解析 / 笔记 / 完成 / 复习计划 */
import * as store from '../store.js';
import { ui } from '../ui.js';
import { esc, attr, pct } from '../utils.js';
import { COURSES, CATEGORIES, COURSE_META } from '../../data/courses.js';

let cat = 'all';
let noteTimer = null;
let currentId = null;

function courseState(id) {
  return store.get().courses[id] || { done:false, note:'', inReview:false, doneAt:null };
}
function setCourse(id, patch) {
  store.update(s => { s.courses[id] = { ...(s.courses[id] || { done:false, note:'', inReview:false, doneAt:null }), ...patch }; });
}
function flushNote(id) {
  const ta = document.getElementById('course-note');
  if (!ta) return;
  setCourse(id, { note:ta.value });
}

export function render(ctx) {
  const id = ctx.params[0];
  const s = store.get();
  const doneCount = Object.values(s.courses).filter(c => c.done).length;

  currentId = id || null;
  if (id) {
    const c = COURSES.find(x => x.id === id);
    if (!c) return ui.empty('layers', '课程不存在', '请返回课程列表。', `<a class="btn btn-primary" href="#/courses">返回</a>`);
    const st = courseState(id);
    const category = CATEGORIES.find(x => x.id === c.cat);
    const idx = COURSES.findIndex(x => x.id === id);
    const prev = COURSES[idx - 1], next = COURSES[idx + 1];

    return `${ui.backLink('#/courses', '返回课程列表')}
      ${ui.contentNotice(COURSE_META)}
      <div class="card card-pad mb-3">
        <div class="flex between wrap gap-2"><div><div class="t-xl t-bold">${esc(c.title)}</div>
          <div class="t-xs t-muted mt-1">${esc(category.name)} · ${esc(c.level)} · 建议 ${c.minutes} 分钟</div></div>
          ${st.done ? '<span class="chip chip-success">已完成</span>' : '<span class="chip chip-outline">未完成</span>'}</div>
        <div class="chips mt-3">${c.keywords.map(k => `<span class="chip chip-brand">${esc(k)}</span>`).join('')}</div>
      </div>

      <div class="card card-pad mb-3"><div class="t-md t-bold mb-2">知识点说明</div>
        ${c.points.map((p, i) => `<div class="task-row"><span class="pill-num">${i + 1}</span><span class="t-sm flex-1">${esc(p)}</span></div>`).join('')}</div>

      <div class="card card-pad mb-3"><div class="t-md t-bold mb-2">重点与难点</div>
        <ul style="font-size:14px;line-height:1.9;color:var(--ink-2);padding-left:1.2em">${c.difficulties.map(d => `<li>${esc(d)}</li>`).join('')}</ul></div>

      <div class="card card-pad mb-3"><div class="t-md t-bold mb-2">典型例句</div>
        ${c.examples.map(e => `<div class="sentence-card">
          <div class="sentence-en">${esc(e.en)}
            <button class="btn btn-xs btn-ghost" data-speak="${attr(e.en)}">${ui.icon('sound', 15)}</button></div>
          <div class="t-sm t-ink2">${esc(e.zh)}</div>
          <div class="sentence-note">${esc(e.note)}</div></div>`).join('')}</div>

      <div class="card card-pad mb-3"><div class="t-md t-bold mb-2">详细解析</div>
        <div class="bodytext">${esc(c.analysis)}</div></div>

      <div class="card card-pad mb-3"><div class="flex between mb-2"><div class="t-md t-bold">学习笔记</div>
        <span class="t-xs t-muted" id="note-state">自动保存</span></div>
        <textarea class="editor" id="course-note" data-input="course-note" placeholder="记下自己的理解、易错点或例句…输入后自动保存。">${esc(st.note || '')}</textarea>
        <div class="btn-row mt-3"><button class="btn btn-sm btn-outline" data-action="save-note">立即保存</button></div></div>

      <div class="btn-row mb-3">
        <button class="btn ${st.done ? 'btn-outline' : 'btn-primary'} equal" data-action="toggle-done">${st.done ? '取消完成标记' : '标记完成'}</button>
        <button class="btn ${st.inReview ? 'btn-soft' : 'btn-outline'} equal" data-action="toggle-review">${st.inReview ? '已加入复习计划' : '加入复习计划'}</button>
      </div>
      <div class="btn-row mb-4">
        ${prev ? `<a class="btn btn-ghost btn-sm equal" href="#/courses/${attr(prev.id)}">‹ 上一课</a>` : ''}
        ${next ? `<a class="btn btn-ghost btn-sm equal" href="#/courses/${attr(next.id)}">下一课 ›</a>` : ''}
      </div>`;
  }

  const cats = [{ id:'all', name:'全部', icon:'layers' }, ...CATEGORIES];
  const list = cat === 'all' ? COURSES : COURSES.filter(c => c.cat === cat);
  return `${ui.contentNotice(COURSE_META)}
    <div class="card card-pad mb-3">
      <div class="flex between"><b>课程进度</b><span class="t-sm t-muted">${doneCount} / ${COURSES.length} 课</span></div>
      ${ui.progressBar(pct(doneCount, COURSES.length), true)}
      <div class="t-xs t-muted mt-2">按词汇、语法、阅读、完形、翻译、写作六类组织；每课可记笔记、标记完成、加入复习计划。</div>
    </div>
    <div class="filter-row">${cats.map(c => `<button class="${c.id === cat ? 'active' : ''}" data-action="cat" data-cat="${attr(c.id)}">${esc(c.name)}</button>`).join('')}</div>
    <div class="list">${list.map(c => {
      const st = courseState(c.id);
      const cg = CATEGORIES.find(x => x.id === c.cat);
      return `<a class="list-item" href="#/courses/${attr(c.id)}">
        <span class="li-ico ${st.done ? 'green' : ''}">${esc(cg.icon)}</span>
        <span class="li-main"><span class="li-title">${esc(c.title)}</span>
          <span class="li-sub">${esc(cg.name)} · ${c.minutes} 分钟 · ${esc(c.level)}</span></span>
        <span class="li-r">${st.done ? '<span class="chip chip-success">已完成</span>' : ''}${st.inReview ? '<span class="chip chip-warn">复习</span>' : ''}${ui.icon('arrow', 16)}</span></a>`;
    }).join('')}</div>`;
}

export const actions = {
  cat: (el, ctx) => { cat = el.dataset.cat; ctx.refresh(); },
  'save-note': (el, ctx) => { flushNote(ctx.params[0]); ui.toast('笔记已保存', 'ok'); ctx.refresh(); },
  'toggle-done': (el, ctx) => {
    const id = ctx.params[0], st = courseState(id);
    setCourse(id, { done:!st.done, doneAt:!st.done ? new Date().toISOString() : null });
    if (!st.done) { store.bumpDaily('practice', 1); store.addActivity('完成课程', COURSES.find(c => c.id === id).title, ''); }
    ui.toast(st.done ? '已取消完成标记' : '已标记完成', 'ok'); ctx.refresh();
  },
  'toggle-review': (el, ctx) => {
    const id = ctx.params[0], st = courseState(id);
    setCourse(id, { inReview:!st.inReview });
    ui.toast(st.inReview ? '已移出复习计划' : '已加入复习计划', 'ok'); ctx.refresh();
  }
};
export function onInput(el, ctx) {
  if (el.dataset.input !== 'course-note') return;
  clearTimeout(noteTimer);
  noteTimer = setTimeout(() => {
    flushNote(ctx.params[0]);
    const st = document.getElementById('note-state');
    if (st) st.textContent = '已自动保存 ' + new Date().toLocaleTimeString('zh-CN', { hour:'2-digit', minute:'2-digit' });
  }, 350);
}
export function unmount() { if (noteTimer) { clearTimeout(noteTimer); noteTimer = null; } if (currentId) { try { flushNote(currentId); } catch {} } }
