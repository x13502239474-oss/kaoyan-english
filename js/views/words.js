/* ============================================================
   单词学习系统
   ------------------------------------------------------------
   tab: study 新学 / review 复习 / test 测试 / lists 词表 / fav 收藏
   - 卡片：显隐释义、发音、收藏、掌握标记、编辑补全
   - SRS：到期队列按逾期与熟练度排序，四档评分
   - 测试：英译中 / 中译英 / 随机抽查，成绩与错题入档
   ============================================================ */
import * as store from '../store.js';
import * as words from '../words.js';
import * as srs from '../srs.js';
import { ui } from '../ui.js';
import { esc, attr, pick, shuffle, pct, clamp, today } from '../utils.js';

const TABS = [
  { id:'study', name:'新学' }, { id:'review', name:'复习' }, { id:'test', name:'测试' },
  { id:'lists', name:'词表' }, { id:'fav', name:'收藏' }
];
const TEST_MODES = [
  { id:'en2zh', name:'英译中' }, { id:'zh2en', name:'中译英' }, { id:'random', name:'随机抽查' }
];

let ses = {
  tab:null, listId:'core', queue:[], idx:0, revealed:false,
  testMode:'en2zh', testQueue:[], testIdx:0, testScore:0,
  testOptions:[], testPicked:null, testDone:false, testRevealed:false,
  q:'', viewList:null
};

function resetTab(tab) {
  ses.tab = tab; ses.idx = 0; ses.revealed = false; ses.queue = [];
  ses.testQueue = []; ses.testIdx = 0; ses.testScore = 0;
  ses.testOptions = []; ses.testPicked = null; ses.testDone = false; ses.testRevealed = false;
}

function poolWithMeaning() {
  return words.allWords().filter(w => (w.meaning || '').trim());
}

function buildQueue(ctx, tab) {
  const s = store.get();
  if (tab === 'study') {
    const pool = words.listWords(ses.listId);
    return srs.newQueue(pool, s.settings.dailyWordGoal || 20).map(w => ({ word:w, rec:null }));
  }
  if (tab === 'review') {
    return srs.dueQueue(words.allWords()).map(x => ({ word:x.word, rec:x.rec, overdueDays:x.overdueDays }));
  }
  return [];
}

function buildTest(mode) {
  const pool = poolWithMeaning();
  const n = Math.min(10, pool.length);
  return pick(pool, n);
}
function optionsFor(w, mode, pool) {
  const field = mode === 'en2zh' ? 'meaning' : 'word';
  const right = w[field];
  const distract = shuffle(pool.filter(x => x.word !== w.word && (x[field] || '').trim() && x[field] !== right))
    .slice(0, 3).map(x => x[field]);
  while (distract.length < 3) distract.push('—（暂无更多干扰项）');
  return shuffle([right, ...distract]).map((text, i) => ({ text, ok: text === right, i }));
}

