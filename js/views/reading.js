/* 阅读理解：文章 / 生词 / 长难句 / 结构主旨 / 逐题练习 / 错题归档 */
import * as store from '../store.js';
import { ui } from '../ui.js';
import { esc, attr, pct, fmtShort } from '../utils.js';
import { ARTICLES, QUESTIONS, ANSWER_KEYS, READING_META } from '../../data/reading.js';

const VIEWS = [
  { id:'text', name:'文章' }, { id:'questions', name:'逐题练习' },
  { id:'sentences', name:'长难句' }, { id:'analysis', name:'结构与主旨' }
];
let hiPara = 0;

/* 内置演示文章 + 用户批量导入的文章（课程/题目/答案/解析在数据层分离） */
function articlesAll() {
  const custom = (store.get().customArticles || []).map(a => ({
    ...a, level:a.level || '用户导入', topic:a.topic || '用户导入', minutes:a.minutes || 10,
    paragraphs:a.paragraphs || [], gloss:a.gloss || [], sentences:a.sentences || [],
    structure:a.structure || { thesis:'（用户导入文章，尚未填写结构分析）', outline:[], tone:'—' }
  }));
  return [...ARTICLES, ...custom];
}
function questionsOf(id) {
  const custom = (store.get().customArticles || []).find(a => a.id === id);
  if (custom) return (custom.questions || []).map(q => ({ ...q, type:q.type || 'single' }));
  return QUESTIONS[id] || [];
}
function keysOf(id) {
  const custom = (store.get().customArticles || []).find(a => a.id === id);
  if (custom) return custom.answerKeys || {};
  return ANSWER_KEYS[id] || {};
}

function getDraft(id) {
  const d = store.get().drafts['reading_' + id];
  return d && typeof d === 'object' ? d : { answers:{}, idx:0, finished:false };
}
function setDraft(id, d) { store.update(s => { s.drafts['reading_' + id] = d; }); }

