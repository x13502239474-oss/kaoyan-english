/* ============================================================
   应用入口：hash 路由 + 统一布局 + 全局事件委托
   ------------------------------------------------------------
   视图接口：render(ctx) -> HTML；可选 actions / mount / unmount / onChange / onInput
   全局能力：data-go 跳转、data-action 分发、data-speak 发音
   ============================================================ */
import * as store from './store.js';
import * as ui from './ui.js';
import * as speech from './speech.js';
import { esc, attr, $ } from './utils.js';

import * as home from './views/home.js';
import * as practice from './views/practice.js';
import * as words from './views/words.js';
import * as reading from './views/reading.js';
import * as cloze from './views/cloze.js';
import * as translation from './views/translation.js';
import * as writing from './views/writing.js';
import * as courses from './views/courses.js';
import * as exam from './views/exam.js';
import * as review from './views/review.js';
import * as stats from './views/stats.js';
import * as settings from './views/settings.js';

const ROUTES = { home, practice, words, reading, cloze, translation, writing, courses, exam, review, stats, settings };

const SIDE = [
  { g: '学习' },
  { id:'home', name:'学习首页', icon:'home' },
  { id:'words', name:'单词学习', icon:'card' },
  { id:'practice', name:'练习中心', icon:'target' },
  { g: '专项训练' },
  { id:'reading', name:'阅读理解', icon:'book' },
  { id:'cloze', name:'完形填空', icon:'list' },
  { id:'translation', name:'翻译训练', icon:'pen' },
  { id:'writing', name:'写作训练', icon:'note' },
  { id:'courses', name:'课程学习', icon:'layers' },
  { id:'exam', name:'真题与模拟考', icon:'clock' },
  { g: '复盘' },
  { id:'review', name:'错题本与复习', icon:'refresh' },
  { id:'stats', name:'学习统计', icon:'chart' },
  { id:'settings', name:'数据与设置', icon:'gear' }
];
const TABS = [
  { id:'home', name:'首页', icon:'home' },
  { id:'words', name:'单词', icon:'card' },
  { id:'practice', name:'练习', icon:'target' },
  { id:'review', name:'复习', icon:'refresh' },
  { id:'stats', name:'统计', icon:'chart' }
];
/* 子页面归属的高亮模块 */
const GROUP_OF = { reading:'practice', cloze:'practice', translation:'practice', writing:'practice', courses:'practice', exam:'practice' };
const TITLE_OF = {
  home:'学习首页', words:'单词学习', practice:'练习中心', reading:'阅读理解', cloze:'完形填空',
  translation:'翻译训练', writing:'写作训练', courses:'课程学习', exam:'真题与模拟考试',
  review:'错题本与复习', stats:'学习统计', settings:'数据与设置'
};

let currentView = null;
let currentCtx = null;