/* ---------- 卡片 ---------- */
function cardHTML(item, tab, ctx) {
  const w = item.word;
  const rec = store.wordRec(w.word);
  const src = words.sourceLabel(w);
  const hasMeaning = !!(w.meaning || '').trim();
  const overdue = item.overdueDays != null ? Math.floor(item.overdueDays) : null;
  const total = ses.queue.length;
  const pos = ses.idx + 1;

  return `
  <div class="card card-pad mb-3">
    <div class="flex between">
      <div class="chips">
        <span class="chip ${src.cls}">${esc(src.text)}</span>
        <span class="chip">${esc(srs.levelName(rec.level || 0))} · Lv.${rec.level || 0}</span>
        ${overdue !== null ? `<span class="chip ${overdue >= 2 ? 'chip-danger' : 'chip-warn'}">逾期 ${overdue} 天</span>` : ''}
        ${rec.mastered ? '<span class="chip chip-success">已掌握</span>' : ''}
      </div>
      <span class="t-sm t-muted">${pos} / ${total}</span>
    </div>
    ${ui.progressBar(pct(ses.idx, Math.max(1, total)), true)}
  </div>

  <div class="word-card mb-4">
    <div class="word-top">
      <button class="icon-fav ${rec.favorite ? 'on' : ''}" data-action="fav" title="收藏/取消收藏">${ui.icon('star', 22)}</button>
      <span class="t-xs t-muted">${esc(w.tier === 'high' ? '高频' : w.tier === 'mid' ? '中频' : '低频')}${w.years && w.years.length ? ' · ' + esc(w.years.join('/')) : ''}</span>
    </div>
    <div class="word-en">${esc(w.word)}</div>
    ${w.phonetic ? `<div class="phonetic mt-1">${esc(w.phonetic)}</div>` : '<div class="t-xs t-muted mt-1">暂无音标</div>'}
    <button class="speak-btn mt-3" data-speak="${attr(w.word)}">${ui.icon('sound', 18)} 朗读单词</button>
    ${w.pos ? `<div class="word-pos">${esc(w.pos)}</div>` : ''}

    ${ses.revealed ? `
      <div class="word-meaning">${hasMeaning ? esc(w.meaning) : '<span class="word-hidden">该词条暂无中文释义</span>'}</div>
      ${!hasMeaning ? `<div class="t-sm t-muted mt-2">此词来自你提供的资料，仅抽取到词形。<button class="btn btn-xs btn-soft mt-2" data-action="edit">补全释义</button></div>` : ''}
      ${w.example ? `<div class="word-example">
          <div class="ex-en">${esc(w.example)} <button class="btn btn-xs btn-ghost" data-speak="${attr(w.example)}" title="朗读例句">${ui.icon('sound', 15)}</button></div>
          ${w.exampleZh ? `<div class="ex-zh">${esc(w.exampleZh)}</div>` : ''}</div>` : ''}
      ${(w.collocations && w.collocations.length) || w.rare ? `<div class="word-extra">
        ${w.collocations && w.collocations.length ? `<span class="k">常见搭配</span>${w.collocations.map(c => `<div>· ${esc(c)}</div>`).join('')}` : ''}
        ${w.rare ? `<span class="k mt-2">熟词僻义</span><div>${esc(w.rare)}</div>` : ''}
      </div>` : ''}
    ` : `<div class="word-meaning word-hidden mt-4">点下方按钮显示中文释义</div>`}
  </div>

  <div class="btn-row mb-3">
    <button class="btn btn-outline equal" data-action="reveal">${ses.revealed ? '隐藏释义' : '显示释义'}</button>
    <button class="btn btn-outline equal" data-action="edit">编辑词条</button>
    <button class="btn btn-outline equal" data-action="master">${rec.mastered ? '取消掌握' : '标记掌握'}</button>
  </div>

  <div class="t-xs t-muted mb-2 t-center">选择掌握程度，系统会据此安排下次复习时间</div>
  <div class="grade-row mb-3">
    <button class="grade-btn g-again" data-action="grade" data-g="again">忘了<small>10 分钟后重现</small></button>
    <button class="grade-btn g-hard" data-action="grade" data-g="hard">勉强<small>短间隔</small></button>
    <button class="grade-btn g-good" data-action="grade" data-g="good">记得<small>按等级递进</small></button>
    <button class="grade-btn g-easy" data-action="grade" data-g="easy">很熟<small>拉长间隔</small></button>
  </div>
  <div class="btn-row"><button class="btn btn-ghost btn-block btn-sm" data-action="next">跳过这个词 ›</button></div>`;
}

