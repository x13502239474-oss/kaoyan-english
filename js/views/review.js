/* 错题本与复习系统：自动归档 / 错误答案 / 正确答案与解析 / 分类 / 重练 / 掌握 / 复习计划 */
import * as store from '../store.js';
import * as words from '../words.js';
import * as srs from '../srs.js';
import { ui } from '../ui.js';
import { esc, attr, fmtShort, pct, daysFromNow } from '../utils.js';
import { COURSES } from '../../data/courses.js';

const TABS = [{ id:'mistakes', name:'错题本' }, { id:'plan', name:'复习计划' }, { id:'words', name:'单词复习' }];
let f = { type:'all', status:'open' };
let redoPicked = null;

function typeNameOf(m) { return m.typeName || '练习'; }
function allTypes() { return Array.from(new Set(store.get().mistakes.map(typeNameOf))); }

function mistakeCard(m) {
  const hasOptions = Array.isArray(m.options) && m.options.length > 0;
  const ua = m.userAnswer === undefined || m.userAnswer === null ? '未作答'
    : (hasOptions ? ('ABCD'[m.userAnswer] || String(m.userAnswer)) : String(m.userAnswer));
  const ca = m.correctAnswer === undefined || m.correctAnswer === null ? '—'
    : (hasOptions ? ('ABCD'[m.correctAnswer] || String(m.correctAnswer)) : String(m.correctAnswer));
  return `<div class="card card-pad mb-3">
    <div class="flex between wrap gap-2 mb-2">
      <div class="chips"><span class="chip chip-brand">${esc(typeNameOf(m))}</span>
        ${m.knowledge ? `<span class="chip">${esc(m.knowledge)}</span>` : ''}
        <span class="chip chip-outline">${esc(m.source === 'exam' ? '模拟考' : m.source === 'reading' ? '阅读' : m.source === 'cloze' ? '完形' : '单词')}</span>
        ${m.mastered ? '<span class="chip chip-success">已掌握</span>' : ''}
        ${m.nextReviewAt ? `<span class="chip chip-warn">复习 ${esc(fmtShort(new Date(m.nextReviewAt).toISOString()))}</span>` : ''}</div>
      <span class="t-xs t-muted">${esc(fmtShort(m.at))}</span></div>
    <div class="stem" style="font-size:15px">${esc(m.stem)}</div>
    ${hasOptions ? `<div class="t-sm t-muted mb-2">${m.options.map((o, i) => `<div>${'ABCD'[i]}. ${esc(o)}</div>`).join('')}</div>` : ''}
    <div class="flex gap-3 wrap mb-2"><span class="t-sm">你的答案：<b class="t-danger">${esc(ua)}</b></span>
      <span class="t-sm">正确答案：<b class="t-success">${esc(ca)}</b></span></div>
    ${m.explanation ? `<div class="analysis"><h4>解析</h4>${esc(m.explanation)}</div>` : ''}
    <div class="t-xs t-muted mt-2">复习 ${m.reviewCount || 0} 次${m.lastReviewAt ? ' · 上次 ' + esc(fmtShort(m.lastReviewAt)) : ''} · 掌握情况：${m.mastered ? '已掌握' : '待巩固'}</div>
    <div class="btn-row mt-3">
      <button class="btn btn-sm btn-soft equal" data-action="redo" data-id="${attr(m.id)}">重新练习</button>
      <button class="btn btn-sm btn-outline equal" data-action="plan" data-id="${attr(m.id)}">加入复习计划</button>
      <button class="btn btn-sm ${m.mastered ? 'btn-ghost' : 'btn-primary'} equal" data-action="master" data-id="${attr(m.id)}">${m.mastered ? '取消掌握' : '标记掌握'}</button>
    </div></div>`;
}

function mistakesHTML() {
  const all = store.get().mistakes;
  const types = allTypes();
  let list = all.filter(m => f.status === 'all' ? true : f.status === 'open' ? !m.mastered : m.mastered);
  if (f.type !== 'all') list = list.filter(m => typeNameOf(m) === f.type);
  return `<div class="filter-row">
    ${[{ id:'all', name:'全部题型' }, ...types.map(t => ({ id:t, name:t }))].map(t =>
      `<button class="${f.type === t.id ? 'active' : ''}" data-action="filter-type" data-v="${attr(t.id)}">${esc(t.name)}</button>`).join('')}</div>
    <div class="filter-row">
      ${[{ id:'open', name:'待巩固' }, { id:'mastered', name:'已掌握' }, { id:'all', name:'全部' }].map(t =>
        `<button class="${f.status === t.id ? 'active' : ''}" data-action="filter-status" data-v="${t.id}">${t.name}</button>`).join('')}</div>
    <div class="card card-pad mb-3 flex gap-3 wrap">
      <div class="flex-1"><div class="t-xs t-muted">未掌握错题</div><b>${all.filter(m => !m.mastered).length}</b></div>
      <div class="flex-1"><div class="t-xs t-muted">已掌握</div><b>${all.filter(m => m.mastered).length}</b></div>
      <div class="flex-1"><div class="t-xs t-muted">累计重练</div><b>${all.reduce((n, m) => n + (m.reviewCount || 0), 0)}</b></div>
    </div>
    ${list.length ? list.map(mistakeCard).join('') : ui.empty('check', '这里没有符合条件的错题',
      '答错阅读、完形、单词测试或模拟考客观题时会自动归档到这里。',
      `<a class="btn btn-primary" href="#/practice">去做练习</a>`)}`;
}

