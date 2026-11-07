/* 完形填空：逐空选择 / 上下文关联 / 词汇语法解析 / 统一评分 / 错题记录 */
import * as store from '../store.js';
import { ui } from '../ui.js';
import { esc, attr, pct, fmtShort } from '../utils.js';
import { CLOZE_PASSAGES, CLOZE_BLANKS, CLOZE_KEYS, CLOZE_META } from '../../data/cloze.js';

function getDraft(id) {
  const d = store.get().drafts['cloze_' + id];
  return d && typeof d === 'object' ? d : { answers:{}, submitted:false };
}
function setDraft(id, d) { store.update(s => { s.drafts['cloze_' + id] = d; }); }

function passageHTML(p, d) {
  const blanks = CLOZE_BLANKS[p.id] || [];
  const html = p.text.split(/\n\s*\n/).map((para, pi) => {
    const inner = esc(para).replace(/\{\{(\d+)\}\}/g, (m, n) => {
      const no = Number(n);
      const a = d.answers[no];
      const label = a !== undefined ? `${no}.${'ABCD'[a]}` : `${no}. ____`;
      const cls = d.submitted
        ? (a === (CLOZE_KEYS[p.id][no] || {}).answer ? 'blank-ok' : 'blank-bad')
        : (a !== undefined ? 'filled' : '');
      return `<button class="blank-btn ${cls}" data-action="pick-blank" data-no="${no}" ${d.submitted ? 'disabled' : ''}>${label}</button>`;
    });
    return `<p><span class="para-no">${pi + 1}</span>${inner}</p>`;
  }).join('');
  return `<div class="article-body"><div class="prose">${html}</div></div>`;
}

function resultHTML(p, d, ctx) {
  const blanks = CLOZE_BLANKS[p.id], keys = CLOZE_KEYS[p.id];
  const score = blanks.filter(b => d.answers[b.no] === keys[b.no].answer).length;
  return `<div class="card card-pad t-center mb-3">
    <div class="stat-num" style="font-size:42px">${score}/${blanks.length}</div>
    <div class="t-md t-muted mt-2">本次正确率 ${pct(score, blanks.length)}%</div>
    <div class="t-sm t-muted mt-2">成绩已保存，答错的空已自动进入错题本。</div>
    <div class="btn-row mt-4"><button class="btn btn-outline equal" data-action="retry">重新练习</button>
      <a class="btn btn-primary equal" href="#/review">查看错题本</a></div></div>
    ${ui.sectionHead('逐空解析')}
    ${blanks.map(b => {
      const k = keys[b.no], mine = d.answers[b.no];
      return `<div class="card card-pad mb-3">
        <div class="flex between mb-2"><b>第 ${b.no} 空</b>
          <span class="chip ${mine === k.answer ? 'chip-success' : 'chip-danger'}">${mine === undefined ? '未作答' : '选 ' + 'ABCD'[mine]} · 正确 ${'ABCD'[k.answer]}</span></div>
        <div class="t-sm mb-2">正确选项：<b>${esc(b.options[k.answer])}</b></div>
        <div class="analysis">
          <h4>上下文关联</h4><div>${esc(k.context)}</div>
          <h4 class="mt-2">词汇与语法解析</h4><div>${esc(k.lexicon)}</div>
          <div class="t-xs t-muted mt-2">知识点：${esc(k.knowledge)}</div></div></div>`;
    }).join('')}`;
}