/* ---------- 测试 ---------- */
function testHTML(ctx) {
  const q = ses.testQueue[ses.testIdx];
  const pool = poolWithMeaning();
  if (!pool.length) return ui.empty('card', '没有可测试的词条', '请先导入或编辑带中文释义的词条。');
  if (ses.testDone) {
    const p = pct(ses.testScore, ses.testQueue.length);
    return `<div class="card card-pad t-center">
      <div class="stat-num" style="font-size:44px">${ses.testScore}/${ses.testQueue.length}</div>
      <div class="t-md t-muted mt-2">本轮正确率 ${p}%</div>
      <div class="t-sm t-muted mt-3">成绩已记入学习统计，答错的词已自动进入错题本。</div>
      <div class="btn-row mt-4"><button class="btn btn-primary equal" data-action="restart-test">再来一轮</button>
      <a class="btn btn-outline equal" href="#/review">查看错题本</a></div></div>`;
  }
  if (!q) return `<div class="card card-pad">${ui.empty('target','准备测试','点击开始生成题目。')}</div>`;
  if (!ses.testOptions.length) ses.testOptions = optionsFor(q, ses.testMode, pool);

  const isRandom = ses.testMode === 'random';
  const prompt = ses.testMode === 'zh2en' ? q.meaning : q.word;
  const sub = ses.testMode === 'zh2en' ? '选择对应的英文单词' : '选择正确的中文释义';

  return `<div class="card card-pad mb-3">
    <div class="flex between"><span class="chip chip-brand">第 ${ses.testIdx + 1} / ${ses.testQueue.length} 题</span>
      <span class="t-sm t-muted">已得 ${ses.testScore} 分</span></div>
    ${ui.progressBar(pct(ses.testIdx, ses.testQueue.length), true)}
  </div>
  <div class="card card-pad mb-3">
    <div class="q-tag">${esc(TEST_MODES.find(m => m.id === ses.testMode).name)}</div>
    <div class="stem" style="font-size:26px;text-align:center;margin:14px 0 4px">${esc(prompt)}</div>
    ${ses.testMode !== 'zh2en' && q.phonetic ? `<div class="phonetic t-center">${esc(q.phonetic)}</div>` : ''}
    <div class="t-center mt-2">
      ${ses.testMode !== 'zh2en' ? `<button class="speak-btn" data-speak="${attr(q.word)}">${ui.icon('sound', 18)} 朗读</button>` : ''}
    </div>
    <div class="t-xs t-muted t-center mt-3">${esc(sub)}${isRandom ? ' · 先自评，再看释义' : ''}</div>
  </div>

  ${isRandom ? `
    ${ses.testRevealed ? `<div class="card card-pad mb-3"><div class="t-sm t-muted">中文释义</div>
      <div class="word-meaning" style="font-size:20px">${esc(q.meaning || '（该词暂无释义）')}</div></div>` : ''}
    <div class="btn-row mb-3">
      ${!ses.testRevealed
        ? `<button class="btn btn-outline btn-block" data-action="test-reveal">显示中文释义</button>`
        : `<button class="btn btn-soft equal" data-action="self-grade" data-g="again">没记住</button>
           <button class="btn btn-primary equal" data-action="self-grade" data-g="good">记住了</button>`}
    </div>`
  : `<div class="opt-list mb-3">${ses.testOptions.map(o => {
      let cls = '';
      if (ses.testPicked !== null) {
        if (o.ok) cls = 'correct';
        else if (ses.testPicked === o.i) cls = 'wrong';
        else cls = 'dim';
      }
      return `<button class="opt ${cls}" data-action="answer" data-idx="${o.i}" ${ses.testPicked !== null ? 'disabled' : ''}>
        <span class="ltr">${'ABCD'[o.i]}</span><span class="opt-text">${esc(o.text)}</span></button>`;
    }).join('')}</div>
    ${ses.testPicked !== null ? `<div class="analysis mb-3">
        <h4>${ses.testOptions[ses.testPicked].ok ? '回答正确' : '回答错误'}</h4>
        <div><b>${esc(q.word)}</b> ${q.phonetic ? `<span class="phonetic">${esc(q.phonetic)}</span>` : ''} · ${esc(q.meaning || '')}</div>
        ${q.example ? `<div class="mt-2 t-sm">例：${esc(q.example)}</div>` : ''}
      </div>
      <button class="btn btn-primary btn-block" data-action="test-next">${ses.testIdx + 1 >= ses.testQueue.length ? '查看本轮成绩' : '下一题 ›'}</button>` : ''}`}
  <div class="t-xs t-muted t-center mt-3">测试题由本站内置词条即时生成，属演示练习，非考试题目。</div>`;
}