function planHTML() {
  const s = store.get();
  const now = Date.now();
  const dueMistakes = s.mistakes.filter(m => !m.mastered && m.nextReviewAt && m.nextReviewAt <= now);
  const planCourses = Object.entries(s.courses).filter(([, c]) => c.inReview);
  const dueWords = srs.dueQueue(words.allWords());
  return `${ui.sectionHead('今日复习计划')}
    <div class="card card-pad mb-3">
      <div class="kv"><span class="k">到期待复习错题</span><span class="v">${dueMistakes.length} 道</span></div>
      <div class="kv"><span class="k">课程复习计划</span><span class="v">${planCourses.length} 课</span></div>
      <div class="kv"><span class="k">到期单词</span><span class="v">${dueWords.length} 词</span></div>
      <a class="btn btn-primary btn-block mt-3" href="#/words?tab=review">开始单词复习</a></div>
    ${dueMistakes.length ? `${ui.sectionHead('到期错题')}${dueMistakes.slice(0, 5).map(m => `<div class="card card-pad mb-2">
      <div class="t-sm t-bold">${esc(typeNameOf(m))} · ${esc(m.knowledge || '')}</div>
      <div class="t-sm t-muted clamp-2 mt-1">${esc(m.stem)}</div>
      <button class="btn btn-xs btn-soft mt-2" data-action="redo" data-id="${attr(m.id)}">立即重练</button></div>`).join('')}` : ''}
    ${planCourses.length ? `${ui.sectionHead('课程复习计划')}
      <div class="list">${planCourses.map(([id]) => { const c = COURSES.find(x => x.id === id); return c
        ? `<a class="list-item" href="#/courses/${attr(id)}"><span class="li-ico amber">${ui.icon('layers', 18)}</span>
          <span class="li-main"><span class="li-title">${esc(c.title)}</span><span class="li-sub">${esc(c.level)} · ${c.minutes} 分钟</span></span>
          <span class="li-r">${ui.icon('arrow', 16)}</span></a>` : ''; }).join('')}</div>` : ''}
    ${!dueMistakes.length && !planCourses.length && !dueWords.length
      ? `<div class="card card-pad t-sm t-muted t-center">当前没有待复习内容。可在错题详情点「加入复习计划」，或在课程里点「加入复习计划」。</div>` : ''}`;
}

function wordsHTML() {
  const due = srs.dueQueue(words.allWords());
  const dist = srs.levelDistribution();
  const snap = store.snapshot();
  return `<div class="card card-pad mb-3">
    <div class="flex between"><b>待复习单词</b><span class="stat-num">${due.length}</span></div>
    <div class="t-xs t-muted mt-2">按「逾期天数 ↓ + 熟练度 ↑」排序，遗忘越久越优先。</div>
    <a class="btn btn-primary btn-block mt-3" href="#/words?tab=review">进入间隔复习</a></div>
    ${due.length ? `${ui.sectionHead('最需要复习的词')}<div class="list">${due.slice(0, 12).map(x => `<div class="list-item">
      <span class="li-main"><span class="li-title">${esc(x.word.word)}</span>
        <span class="li-sub">${esc(x.word.meaning || '（暂无释义）')} · ${esc(srs.levelName(x.rec.level || 0))}</span></span>
      <span class="chip ${x.overdueDays >= 2 ? 'chip-danger' : 'chip-warn'}">逾期 ${Math.floor(x.overdueDays)} 天</span></div>`).join('')}</div>` : ''}
    ${ui.sectionHead('掌握度分布')}
    <div class="card card-pad">${dist.map((n, i) => `<div class="level-bar">
      <span class="lb-name">${esc(srs.LEVEL_NAMES[i])}</span>
      <span class="lb-track"><i style="width:${pct(n, Math.max(1, snap.started))}%"></i></span>
      <span class="lb-num">${n}</span></div>`).join('')}</div>`;
}

export function render(ctx) {
  const tab = ctx.query.get('tab') || 'mistakes';
  const tabBar = `<div class="tabs">${TABS.map(t => `<button class="${t.id === tab ? 'active' : ''}" data-action="tab" data-tab="${t.id}">${t.name}</button>`).join('')}</div>`;
  return `${tabBar}${tab === 'plan' ? planHTML() : tab === 'words' ? wordsHTML() : mistakesHTML()}`;
}