export function render(ctx) {
  const id = ctx.params[0];
  if (!id) {
    const s = store.get();
    return `${ui.contentNotice(CLOZE_META)}
      ${ui.sectionHead('完形填空', '', `${CLOZE_PASSAGES.length} 篇演示文章`)}
      <div class="grid grid-md-2">${CLOZE_PASSAGES.map(p => {
        const attempts = s.clozeAttempts.filter(x => x.passageId === p.id);
        return `<a class="card card-pad" href="#/cloze/${attr(p.id)}">
          <div class="article-title" style="font-size:18px">${esc(p.title)}</div>
          <div class="meta-row mt-2 mb-3"><span class="chip">${esc(p.topic)}</span>
            <span class="chip chip-outline">${(CLOZE_BLANKS[p.id] || []).length} 空</span>${ui.labelChip('ai','演示')}</div>
          <div class="t-sm t-muted">逐空选择，完成后统一评分，并给出上下文关联与词汇语法解析。</div>
          <div class="chips mt-3"><span class="chip ${attempts.length ? 'chip-success' : ''}">已练 ${attempts.length} 次</span>
            ${attempts.length ? `<span class="chip chip-brand">最好 ${Math.max(...attempts.map(a => pct(a.score, a.total)))}%</span>` : ''}</div>
          <div class="btn btn-soft btn-block btn-sm mt-3">开始练习</div></a>`;
      }).join('')}</div>`;
  }
  const p = CLOZE_PASSAGES.find(x => x.id === id);
  if (!p) return ui.empty('list', '练习不存在', '请返回列表。', `<a class="btn btn-primary" href="#/cloze">返回列表</a>`);
  const d = getDraft(id);
  const blanks = CLOZE_BLANKS[id], keys = CLOZE_KEYS[id];
  const answered = Object.keys(d.answers).length;

  return `${ui.backLink('#/cloze', '返回完形列表')}
    ${ui.contentNotice(CLOZE_META)}
    <div class="card card-pad mb-3">
      <div class="flex between"><div><div class="t-lg t-bold">${esc(p.title)}</div>
        <div class="t-xs t-muted">${esc(p.topic)} · ${blanks.length} 空 · 建议 ${p.minutes} 分钟</div></div></div>
      <div class="mt-3">${ui.progressBar(pct(answered, blanks.length), true)}</div>
      <div class="t-xs t-muted mt-2">已填 ${answered} / ${blanks.length} 空 · 点击文中的空即可选择答案，刷新页面不会丢失</div>
    </div>
    ${passageHTML(p, d)}
    <div class="card card-pad mt-3">
      <div class="t-sm t-bold mb-2">本文生词</div>
      <div class="gloss-list">${p.gloss.map(g => `<span class="gloss-chip"><b>${esc(g.word)}</b><span>${esc(g.meaning)}</span></span>`).join('')}</div>
    </div>
    ${d.submitted ? resultHTML(p, d, ctx) : `<div class="btn-row mt-4">
      <button class="btn btn-outline equal" data-action="retry">清空重做</button>
      <button class="btn btn-primary equal" data-action="submit">提交并评分${answered < blanks.length ? '（有未填）' : ''}</button></div>
      <div class="t-xs t-muted t-center mt-2">未填的空按错误计分；提交后可查看逐空解析。</div>`}`;
}

export const actions = {
  'pick-blank': (el, ctx) => {
    const id = ctx.params[0];
    const p = CLOZE_PASSAGES.find(x => x.id === id);
    if (!p) return;
    const no = Number(el.dataset.no);
    const b = CLOZE_BLANKS[id].find(x => x.no === no);
    if (!b) return;
    const d = getDraft(id);
    ui.openSheet({ title:`第 ${no} 空`, body:`
      <div class="sheet-desc">选择最符合上下文的一项。解析将在统一评分后显示。</div>
      <div class="opt-list">${b.options.map((o, i) => `<button class="opt ${d.answers[no] === i ? 'correct' : ''}"
        data-action="choose" data-no="${no}" data-idx="${i}"><span class="ltr">${'ABCD'[i]}</span>
        <span class="opt-text">${esc(o)}</span></button>`).join('')}</div>`,
      actions:[{ label:'取消', cls:'btn-outline' }] });
  },
  choose: (el, ctx) => {
    const id = ctx.params[0];
    const d = getDraft(id);
    d.answers[Number(el.dataset.no)] = Number(el.dataset.idx);
    setDraft(id, d);
    ui.closeSheet();
    ctx.refresh();
  },
  submit: (el, ctx) => {
    const id = ctx.params[0], blanks = CLOZE_BLANKS[id], keys = CLOZE_KEYS[id];
    const d = getDraft(id);
    d.submitted = true;
    setDraft(id, d);
    const score = blanks.filter(b => d.answers[b.no] === keys[b.no].answer).length;
    blanks.forEach(b => {
      const mine = d.answers[b.no], k = keys[b.no];
      if (mine === k.answer) return;
      store.addMistake({ source:'cloze', refId:id, questionId:`${id}-b${b.no}`, typeName:'完形填空',
        knowledge:k.knowledge, stem:`第 ${b.no} 空：${CLOZE_PASSAGES.find(p => p.id === id).title}`,
        options:b.options, userAnswer:mine, correctAnswer:k.answer,
        explanation:`${k.context} ${k.lexicon}` });
    });
    store.update(s => s.clozeAttempts.unshift({ id:'ca-' + Date.now(), passageId:id,
      at:new Date().toISOString(), score, total:blanks.length, answers:{ ...d.answers } }));
    store.bumpDaily('practice', 1);
    store.addActivity('完形练习', CLOZE_PASSAGES.find(p => p.id === id).title, `${score}/${blanks.length} 空`);
    ui.toast(`评分完成：${score}/${blanks.length}`, 'ok');
    ctx.refresh();
  },
  retry: (el, ctx) => { setDraft(ctx.params[0], { answers:{}, submitted:false }); ctx.refresh(); }
};