/* ---------- 词表 ---------- */
function listsHTML(ctx) {
  const lists = words.wordLists();
  const meta = words.CORPUS_META;
  const current = lists.find(l => l.id === ses.viewList);
  const shown = ses.q.trim()
    ? words.searchWords(ses.q, 80)
    : (current ? words.listWords(current.id).slice(0, 80) : []);
  const totalInList = current ? words.listWords(current.id).length : 0;

  return `${ui.contentNotice({ contentLabel:'user', labelText:'用户资料·自动抽取', disclaimer:meta.disclaimer },
      `共 ${meta.wordCount} 个词形，覆盖 ${meta.yearCount} 个年份段（源资料缺少 2020 年段）。`)}

  <div class="card card-pad mb-3">
    <div class="field-label">搜索词条（单词或中文释义）</div>
    <div class="input-search">${ui.icon('search', 17)}<input class="input" id="word-q" data-input="word-search" placeholder="输入单词或释义，如 abandon / 放弃" value="${attr(ses.q)}"></div>
    <div class="field-hint">可直接搜索内置演示词条与资料词形；资料词形暂无释义，可在卡片中补全。</div>
  </div>

  ${!current && !ses.q ? `<div class="section">
    ${ui.sectionHead('按词汇表 / 词频分类', '', `${lists.length} 个词表`)}
    <div class="list">${lists.map(l => `<button class="list-item" data-action="set-list" data-list="${attr(l.id)}">
      <span class="li-ico ${l.label === 'ai' ? '' : 'grey'}">${ui.icon('layers', 18)}</span>
      <span class="li-main"><span class="li-title">${esc(l.name)}</span><span class="li-sub">${esc(l.desc)}</span></span>
      <span class="li-r">${words.listWords(l.id).length} 词 ${ui.icon('arrow', 16)}</span></button>`).join('')}</div></div>` : ''}

  ${current || ses.q ? `<div class="section">
    <div class="flex between mb-3">
      <div><b id="word-list-title">${esc(ses.q ? `搜索「${ses.q}」` : current.name)}</b>
        <div class="t-xs t-muted" id="word-list-count">${ses.q ? `匹配 ${shown.length} 条` : `共 ${totalInList} 词，显示前 ${Math.min(80, totalInList)} 条`}</div></div>
      <button class="btn btn-sm btn-outline" data-action="clear-list">返回词表</button>
    </div>
    <div id="word-list-result">${listResultHTML(shown)}</div></div>` : ''}`;
}

/* ---------- 收藏 ---------- */
function favHTML(ctx) {
  const s = store.get();
  const favKeys = Object.keys(s.wordProgress).filter(k => s.wordProgress[k].favorite);
  const masteredKeys = Object.keys(s.wordProgress).filter(k => s.wordProgress[k].mastered);
  const wm = words.wordMap();
  const rows = (keys, emptyText) => keys.length ? `<div class="list">${keys.map(k => {
    const w = wm.get(k); if (!w) return '';
    const rec = s.wordProgress[k];
    return `<div class="list-item"><span class="li-main">
      <span class="li-title">${esc(w.word)}</span><span class="li-sub">${esc(w.meaning || '（暂无释义）')} · ${esc(srs.levelName(rec.level || 0))} · 复习 ${rec.reviews || 0} 次</span></span>
      <button class="btn btn-xs btn-outline" data-action="view-word" data-w="${attr(k)}">卡片</button>
      <button class="btn btn-xs btn-ghost" data-action="unfav" data-w="${attr(k)}">取消</button></div>`;
  }).join('')}</div>` : `<div class="card card-pad t-sm t-muted t-center">${esc(emptyText)}</div>`;

  return `${ui.sectionHead('收藏的生词', '', `${favKeys.length} 词`)}
  ${rows(favKeys, '还没有收藏生词。在单词卡片右上角点星标即可收藏。')}
  ${ui.sectionHead('已标记掌握', '', `${masteredKeys.length} 词`)}
  ${rows(masteredKeys, '还没有标记掌握的词。')}`;
}