function parseHash() {
  const raw = (location.hash || '').replace(/^#\/?/, '') || 'home';
  const [path, qs] = raw.split('?');
  const seg = path.split('/').filter(Boolean);
  const name = seg[0] || 'home';
  return { name: ROUTES[name] ? name : 'home', params: seg.slice(1), query: new URLSearchParams(qs || '') };
}

function go(path) {
  const h = String(path || '').startsWith('#') ? path : '#/' + String(path).replace(/^\//, '');
  if (location.hash === h) renderRoute();
  else location.hash = h;
}

function setQuery(k, v) {
  const r = parseHash();
  r.query.set(k, v);
  const base = '#/' + [r.name, ...r.params].join('/');
  const qs = r.query.toString();
  const h = base + (qs ? '?' + qs : '');
  if (location.hash === h) renderRoute(); else location.hash = h;
}

function makeCtx(r) {
  return {
    name: r.name, params: r.params, query: r.query,
    go, setQuery, refresh: renderRoute,
    toast: ui.toast, store, ui, speech, esc, attr
  };
}

function layout() {
  const app = document.getElementById('app');
  const sideHTML = SIDE.map(x => x.g
    ? `<div class="side-group">${esc(x.g)}</div>`
    : `<a class="side-link" data-nav="${x.id}" href="#/${x.id}">${ui.icon(x.icon, 18)}<span>${esc(x.name)}</span></a>`).join('');
  const tabHTML = TABS.map(x => `<a class="tab" data-tab="${x.id}" href="#/${x.id}">${ui.icon(x.icon, 22)}<span>${esc(x.name)}</span></a>`).join('');
  app.innerHTML = `
    <header class="appbar"><div class="appbar-inner">
      <div class="appbar-title">考研英语二<span class="appbar-sub" id="appbar-sub">自学工作台</span></div>
      <button class="icon-btn" data-go="settings" title="数据与设置" aria-label="数据与设置">${ui.icon('gear', 21)}</button>
    </div></header>
    <nav class="sidebar">
      <div class="side-brand"><div class="mark">英</div><div><div class="t1">考研英语二</div><div class="t2">个人自学工作台</div></div></div>
      ${sideHTML}
      <div class="side-foot">数据保存在本机浏览器<br>支持导出备份 · 可离线使用</div>
    </nav>
    <main class="main" id="main"></main>
    <nav class="tabbar" id="tabbar">${tabHTML}</nav>`;
}

function setActive(name) {
  const active = GROUP_OF[name] || name;
  document.querySelectorAll('[data-nav]').forEach(el => el.classList.toggle('active', el.dataset.nav === active));
  document.querySelectorAll('[data-tab]').forEach(el => el.classList.toggle('active', el.dataset.tab === active));
  const sub = document.getElementById('appbar-sub');
  if (sub) sub.textContent = TITLE_OF[name] || '自学工作台';
}

function renderRoute() {
  const r = parseHash();
  const view = ROUTES[r.name];
  const ctx = makeCtx(r);
  if (currentView && currentView.unmount) { try { currentView.unmount(); } catch {} }
  ui.closeSheet(true);
  currentView = view; currentCtx = ctx;
  const main = document.getElementById('main');
  if (!main) return;
  let html = '';
  try { html = view.render(ctx) || ''; }
  catch (e) {
    html = `<div class="container"><div class="notice warn">${ui.icon('alert',16)}<div>页面渲染出错：${esc(e.message)}<br>可尝试 <button class="btn btn-sm btn-outline mt-2" data-action="__reload">重新加载</button></div></div></div>`;
    console.error('[render error]', r.name, e);
  }
  main.innerHTML = `<div class="container">${html}</div>`;
  setActive(r.name);
  window.scrollTo(0, 0);
  if (view.mount) { try { view.mount(main, ctx); } catch (e) { console.error('[mount error]', r.name, e); } }
}

/* ---------- 全局事件委托 ---------- */
function bindGlobal() {
  document.addEventListener('click', (e) => {
    const goEl = e.target.closest('[data-go]');
    if (goEl) { e.preventDefault(); go(goEl.dataset.go); return; }

    const speakEl = e.target.closest('[data-speak]');
    if (speakEl) {
      const res = speech.speak(speakEl.dataset.speak);
      if (!res.ok) ui.toast(res.reason, 'err');
      return;
    }

    const actEl = e.target.closest('[data-action]');
    if (actEl) {
      const name = actEl.dataset.action;
      if (name === '__reload') { renderRoute(); return; }
      const fn = currentView && currentView.actions && currentView.actions[name];
      if (fn) { e.preventDefault(); try { fn(actEl, currentCtx); } catch (err) { console.error('[action]', name, err); ui.toast('操作失败：' + err.message, 'err'); } }
      else ui.toast('该功能暂未就绪', 'err');
      return;
    }
    if (e.target.classList && e.target.classList.contains('overlay')) ui.closeSheet();
  });

  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-change]');
    if (el && currentView && currentView.onChange) {
      try { currentView.onChange(el, currentCtx); } catch (err) { console.error('[change]', err); }
    }
  });
  document.addEventListener('input', (e) => {
    const el = e.target.closest('[data-input]');
    if (el && currentView && currentView.onInput) {
      try { currentView.onInput(el, currentCtx); } catch (err) { console.error('[input]', err); }
    }
  });
  window.addEventListener('hashchange', renderRoute);
}

/* ---------- 启动 ---------- */
function boot() {
  store.init();
  layout();
  bindGlobal();
  if (!location.hash) location.replace('#/home');
  renderRoute();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
  if (!store.isPersistenceOK()) {
    setTimeout(() => ui.toast('浏览器存储不可用，本次数据仅保存在内存中，请及时导出备份', 'err'), 800);
  }
}

boot();