function markGloss(text, gloss) {
  let out = esc(text);
  const list = gloss.map(g => g.word).filter(w => /^[A-Za-z-]+$/.test(w));
  if (!list.length) return out;
  const re = new RegExp('\\b(' + list.map(w => w.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|') + ')\\b', 'gi');
  return out.replace(re, m => `<span class="gloss-word" data-action="gloss" data-w="${attr(m.toLowerCase())}">${m}</span>`);
}

function articleTextHTML(a, ctx) {
  return `<div class="article-body">
    <div class="article-title">${esc(a.title)}</div>
    <div class="meta-row mb-3"><span class="chip">${esc(a.topic)}</span><span class="chip">${esc(a.level)}</span>
      <span class="chip chip-outline">建议 ${a.minutes} 分钟</span>${ui.labelChip('ai','演示文章·AI生成')}</div>
    <div class="prose">${a.paragraphs.map(p => `<p class="${hiPara === p.no ? 'hl-para' : ''}" data-para="${p.no}">
      <span class="para-no">${p.no}</span>${markGloss(p.text, a.gloss)}</p>`).join('')}</div>
    ${hiPara ? `<div class="notice brand mt-3">${ui.icon('info',16)}<div>已定位到第 ${hiPara} 段（题目解析中的定位段落）。<button class="btn btn-xs btn-ghost" data-action="clear-locate">清除高亮</button></div></div>` : ''}
  </div>
  <div class="card card-pad mt-3">
    <div class="t-sm t-bold mb-2">本文生词标注（点击可收藏）</div>
    <div class="gloss-list">${a.gloss.map(g => `<button class="gloss-chip" data-action="gloss" data-w="${attr(g.word)}">
      <b>${esc(g.word)}</b><span>${esc(g.meaning)}</span></button>`).join('')}</div>
  </div>`;
}

function questionsHTML(a, ctx) {
  const qs = questionsOf(a.id);
  const keys = keysOf(a.id);
  const d = getDraft(a.id);
  if (d.finished) {
    const score = qs.filter(q => d.answers[q.id] === keys[q.id]?.answer).length;
    return `<div class="card card-pad t-center">
      <div class="stat-num" style="font-size:42px">${score}/${qs.length}</div>
      <div class="t-md t-muted mt-2">本次正确率 ${pct(score, qs.length)}%</div>
      <div class="t-sm t-muted mt-2">成绩已保存，答错的题目已自动进入错题本。</div>
      <div class="btn-row mt-4"><button class="btn btn-outline equal" data-action="retry">重新练习</button>
        <button class="btn btn-primary equal" data-action="set-view" data-view="analysis">看文章结构</button></div></div>
      ${qs.map((q, i) => resultBlock(q, keys[q.id], d.answers[q.id], i)).join('')}`;
  }

  const idx = Math.min(d.idx, qs.length - 1);
  const q = qs[idx];
  const k = keys[q.id];
  const picked = d.answers[q.id];
  const answered = picked !== undefined;
  const answeredCount = Object.keys(d.answers).length;

  return `<div class="card card-pad mb-3">
    <div class="flex between"><b>逐题练习 ${idx + 1} / ${qs.length}</b><span class="t-sm t-muted">已答 ${answeredCount} 题</span></div>
    ${ui.progressBar(pct(answeredCount, qs.length), true)}
    <div class="exam-nav mt-3" style="grid-template-columns:repeat(${qs.length},minmax(0,1fr))">
      ${qs.map((qq, i) => `<button class="${d.answers[qq.id] !== undefined ? 'done' : ''} ${i === idx ? 'current' : ''}"
        data-action="goto-q" data-idx="${i}">${i + 1}</button>`).join('')}</div>
  </div>
  <div class="card card-pad mb-3">
    <div class="q-tag">${esc(q.tag)} · 第 ${idx + 1} 题</div>
    <div class="stem">${esc(q.stem)}</div>
    <div class="opt-list">${q.options.map((o, i) => {
      let cls = '';
      if (answered) { if (i === k.answer) cls = 'correct'; else if (i === picked) cls = 'wrong'; else cls = 'dim'; }
      return `<button class="opt ${cls}" data-action="answer" data-idx="${i}" ${answered ? 'disabled' : ''}>
        <span class="ltr">${'ABCD'[i]}</span><span class="opt-text">${esc(o)}</span></button>`;
    }).join('')}</div>
  </div>
  ${answered ? `<div class="analysis mb-3">
    <h4>${picked === k.answer ? '✓ 回答正确' : '✗ 回答错误'}　正确答案 ${'ABCD'[k.answer]}</h4>
    <div class="loc">题目定位：${esc(k.location)}　<button class="btn btn-xs btn-soft" data-action="locate" data-para="${attr((k.location.match(/第\s*(\d+)\s*段/) || [])[1] || 1)}">跳到该段</button></div>
    <div><b>正确选项解析：</b>${esc(k.correct)}</div>
    <div class="mt-2"><b>错误选项分析：</b></div>
    <ul>${k.wrong.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
    <div class="t-xs t-muted mt-2">知识点：${esc(k.knowledge)}</div>
  </div>
  <div class="btn-row mb-3">
    <button class="btn btn-outline equal" data-action="add-mistake" data-q="${attr(q.id)}">加入错题本</button>
    <button class="btn btn-primary equal" data-action="next-q">${idx + 1 >= qs.length ? '完成并查看成绩' : '下一题 ›'}</button>
  </div>` : `<button class="btn btn-ghost btn-block btn-sm" data-action="locate" data-para="1">回文章定位</button>`}`;
}

function resultBlock(q, k, picked, i) {
  if (!k) return '';
  return `<div class="card card-pad mt-3">
    <div class="q-tag">第 ${i + 1} 题 · ${esc(q.tag)} ${picked === k.answer ? '<span class="chip chip-success">正确</span>' : '<span class="chip chip-danger">错误</span>'}</div>
    <div class="stem" style="font-size:15px">${esc(q.stem)}</div>
    <div class="t-sm">你的答案：<b>${picked === undefined ? '未作答' : 'ABCD'[picked]}</b>　正确答案：<b class="t-success">${'ABCD'[k.answer]}</b></div>
    <div class="analysis mt-2"><div class="loc">${esc(k.location)}</div>${esc(k.correct)}</div></div>`;
}

function sentencesHTML(a) {
  return `<div class="card card-pad mb-3"><div class="t-sm t-muted">以下长难句拆解为演示解析，用于练习「找主干 → 挂修饰」的阅读方法。</div></div>
    ${a.sentences.map((s, i) => `<div class="card card-pad mb-3">
      <div class="flex between mb-2"><b>长难句 ${i + 1}</b><span class="chip">第 ${s.para} 段</span></div>
      <div class="sentence-card"><div class="sentence-en">${esc(s.text)}</div>
        <button class="speak-btn" data-speak="${attr(s.text)}">${ui.icon('sound', 17)} 朗读句子</button></div>
      <div class="t-sm t-bold mt-3">结构拆解</div>
      <div class="sentence-split">${esc(s.split)}</div>
      <div class="sentence-note">提示：${esc(s.note)}</div></div>`).join('')}`;
}

function analysisHTML(a) {
  return `<div class="card card-pad mb-3">
    <div class="t-sm t-bold mb-2">主旨</div><div class="bodytext">${esc(a.structure.thesis)}</div></div>
  <div class="card card-pad mb-3">
    <div class="t-sm t-bold mb-2">文章结构</div>
    ${a.structure.outline.map((o, i) => `<div class="task-row"><span class="pill-num">${i + 1}</span><span class="flex-1 t-sm">${esc(o)}</span></div>`).join('')}</div>
  <div class="card card-pad">
    <div class="t-sm t-bold mb-2">语气与态度</div><div class="bodytext">${esc(a.structure.tone)}</div>
    <div class="t-xs t-muted mt-3">以上为演示文章的结构分析示例，非真题解析。</div></div>`;
}

export function render(ctx) {
  const id = ctx.params[0];
  if (!id) {
    const s = store.get();
    return `${ui.contentNotice(READING_META)}
      ${ui.sectionHead('阅读理解', '', `${articlesAll().length} 篇文章`)}
      <div class="grid grid-md-2">${articlesAll().map(a => {
        const attempts = s.readingAttempts.filter(x => x.articleId === a.id);
        const best = attempts.length ? Math.max(...attempts.map(x => pct(x.score, x.total))) : null;
        return `<a class="card card-pad" href="#/reading/${attr(a.id)}">
          <div class="article-title" style="font-size:18px">${esc(a.title)}</div>
          <div class="meta-row mt-2 mb-3"><span class="chip">${esc(a.topic)}</span>
            <span class="chip chip-outline">${a.paragraphs.length} 段 · ${questionsOf(a.id).length} 题</span>${a.label === 'user' ? ui.labelChip('user','用户导入') : ui.labelChip('ai','演示')}</div>
          <div class="t-sm t-muted">${esc(a.structure.thesis)}</div>
          <div class="chips mt-3"><span class="chip ${attempts.length ? 'chip-success' : ''}">已练 ${attempts.length} 次</span>
            ${best !== null ? `<span class="chip chip-brand">最好 ${best}%</span>` : ''}</div>
          <div class="btn btn-soft btn-block btn-sm mt-3">开始阅读</div></a>`;
      }).join('')}</div>`;
  }
  const a = articlesAll().find(x => x.id === id);
  if (!a) return ui.empty('book', '文章不存在', '请返回列表选择。', `<a class="btn btn-primary" href="#/reading">返回列表</a>`);
  const view = ctx.query.get('view') || 'text';
  const tabs = `<div class="tabs">${VIEWS.map(v => `<button class="${v.id === view ? 'active' : ''}" data-action="set-view" data-view="${v.id}">${v.name}</button>`).join('')}</div>`;
  const body = view === 'questions' ? questionsHTML(a, ctx)
    : view === 'sentences' ? sentencesHTML(a)
    : view === 'analysis' ? analysisHTML(a)
    : articleTextHTML(a, ctx);
  return `${ui.backLink('#/reading', '返回文章列表')}
    ${ui.contentNotice(READING_META)}
    <div class="flex between mb-3"><div><div class="t-lg t-bold">${esc(a.title)}</div>
      <div class="t-xs t-muted">${esc(a.topic)} · ${a.paragraphs.length} 段 · ${questionsOf(a.id).length} 题</div></div></div>
    ${tabs}${body}`;
}

export const actions = {
  'set-view': (el, ctx) => ctx.setQuery('view', el.dataset.view),
  gloss: (el) => {
    const w = el.dataset.w;
    const a = articlesAll().find(x => x.gloss.some(g => g.word === w));
    const g = a && a.gloss.find(x => x.word === w);
    if (!g) return;
    ui.openSheet({ title:g.word, body:`
      <div class="phonetic mb-2">${esc(g.phonetic || '')}</div>
      <div class="t-lg t-bold mb-3">${esc(g.meaning)}</div>
      <button class="speak-btn" data-speak="${attr(g.word)}">${ui.icon('sound', 18)} 朗读</button>
      <div class="t-xs t-muted mt-3">出自第 ${g.para} 段（演示文章生词标注）。</div>`,
      actions:[{ label:'关闭', cls:'btn-outline' },
        { label:'收藏到生词本', cls:'btn-primary', onClick:() => {
          store.update(() => { const r = store.wordRec(w); r.favorite = true; });
          store.addActivity('收藏生词', w, '来自阅读文章');
          ui.toast('已收藏到生词本', 'ok');
        } }] });
  },
  'clear-locate': (el, ctx) => { hiPara = 0; ctx.refresh(); },
  locate: (el, ctx) => { hiPara = Number(el.dataset.para) || 0; ctx.setQuery('view', 'text'); },
  'goto-q': (el, ctx) => { const d = getDraft(ctx.params[0]); d.idx = Number(el.dataset.idx); setDraft(ctx.params[0], d); ctx.refresh(); },
  answer: (el, ctx) => {
    const id = ctx.params[0], qs = questionsOf(id), keys = keysOf(id);
    const d = getDraft(id); const q = qs[d.idx]; const picked = Number(el.dataset.idx);
    if (d.answers[q.id] !== undefined) return;
    d.answers[q.id] = picked;
    setDraft(id, d);
    if (picked !== keys[q.id].answer) {
      store.addMistake({ source:'reading', refId:id, questionId:q.id, typeName:'阅读理解',
        knowledge:keys[q.id].knowledge, stem:q.stem, options:q.options,
        userAnswer:picked, correctAnswer:keys[q.id].answer,
        explanation:`${keys[q.id].location}；${keys[q.id].correct}` });
    }
    ctx.refresh();
  },
  'add-mistake': (el, ctx) => {
    const id = ctx.params[0], qid = el.dataset.q;
    const q = questionsOf(id).find(x => x.id === qid), k = keysOf(id)[qid];
    const d = getDraft(id);
    store.addMistake({ source:'reading', refId:id, questionId:qid, typeName:'阅读理解', knowledge:k.knowledge,
      stem:q.stem, options:q.options, userAnswer:d.answers[qid], correctAnswer:k.answer,
      explanation:`${k.location}；${k.correct}` });
    ui.toast('已加入错题本', 'ok');
  },
  'next-q': (el, ctx) => {
    const id = ctx.params[0], qs = questionsOf(id), keys = keysOf(id);
    const d = getDraft(id);
    if (d.idx + 1 < qs.length) { d.idx++; setDraft(id, d); return ctx.refresh(); }
    d.finished = true; setDraft(id, d);
    const score = qs.filter(q => d.answers[q.id] === keys[q.id]?.answer).length;
    store.update(s => s.readingAttempts.unshift({ id:'ra-' + Date.now(), articleId:id, at:new Date().toISOString(),
      score, total:qs.length, answers:{ ...d.answers } }));
    store.bumpDaily('practice', 1);
    store.addActivity('阅读练习', articlesAll().find(a => a.id === id).title, `${score}/${qs.length} 题`);
    ui.toast(`本次完成：${score}/${qs.length}`, 'ok');
    ctx.refresh();
  },
  retry: (el, ctx) => { setDraft(ctx.params[0], { answers:{}, idx:0, finished:false }); ctx.refresh(); }
};