/* ---------- 主渲染 ---------- */
export function render(ctx) {
  const tab = ctx.query.get('tab') || 'study';
  if (ses.tab !== tab) resetTab(tab);
  const s = store.get();
  const goalNew = s.settings.dailyWordGoal || 20;
  const goalRev = s.settings.dailyReviewGoal || 30;
  const daily = store.snapshot().daily;

  const tabBar = `<div class="tabs">${TABS.map(t => `<button class="${t.id === tab ? 'active' : ''}" data-action="tab" data-tab="${t.id}">${t.name}</button>`).join('')}</div>`;

  if (tab === 'study' || tab === 'review') {
    if (!ses.queue.length) ses.queue = buildQueue(ctx, tab);
    const item = ses.queue[ses.idx];
    const isStudy = tab === 'study';
    const doneCount = isStudy ? (daily.newWords || 0) : (daily.reviews || 0);
    const goal = isStudy ? goalNew : goalRev;
    const listSel = isStudy ? `<div class="card card-pad mb-3">
      <div class="field-label">新词来源（按词汇表 / 词频分类）</div>
      <select class="select" data-change="list-select">${words.wordLists().map(l =>
        `<option value="${attr(l.id)}" ${l.id === ses.listId ? 'selected' : ''}>${esc(l.name)}（${words.listWords(l.id).length} 词）</option>`).join('')}</select>
      <div class="field-hint">切换来源会重新抽取一组未学过的词。</div></div>` : '';

    let body;
    if (!item) {
      body = `<div class="card card-pad">${ui.empty(isStudy ? 'card' : 'refresh',
        isStudy ? '这一组新词已完成' : '当前没有到期需要复习的单词',
        isStudy ? '可以再取一组，或去复习、测试巩固。' : '间隔复习会根据「忘了/记得」自动安排下次到期时间；也可以先学新词或做随机抽查。',
        `<div class="btn-row"><button class="btn btn-primary equal" data-action="rebuild">${isStudy ? '再学一组' : '刷新队列'}</button>
         <a class="btn btn-outline equal" href="#/words?tab=${isStudy ? 'review' : 'study'}">${isStudy ? '去复习' : '去学新词'}</a></div>`)}</div>`;
    } else body = cardHTML(item, tab, ctx);

    const forecast = srs.forecast(words.allWords(), 7);
    return `${ui.contentNotice({ contentLabel:'ai', labelText:'演示词条', disclaimer:'核心演示词条为 AI 编写的示例数据；资料词形来自你提供的 docx（仅词形，无音标/释义），非官方权威词表。' })}
      ${tabBar}
      <div class="card card-pad mb-3">
        <div class="flex between"><b>${isStudy ? '今日新学' : '今日复习'} ${Math.min(doneCount, goal)} / ${goal}</b>
          <span class="t-sm t-muted">${isStudy ? '已完成 ' + Math.min(ses.idx, ses.queue.length) + '/' + ses.queue.length + ' 张' : '队列 ' + ses.queue.length + ' 词'}</span></div>
        ${ui.progressBar(pct(doneCount, goal), true)}
        <div class="t-xs t-muted mt-2">${isStudy ? '新词按「有完整释义 → 跨年份高频 → 词频」优先抽取' : '复习按「逾期天数 ↓ + 熟练度 ↑」排序，遗忘越久越靠前'}</div>
      </div>
      ${listSel}
      ${body}
      ${!isStudy ? `<div class="card card-pad mt-3"><div class="t-sm t-bold mb-2">未来 7 天待复习量</div>
        <div class="chips">${forecast.map((f, i) => `<span class="chip ${f.count ? 'chip-warn' : ''}">${i === 0 ? '今天' : '+' + i + '天'} ${f.count}</span>`).join('')}</div></div>` : ''}`;
  }

  if (tab === 'test') {
    return `${tabBar}
      <div class="card card-pad mb-3">
        <div class="field-label">测试方式</div>
        <div class="segmented">${TEST_MODES.map(m => `<button class="${m.id === ses.testMode ? 'active' : ''}" data-action="test-mode" data-mode="${m.id}">${m.name}</button>`).join('')}</div>
        <div class="field-hint">题库为内置演示词条（${poolWithMeaning().length} 个带释义的词），每轮 10 题；随机抽查为自评模式。</div>
      </div>
      ${ses.testQueue.length ? testHTML(ctx) : `<div class="card card-pad t-center">
        <div class="t-md mb-3">准备好开始${esc(TEST_MODES.find(m => m.id === ses.testMode).name)}了吗？</div>
        <button class="btn btn-primary btn-block" data-action="start-test">开始一轮（10 题）</button></div>`}`;
  }
  if (tab === 'lists') return `${tabBar}${listsHTML(ctx)}`;
  return `${tabBar}${favHTML(ctx)}`;
}