export const actions = {
  tab: (el, ctx) => ctx.setQuery('tab', el.dataset.tab),
  'filter-type': (el, ctx) => { f.type = el.dataset.v; ctx.refresh(); },
  'filter-status': (el, ctx) => { f.status = el.dataset.v; ctx.refresh(); },
  redo: (el, ctx) => {
    const m = store.get().mistakes.find(x => x.id === el.dataset.id);
    if (!m) return;
    redoPicked = null;
    const hasOptions = Array.isArray(m.options) && m.options.length > 0;
    ui.openSheet({ title:'重新练习', body:`
      <div class="sheet-desc">${esc(typeNameOf(m))} · ${esc(m.knowledge || '')}　答完后会记录复习时间与掌握情况。</div>
      <div class="stem" style="font-size:15px">${esc(m.stem)}</div>
      ${hasOptions ? `<div class="opt-list">${m.options.map((o, i) => `<button class="opt" data-action="redo-answer" data-id="${attr(m.id)}" data-idx="${i}">
        <span class="ltr">${'ABCD'[i]}</span><span class="opt-text">${esc(o)}</span></button>`).join('')}</div>`
        : `<div class="analysis mb-3"><h4>参考答案</h4>${esc(String(m.correctAnswer || '—'))}</div>
           <div class="btn-row"><button class="btn btn-outline equal" data-action="self-redo" data-id="${attr(m.id)}" data-ok="0">还没掌握</button>
           <button class="btn btn-primary equal" data-action="self-redo" data-id="${attr(m.id)}" data-ok="1">已掌握</button></div>`}
      <div id="redo-feedback"></div>`,
      actions:[{ label:'关闭', cls:'btn-outline' }] });
  },
  'redo-answer': (el, ctx) => {
    const m = store.get().mistakes.find(x => x.id === el.dataset.id);
    if (!m) return;
    const idx = Number(el.dataset.idx);
    const ok = idx === m.correctAnswer;
    store.update(s => {
      const t = s.mistakes.find(x => x.id === m.id);
      if (t) { t.reviewCount = (t.reviewCount || 0) + 1; t.lastReviewAt = new Date().toISOString(); if (ok && !t.mastered) t.nextReviewAt = Date.now() + 3 * 86400000; }
    });
    const box = document.getElementById('redo-feedback');
    if (box) box.innerHTML = `<div class="analysis mt-3"><h4>${ok ? '✓ 重练正确，已记录复习时间' : '✗ 仍需巩固'}</h4>
      ${esc(m.explanation || '')}<div class="mt-2">正确答案：${esc(String(m.correctAnswer === null || m.correctAnswer === undefined ? '—' : 'ABCD'[m.correctAnswer] || m.correctAnswer))}</div></div>
      <div class="btn-row mt-3">${ok ? `<button class="btn btn-primary btn-block" data-action="master" data-id="${attr(m.id)}">标记已掌握</button>` : ''}</div>`;
    document.querySelectorAll('[data-action="redo-answer"]').forEach(b => b.disabled = true);
    ui.toast(ok ? '重练正确，已记录' : '已记录复习，继续巩固', ok ? 'ok' : '');
  },
  'self-redo': (el, ctx) => {
    const ok = el.dataset.ok === '1';
    store.update(s => {
      const t = s.mistakes.find(x => x.id === el.dataset.id);
      if (t) { t.reviewCount = (t.reviewCount || 0) + 1; t.lastReviewAt = new Date().toISOString();
        t.mastered = ok; t.nextReviewAt = ok ? Date.now() + 7 * 86400000 : Date.now() + 86400000; }
    });
    ui.closeSheet(); ui.toast(ok ? '已标记掌握' : '已记录，明天再复习', 'ok'); ctx.refresh();
  },
  master: (el, ctx) => {
    const id = el.dataset.id;
    let nowMastered = false;
    store.update(s => {
      const t = s.mistakes.find(x => x.id === id);
      if (t) { t.mastered = !t.mastered; t.lastReviewAt = new Date().toISOString(); nowMastered = t.mastered;
        if (t.mastered) t.nextReviewAt = Date.now() + 7 * 86400000; }
    });
    ui.closeSheet();
    ui.toast(nowMastered ? '已标记掌握' : '已取消掌握标记', 'ok');
    ctx.refresh();
  },
  plan: (el, ctx) => {
    store.update(s => {
      const t = s.mistakes.find(x => x.id === el.dataset.id);
      if (t) t.nextReviewAt = Date.now() + 3 * 86400000;
    });
    ui.toast('已加入复习计划（3 天后提醒）', 'ok');
    ctx.refresh();
  }
};