/* ---------- 交互 ---------- */
function advance(ctx) {
  ses.idx++; ses.revealed = false;
  if (ses.idx >= ses.queue.length) ses.queue = [];
  ctx.refresh();
}

function doGrade(g, ctx) {
  const item = ses.queue[ses.idx];
  if (!item) return;
  const w = item.word;
  const isReview = ses.tab === 'review';
  const rec = store.wordRec(w.word);
  const wasNew = !rec.seen;
  srs.grade(rec, g);
  store.save();
  store.bumpDaily(isReview ? 'reviews' : 'newWords', 1);
  store.bumpDaily('practice', 0);
  store.addActivity(isReview ? '复习单词' : '学习单词', w.word,
    `${srs.levelName(rec.level)} · 下次 ${rec.dueAt ? new Date(rec.dueAt).toLocaleDateString('zh-CN') : '—'}`);
  // 忘了 → 自动进错题本
  if (g === 'again') {
    store.addMistake({ source:'words', refId:w.word, questionId:'word-' + w.word, typeName:'单词',
      knowledge:'词义记忆', stem:`单词：${w.word}`, options:[], userAnswer:'未记住',
      correctAnswer:w.meaning || '（该词暂无释义，请补全）',
      explanation:`音标：${w.phonetic || '—'}；例句：${w.example || '—'}` });
  }
  ui.toast(wasNew && !isReview ? '已加入学习计划' : `已记录：${srs.levelName(rec.level)}`, 'ok');
  advance(ctx);
}

function finishTest(ctx) {
  store.update(s => s.wordTests.unshift({
    id:'wt-' + Date.now(), at:new Date().toISOString(), mode:ses.testMode,
    score:ses.testScore, total:ses.testQueue.length
  }));
  store.addActivity('单词测试', `${TEST_MODES.find(m => m.id === ses.testMode).name} ${ses.testScore}/${ses.testQueue.length}`, '');
  ses.testDone = true;
  ctx.refresh();
}

export const actions = {
  tab: (el, ctx) => ctx.setQuery('tab', el.dataset.tab),
  reveal: (el, ctx) => { ses.revealed = !ses.revealed; ctx.refresh(); },
  grade: (el, ctx) => doGrade(el.dataset.g, ctx),
  next: (el, ctx) => advance(ctx),
  rebuild: (el, ctx) => { ses.idx = 0; ses.revealed = false; ses.queue = []; ctx.refresh(); },
  fav: (el, ctx) => {
    const w = ses.queue[ses.idx].word;
    store.update(() => { const r = store.wordRec(w.word); r.favorite = !r.favorite; });
    store.addActivity('收藏单词', w.word, store.wordRec(w.word).favorite ? '加入生词本' : '取消收藏');
    ui.toast(store.wordRec(w.word).favorite ? '已收藏' : '已取消收藏', 'ok'); ctx.refresh();
  },
  master: (el, ctx) => {
    const w = ses.queue[ses.idx].word;
    store.update(() => { const r = store.wordRec(w.word); r.mastered = !r.mastered; });
    ui.toast('已更新掌握标记', 'ok');
    ctx.refresh();
  },
  edit: (el, ctx) => openEditSheet(ses.queue[ses.idx].word, ctx),
  'test-mode': (el, ctx) => { ses.testMode = el.dataset.mode; resetTab('test'); ctx.refresh(); },
  'start-test': (el, ctx) => { ses.testQueue = buildTest(ses.testMode); ses.testOptions = []; ctx.refresh(); },
  'restart-test': (el, ctx) => { resetTab('test'); ses.testQueue = buildTest(ses.testMode); ctx.refresh(); },
  answer: (el, ctx) => {
    if (ses.testPicked !== null) return;
    const i = Number(el.dataset.idx);
    ses.testPicked = i;
    const ok = ses.testOptions[i].ok;
    const q = ses.testQueue[ses.testIdx];
    if (ok) ses.testScore++;
    else {
      store.addMistake({ source:'words', refId:q.word, questionId:'test-' + q.word, typeName:'单词测试',
        knowledge:ses.testMode === 'zh2en' ? '中译英' : '英译中',
        stem:`${ses.testMode === 'zh2en' ? '中文释义' : '单词'}：${ses.testMode === 'zh2en' ? q.meaning : q.word}`,
        options:ses.testOptions.map(o => o.text), userAnswer:ses.testOptions[i].text,
        correctAnswer:ses.testMode === 'zh2en' ? q.word : q.meaning,
        explanation:`${q.word} ${q.phonetic || ''} ${q.meaning || ''}` });
    }
    ctx.refresh();
  },
  'test-next': (el, ctx) => {
    ses.testIdx++; ses.testPicked = null; ses.testOptions = [];
    if (ses.testIdx >= ses.testQueue.length) finishTest(ctx);
    else ctx.refresh();
  },
  'test-reveal': (el, ctx) => { ses.testRevealed = true; ctx.refresh(); },
  'self-grade': (el, ctx) => {
    const q = ses.testQueue[ses.testIdx];
    const ok = el.dataset.g === 'good';
    if (ok) ses.testScore++;
    else store.addMistake({ source:'words', refId:q.word, questionId:'random-' + q.word, typeName:'随机抽查',
      knowledge:'词义记忆', stem:`单词：${q.word}`, options:[], userAnswer:'未记住',
      correctAnswer:q.meaning || '', explanation:q.example || '' });
    ses.testIdx++; ses.testRevealed = false; ses.testOptions = []; ses.testPicked = null;
    if (ses.testIdx >= ses.testQueue.length) finishTest(ctx); else ctx.refresh();
  },
  'set-list': (el, ctx) => { ses.viewList = el.dataset.list; ses.q = ''; ctx.refresh(); },
  'clear-list': (el, ctx) => { ses.viewList = null; ses.q = ''; ctx.refresh(); },
  'view-word': (el, ctx) => {
    const w = words.getWord(el.dataset.w);
    if (!w) return ui.toast('未找到该词条', 'err');
    const rec = store.wordRec(w.word);
    ui.openSheet({ title:w.word, body:`
      <div class="t-center mb-3"><div class="word-en" style="font-size:30px">${esc(w.word)}</div>
        ${w.phonetic ? `<div class="phonetic">${esc(w.phonetic)}</div>` : ''}
        <button class="speak-btn mt-2" data-speak="${attr(w.word)}">${ui.icon('sound', 18)} 朗读</button></div>
      <div class="kv"><span class="k">中文释义</span><span class="v">${esc(w.meaning || '暂无')}</span></div>
      <div class="kv"><span class="k">熟练度</span><span class="v">${esc(srs.levelName(rec.level || 0))} Lv.${rec.level || 0}</span></div>
      <div class="kv"><span class="k">复习次数</span><span class="v">${rec.reviews || 0}</span></div>
      <div class="kv"><span class="k">下次复习</span><span class="v">${rec.dueAt ? esc(new Date(rec.dueAt).toLocaleString('zh-CN')) : '未安排'}</span></div>
      ${w.example ? `<div class="mt-3 t-sm"><b>例句：</b>${esc(w.example)}</div>` : ''}
      <div class="mt-3">${ui.labelChip(w.source === 'core' ? 'ai' : 'user', words.sourceLabel(w).text)}</div>`,
      actions:[{ label:'关闭', cls:'btn-outline' }, { label:'编辑补全', cls:'btn-primary',
        onClick:() => setTimeout(() => openEditSheet(w, ctx), 120) }] });
  },
  unfav: (el, ctx) => {
    const k = el.dataset.w;
    store.update(() => { const r = store.wordRec(k); r.favorite = false; });
    ctx.refresh();
  }
};

function openEditSheet(w, ctx) {
  ui.openSheet({ title:'编辑 / 补全词条', body:`
    <div class="t-xs t-muted mb-3">保存后该词会进入「我导入/编辑的词」，优先于内置演示词条显示。音标、释义请以你手中的正式资料为准。</div>
    <label class="field"><span class="field-label">单词</span><input class="input" id="ew-word" value="${attr(w.word)}"></label>
    <label class="field"><span class="field-label">音标</span><input class="input" id="ew-ph" value="${attr(w.phonetic || '')}" placeholder="/əˈbændən/"></label>
    <label class="field"><span class="field-label">词性</span><input class="input" id="ew-pos" value="${attr(w.pos || '')}" placeholder="v. / n. / a."></label>
    <label class="field"><span class="field-label">中文释义</span><input class="input" id="ew-mean" value="${attr(w.meaning || '')}" placeholder="放弃；抛弃"></label>
    <label class="field"><span class="field-label">英文例句（可选）</span><textarea class="textarea" id="ew-ex" placeholder="An example sentence.">${esc(w.example || '')}</textarea></label>
    <label class="field"><span class="field-label">常见搭配（可选，用「；」分隔）</span><input class="input" id="ew-col" value="${attr((w.collocations || []).join('；'))}"></label>
    <label class="field"><span class="field-label">熟词僻义（可选）</span><input class="input" id="ew-rare" value="${attr(w.rare || '')}"></label>`,
    actions:[
      { label:'取消', cls:'btn-outline' },
      { label:'保存词条', cls:'btn-primary', onClick:() => {
        const g = id => (document.getElementById(id)?.value || '').trim();
        const word = g('ew-word');
        if (!word) return ui.toast('单词不能为空', 'err');
        words.upsertCustomWord({ word, phonetic:g('ew-ph'), pos:g('ew-pos'), meaning:g('ew-mean'),
          example:g('ew-ex'), exampleZh:'', rare:g('ew-rare'),
          collocations:g('ew-col') ? g('ew-col').split(/[；;]/).map(s => s.trim()).filter(Boolean) : [],
          tier:w.tier || 'mid', tags:w.tags || [] });
        ui.toast('已保存，刷新后依然保留', 'ok');
        ctx.refresh();
      } }
    ] });
}

export function onInput(el, ctx) {
  if (el.dataset.input === 'word-search') {
    ses.q = el.value;
    // 局部刷新结果区，避免输入框失焦
    const box = document.getElementById('word-list-result');
    const shown = words.searchWords(ses.q, 80);
    if (box) box.innerHTML = listResultHTML(shown);
    const cnt = document.getElementById('word-list-count');
    if (cnt) cnt.textContent = `匹配 ${shown.length} 条`;
    const ttl = document.getElementById('word-list-title');
    if (ttl) ttl.textContent = ses.q ? `搜索「${ses.q}」` : '词表内容';
  }
}
export function onChange(el, ctx) {
  if (el.dataset.change === 'list-select') { ses.listId = el.value; ses.queue = []; ses.idx = 0; ctx.refresh(); }
}

function listResultHTML(shown) {
  if (!shown.length) return `<div class="card card-pad t-sm t-muted">没有匹配的词条。</div>`;
  return `<div class="list">${shown.map(w => {
    const rec = store.wordRec(w.word);
    const src = words.sourceLabel(w);
    return `<div class="list-item">
      <span class="li-main"><span class="li-title">${esc(w.word)} ${w.phonetic ? `<span class="phonetic t-xs">${esc(w.phonetic)}</span>` : ''}</span>
        <span class="li-sub">${esc(w.meaning || '（暂无释义，可点击补全）')} · ${esc(srs.levelName(rec.level || 0))}</span></span>
      <span class="chip ${src.cls}">${esc(src.text)}</span>
      <button class="btn btn-xs btn-soft" data-action="view-word" data-w="${attr(w.word)}">查看</button></div>`;
  }).join('')}</div>`;
}
