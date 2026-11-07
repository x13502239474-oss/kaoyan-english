/* ============================================================
   真题与模拟考试（演示卷）
   ------------------------------------------------------------
   本站不含任何历年真题。按套卷（演示分组）/ 按题型分类练习。
   计时、题号导航、答题状态、暂存答案、主动/自动交卷、
   客观题自动评分、主观题保存答卷、考试报告、错题归档、历史成绩。
   ============================================================ */
import * as store from '../store.js';
import { ui } from '../ui.js';
import { esc, attr, fmtShort, fmtDuration, pct, uid } from '../utils.js';
import { EXAM_PAPERS, EXAM_QUESTIONS, EXAM_KEYS, EXAM_PASSAGES, EXAM_META } from '../../data/exams.js';

let timerId = null;

const TYPE_NAMES = { cloze:'完形', reading:'阅读', translation:'翻译', writing:'写作', vocab:'词汇', all:'综合' };

/** 全部题目，附加所属卷与答案 key（答案与题目在数据层分离） */
function allQuestions() {
  const out = [];
  for (const pid of Object.keys(EXAM_QUESTIONS)) {
    for (const q of EXAM_QUESTIONS[pid]) out.push({ ...q, paperId:pid, key:EXAM_KEYS[pid]?.[q.id] || null });
  }
  return out;
}

function typeQuestions(type) {
  const all = allQuestions();
  if (type === 'all') return all.filter(q => q.type === 'single');
  return all.filter(q => q.type === 'single' && q.typeName === TYPE_NAMES[type]);
}

/** 统一试卷定义（正式卷 / 动态专项卷） */
function getPaper(paperId) {
  if (String(paperId).startsWith('type-')) {
    const type = paperId.slice(5);
    const qs = typeQuestions(type);
    const total = qs.reduce((n, q) => n + q.score, 0);
    return { id:paperId, name:`${TYPE_NAMES[type] || type}专项小测`, year:'题型练习',
      duration:Math.max(10, Math.ceil(qs.length * 1.5)), totalScore:total,
      desc:`从演示题库抽取 ${qs.length} 道客观题，自动评分`,
      sections:[{ id:'s1', type:'single', title:'专项小测', qids:qs.map(q => q.id) }],
      questions:qs, dynamic:true };
  }
  const p = EXAM_PAPERS.find(x => x.id === paperId);
  if (!p) return null;
  const qs = (EXAM_QUESTIONS[p.id] || []).map(q => ({ ...q, key:EXAM_KEYS[p.id]?.[q.id] || null }));
  return { ...p, questions:qs, dynamic:false };
}

function currentExam() { return store.get().examCurrent; }

function startExam(paperId, ctx) {
  const p = getPaper(paperId);
  if (!p || !p.questions.length) return ui.toast('该分类暂无可用题目', 'err');
  const now = Date.now();
  store.update(s => {
    s.examCurrent = { paperId, name:p.name, startedAt:now, deadline:now + p.duration * 60000,
      answers:{}, subjective:{}, current:0, flagged:[], objectiveTotal:p.questions.filter(q => q.type === 'single').reduce((n, q) => n + q.score, 0) };
  });
  store.addActivity('开始考试', p.name, `${p.duration} 分钟`);
  ctx.go('#/exam/' + paperId);
}

function submitExam(ctx, auto = false) {
  const cur = currentExam();
  if (!cur) return;
  const p = getPaper(cur.paperId);
  if (!p) return;
  const objectiveQs = p.questions.filter(q => q.type === 'single');
  let score = 0, total = 0;
  const wrong = [];
  const sectionStats = {};
  objectiveQs.forEach(q => {
    total += q.score;
    const mine = cur.answers[q.id];
    const ok = mine !== undefined && q.key && mine === q.key.answer;
    if (ok) score += q.score;
    else wrong.push(q);
    const sec = p.sections.find(x => (x.qids || []).includes(q.id));
    const sname = sec ? sec.title : '客观题';
    if (!sectionStats[sname]) sectionStats[sname] = { right:0, count:0 };
    sectionStats[sname].count++;
    if (ok) sectionStats[sname].right++;
  });

  const result = {
    id:uid('res'), paperId:cur.paperId, paperName:cur.name, at:new Date().toISOString(),
    durationSec:Math.max(0, Math.round((Date.now() - cur.startedAt) / 1000)), auto,
    objectiveScore:score, objectiveTotal:total, score, total:p.totalScore,
    answers:{ ...cur.answers }, subjective:{ ...cur.subjective },
    sectionStats, wrongIds:wrong.map(q => q.id), questionCount:p.questions.length
  };
  store.update(s => {
    s.examResults.unshift(result);
    s.examCurrent = null;
  });
  // 客观错题归档
  wrong.forEach(q => {
    store.addMistake({ source:'exam', refId:cur.paperId, questionId:q.id, typeName:q.typeName,
      knowledge:q.knowledge, stem:q.stem, options:q.options || [],
      userAnswer:cur.answers[q.id], correctAnswer:q.key ? q.key.answer : null,
      explanation:q.key ? q.key.explanation : '' });
  });
  store.bumpDaily('practice', 1);
  store.addActivity('提交试卷', cur.name, `${score}/${total} 分${auto ? '（自动交卷）' : ''}`);
  ui.toast(auto ? '时间到，已自动交卷' : `交卷成功：客观题 ${score}/${total}`, 'ok');
  ctx.go('#/exam/result/' + result.id);
}

/* ---------- 考试进行中 ---------- */
function runningHTML(ctx, p, cur) {
  const qs = p.questions;
  const idx = Math.min(cur.current || 0, qs.length - 1);
  const q = qs[idx];
  const answeredCount = qs.filter(x => x.type === 'single' ? cur.answers[x.id] !== undefined : (cur.subjective[x.id] || '').trim()).length;
  const passage = q.passage ? EXAM_PASSAGES[q.passage] : (() => {
    const sec = p.sections.find(x => (x.qids || []).includes(q.id));
    return sec && sec.passage ? EXAM_PASSAGES[sec.passage] : null;
  })();
  const flagged = (cur.flagged || []).includes(q.id);
  const left = Math.max(0, Math.floor((cur.deadline - Date.now()) / 1000));

  return `<div class="sticky-timer flex between wrap gap-2">
    <div class="flex gap-2"><span class="t-sm t-muted">剩余时间</span><span class="timer" id="exam-timer">${fmtDuration(left)}</span>
      <span class="t-xs t-muted">/ ${p.duration} 分钟</span></div>
    <div class="flex gap-2"><span class="t-xs t-muted">已答 ${answeredCount}/${qs.length}</span>
      <button class="btn btn-xs btn-danger" data-action="submit-exam">交卷</button></div>
  </div>
  <div class="card card-pad mb-3">
    <div class="flex between mb-2"><b>题号导航</b><span class="t-xs t-muted">蓝底=已答 · 红点=标记</span></div>
    <div class="exam-nav">${qs.map((x, i) => {
      const done = x.type === 'single' ? cur.answers[x.id] !== undefined : !!(cur.subjective[x.id] || '').trim();
      return `<button class="${done ? 'done' : ''} ${i === idx ? 'current' : ''} ${(cur.flagged || []).includes(x.id) ? 'flagged' : ''}"
        data-action="goto" data-idx="${i}">${i + 1}</button>`;
    }).join('')}</div>
    <div class="t-xs t-muted mt-3">答案随时自动暂存，刷新或关闭浏览器后回来可继续；到时间会自动交卷。</div>
  </div>

  <div class="card card-pad mb-3">
    <div class="q-tag">第 ${idx + 1} 题 · ${esc(q.typeName)} · ${q.score} 分</div>
    ${passage ? `<div class="sentence-card mb-3"><div class="t-xs t-bold mb-1">${esc(passage.title)}</div>
      <div class="sentence-en" style="font-size:15px">${esc(passage.text)}</div></div>` : ''}
    <div class="stem">${esc(q.stem)}</div>
    ${q.type === 'single'
      ? `<div class="opt-list">${(q.options || []).map((o, i) => `<button class="opt ${cur.answers[q.id] === i ? 'correct' : ''}"
          data-action="answer" data-idx="${i}"><span class="ltr">${'ABCD'[i]}</span><span class="opt-text">${esc(o)}</span></button>`).join('')}</div>`
      : `<textarea class="editor" data-input="exam-text" data-qid="${attr(q.id)}" placeholder="在此作答（主观题不自动评分，交卷后保留在考试报告中）…">${esc((cur.subjective || {})[q.id] || '')}</textarea>
         ${q.hint ? `<div class="field-hint">提示：${esc(q.hint)}</div>` : ''}`}
  </div>
  <div class="btn-row mb-3">
    <button class="btn btn-outline equal" data-action="prev-q" ${idx === 0 ? 'disabled' : ''}>‹ 上一题</button>
    <button class="btn btn-outline equal" data-action="flag">${flagged ? '取消标记' : '标记本题'}</button>
    <button class="btn btn-primary equal" data-action="next-q" ${idx >= qs.length - 1 ? 'disabled' : ''}>下一题 ›</button>
  </div>
  <div class="btn-row"><button class="btn btn-ghost btn-block btn-sm" data-action="abandon">放弃本次考试</button></div>`;
}

/* ---------- 结果报告 ---------- */
function resultHTML(ctx, result) {
  const p = getPaper(result.paperId);
  const wrongQs = p ? p.questions.filter(q => result.wrongIds.includes(q.id)) : [];
  const subjectiveQs = p ? p.questions.filter(q => q.type === 'text') : [];
  return `${ui.backLink('#/exam', '返回考试中心')}
    ${ui.contentNotice(EXAM_META)}
    <div class="card card-pad t-center mb-3">
      <div class="t-lg t-bold">${esc(result.paperName)} · 考试报告</div>
      <div class="stat-num mt-3" style="font-size:44px">${result.objectiveScore}<span style="font-size:20px;color:var(--muted)"> / ${result.objectiveTotal}</span></div>
      <div class="t-sm t-muted mt-1">客观题得分（正确率 ${pct(result.objectiveScore, result.objectiveTotal)}%）</div>
      <div class="chips mt-3" style="justify-content:center">
        <span class="chip">用时 ${fmtDuration(result.durationSec)}</span>
        <span class="chip chip-outline">${esc(fmtShort(result.at))}</span>
        ${result.auto ? '<span class="chip chip-warn">自动交卷</span>' : ''}
        <span class="chip chip-outline">共 ${result.questionCount} 题</span></div>
      <div class="t-xs t-muted mt-3">主观题不计入自动评分，请在下方自行对照自评。</div>
    </div>

    ${Object.keys(result.sectionStats || {}).length ? `<div class="card card-pad mb-3">
      <div class="t-md t-bold mb-2">分题型表现</div>
      ${Object.entries(result.sectionStats).map(([k, v]) => `<div class="kv"><span class="k">${esc(k)}</span>
        <span class="v">${v.right}/${v.count} · ${pct(v.right, v.count)}%</span></div>`).join('')}</div>` : ''}

    ${ui.sectionHead('错题（已自动归档）', `<a class="more" href="#/review">去错题本 ›</a>`, `${wrongQs.length} 道`)}
    ${wrongQs.length ? wrongQs.map(q => `<div class="card card-pad mb-3">
      <div class="q-tag">${esc(q.typeName)} · ${esc(q.knowledge || '')}</div>
      <div class="stem" style="font-size:15px">${esc(q.stem)}</div>
      <div class="t-sm">你的答案：<b class="t-danger">${result.answers[q.id] === undefined ? '未作答' : 'ABCD'[result.answers[q.id]]}</b>
        正确答案：<b class="t-success">${q.key ? 'ABCD'[q.key.answer] : '—'}</b></div>
      <div class="analysis mt-2">${esc(q.key ? q.key.explanation : '')}</div></div>`).join('')
      : `<div class="card card-pad t-sm t-success">本次客观题全部答对，没有新增错题。</div>`}

    ${subjectiveQs.length ? `${ui.sectionHead('主观题答卷（已保存）')}
      ${subjectiveQs.map(q => `<div class="card card-pad mb-3">
        <div class="q-tag">${esc(q.typeName)}</div><div class="stem" style="font-size:15px">${esc(q.stem)}</div>
        <div class="bodytext mt-2" style="background:var(--surface-2);padding:12px;border-radius:var(--r-md)">${esc(result.subjective[q.id] || '（未作答）')}</div>
        <div class="t-xs t-muted mt-2">${esc(q.hint || '')}　本站不自动判分，请对照课程方法人工自评。</div></div>`).join('')}` : ''}

    <div class="btn-row"><button class="btn btn-outline equal" data-action="retake" data-paper="${attr(result.paperId)}">再考一次</button>
      <a class="btn btn-primary equal" href="#/exam">返回考试中心</a></div>`;
}

/* ---------- 考试中心 ---------- */
function centerHTML(ctx) {
  const s = store.get();
  const cur = currentExam();
  const years = Array.from(new Set(EXAM_PAPERS.map(p => p.year)));
  return `${ui.contentNotice(EXAM_META, '本模块的「年份/套卷」为演示分组，不代表真实考试年份。')}
    ${cur ? `<div class="notice warn">${ui.icon('clock',16)}<div><b>有一场考试进行中</b>：${esc(cur.name)}，
      剩余约 ${Math.max(0, Math.round((cur.deadline - Date.now()) / 60000))} 分钟。
      <button class="btn btn-xs btn-soft mt-2" data-action="resume" data-paper="${attr(cur.paperId)}">继续考试</button></div></div>` : ''}

    ${ui.sectionHead('按年份 / 套卷', '', `${EXAM_PAPERS.length} 套演示模拟卷`)}
    ${years.map(y => `<div class="section"><div class="t-sm t-bold mb-2">${esc(y)}</div>
      <div class="grid grid-md-2">${EXAM_PAPERS.filter(p => p.year === y).map(p => `<div class="card card-pad">
        <div class="flex between"><b>${esc(p.name)}</b><span class="chip chip-brand">${p.duration} 分钟</span></div>
        <div class="t-sm t-muted mt-2">${esc(p.desc)}</div>
        <div class="chips mt-3"><span class="chip chip-outline">满分 ${p.totalScore}（含主观题）</span>
          <span class="chip chip-outline">${(EXAM_QUESTIONS[p.id] || []).length} 题</span></div>
        <button class="btn btn-primary btn-block btn-sm mt-3" data-action="start-exam" data-paper="${attr(p.id)}">开始模拟考试</button>
      </div>`).join('')}</div></div>`).join('')}

    ${ui.sectionHead('按题型分类练习')}
    <div class="card card-pad">
      <div class="t-sm t-muted mb-3">从演示题库按题型抽题组成限时小测；主观题与词汇测试在对应模块完成。</div>
      <div class="quick-grid">${Object.entries(TYPE_NAMES).map(([k, v]) => {
        const n = k === 'all' ? typeQuestions('all').length : typeQuestions(k).length;
        return `<a class="quick" href="#/exam?mode=type&type=${k}"><span class="qi">${ui.icon('target', 20)}</span>
          <span>${esc(v)}专项</span></a>`;
      }).join('')}</div>
      <div class="t-xs t-muted mt-3">可用客观题：${typeQuestions('all').length} 道；翻译/写作/词汇专项会跳转到对应训练模块。</div>
    </div>

    ${ui.sectionHead('历史考试成绩', '', `${s.examResults.length} 次`)}
    ${s.examResults.length ? `<div class="list">${s.examResults.slice(0, 10).map(r => `<a class="list-item" href="#/exam/result/${attr(r.id)}">
      <span class="li-ico">${ui.icon('chart', 18)}</span>
      <span class="li-main"><span class="li-title">${esc(r.paperName)}</span>
        <span class="li-sub">${esc(fmtShort(r.at))} · ${r.objectiveScore}/${r.objectiveTotal} 分 · 用时 ${fmtDuration(r.durationSec)}</span></span>
      <span class="li-r">${r.auto ? '<span class="chip chip-warn">自动交卷</span>' : ''}${ui.icon('arrow', 16)}</span></a>`).join('')}</div>`
      : `<div class="card card-pad t-sm t-muted t-center">还没有考试记录。选一套演示模拟卷开始吧。</div>`}`;
}

function typeHTML(ctx, type) {
  const name = TYPE_NAMES[type] || type;
  if (['translation', 'writing', 'vocab'].includes(type)) {
    const map = {
      translation:{ href:'#/translation', title:'翻译训练', desc:'逐句输入中文译文、参考译文对照、重点语法与长难句拆解，支持多份历史译文。' },
      writing:{ href:'#/writing', title:'写作训练', desc:'小作文/大作文、格式模板、素材库、范文拆解、限时写作与人工自评。' },
      vocab:{ href:'#/words?tab=test', title:'词汇测试', desc:'英译中、中译英、随机抽查三种模式，成绩计入学习统计，答错自动进错题本。' }
    }[type];
    return `${ui.backLink('#/exam', '返回考试中心')}
      <div class="card card-pad"><div class="t-lg t-bold mb-2">${esc(name)}专项</div>
        <div class="t-sm t-ink2 mb-3">${esc(map.desc)}</div>
        <div class="notice">${ui.icon('info',16)}<div>该题型为主观题 / 单词自测，不在此处做客观题自动评分，跳转到对应模块练习更合适。</div></div>
        <a class="btn btn-primary btn-block mt-3" href="${map.href}">前往${esc(map.title)}</a></div>`;
  }
  const qs = typeQuestions(type);
  return `${ui.backLink('#/exam', '返回考试中心')}
    ${ui.contentNotice(EXAM_META)}
    <div class="card card-pad">
      <div class="t-lg t-bold mb-2">${esc(name)}专项小测</div>
      <div class="kv"><span class="k">可用题目</span><span class="v">${qs.length} 道客观题</span></div>
      <div class="kv"><span class="k">建议用时</span><span class="v">${Math.max(10, Math.ceil(qs.length * 1.5))} 分钟</span></div>
      <div class="kv"><span class="k">评分方式</span><span class="v">客观题自动评分</span></div>
      <div class="kv"><span class="k">满分</span><span class="v">${qs.reduce((n, q) => n + q.score, 0)} 分</span></div>
      ${qs.length ? `<button class="btn btn-primary btn-block mt-4" data-action="start-type" data-type="${attr(type)}">开始限时小测</button>`
        : `<div class="notice warn mt-3">该题型暂无客观题，请使用上面的完整模拟卷。</div>`}
    </div>`;
}

export function render(ctx) {
  if (ctx.params[0] === 'result') {
    const r = store.get().examResults.find(x => x.id === ctx.params[1]);
    return r ? resultHTML(ctx, r) : ui.empty('chart', '报告不存在', '可能已被清理。', `<a class="btn btn-primary" href="#/exam">返回考试中心</a>`);
  }
  if (ctx.query.get('mode') === 'type') return typeHTML(ctx, ctx.query.get('type') || 'all');
  if (ctx.params[0]) {
    const paperId = ctx.params[0];
    const p = getPaper(paperId);
    if (!p) return ui.empty('clock', '试卷不存在', '请返回考试中心。', `<a class="btn btn-primary" href="#/exam">返回</a>`);
    const cur = currentExam();
    if (cur && cur.paperId === paperId) {
      return `${ui.contentNotice(EXAM_META)}${runningHTML(ctx, p, cur)}`;
    }
    return `${ui.backLink('#/exam', '返回考试中心')}
      ${ui.contentNotice(EXAM_META)}
      <div class="card card-pad">
        <div class="t-xl t-bold">${esc(p.name)}</div>
        <div class="t-sm t-muted mt-2">${esc(p.desc)}</div>
        <div class="kv mt-3"><span class="k">考试时长</span><span class="v">${p.duration} 分钟</span></div>
        <div class="kv"><span class="k">题目数量</span><span class="v">${p.questions.length} 题</span></div>
        <div class="kv"><span class="k">客观题</span><span class="v">${p.questions.filter(q => q.type === 'single').length} 题（自动评分）</span></div>
        <div class="kv"><span class="k">主观题</span><span class="v">${p.questions.filter(q => q.type === 'text').length} 题（保存答卷）</span></div>
        <button class="btn btn-primary btn-block mt-4" data-action="start-exam" data-paper="${attr(paperId)}">开始考试并计时</button>
        <div class="t-xs t-muted mt-3">开始后答案会持续暂存；时间到自动交卷，也可以随时主动交卷。</div></div>`;
  }
  return centerHTML(ctx);
}

export const actions = {
  'start-exam': (el, ctx) => startExam(el.dataset.paper, ctx),
  'start-type': (el, ctx) => startExam('type-' + el.dataset.type, ctx),
  resume: (el, ctx) => ctx.go('#/exam/' + el.dataset.paper),
  answer: (el, ctx) => {
    const cur = currentExam(); if (!cur) return;
    const p = getPaper(cur.paperId); const q = p.questions[cur.current];
    store.update(s => { s.examCurrent.answers[q.id] = Number(el.dataset.idx); });
    ctx.refresh();
  },
  goto: (el, ctx) => { store.update(s => { s.examCurrent.current = Number(el.dataset.idx); }); ctx.refresh(); },
  'prev-q': (el, ctx) => { store.update(s => { s.examCurrent.current = Math.max(0, s.examCurrent.current - 1); }); ctx.refresh(); },
  'next-q': (el, ctx) => {
    const p = getPaper(currentExam().paperId);
    store.update(s => { s.examCurrent.current = Math.min(p.questions.length - 1, s.examCurrent.current + 1); });
    ctx.refresh();
  },
  flag: (el, ctx) => {
    const cur = currentExam(); const p = getPaper(cur.paperId); const q = p.questions[cur.current];
    store.update(s => {
      const f = s.examCurrent.flagged || [];
      s.examCurrent.flagged = f.includes(q.id) ? f.filter(x => x !== q.id) : [...f, q.id];
    });
    ctx.refresh();
  },
  'submit-exam': (el, ctx) => {
    const cur = currentExam(); if (!cur) return;
    const p = getPaper(cur.paperId);
    const answered = p.questions.filter(q => q.type === 'single' ? cur.answers[q.id] !== undefined : (cur.subjective[q.id] || '').trim()).length;
    ui.confirmSheet({ title:'确认交卷', desc:`已作答 ${answered}/${p.questions.length} 题。交卷后客观题自动评分，未答题目按错计分，主观题答卷会完整保留。`,
      okText:'确认交卷', onOk:() => submitExam(ctx, false) });
  },
  abandon: (el, ctx) => {
    ui.confirmSheet({ title:'放弃本次考试？', desc:'本次已暂存的所有答案将被清除，不会生成成绩报告。', okText:'放弃', danger:true,
      onOk:() => { store.update(s => { s.examCurrent = null; }); ui.toast('已放弃本次考试'); ctx.go('#/exam'); } });
  },
  retake: (el, ctx) => startExam(el.dataset.paper, ctx)
};

export function onInput(el, ctx) {
  if (el.dataset.input !== 'exam-text') return;
  const qid = el.dataset.qid, val = el.value;
  store.update(s => { if (s.examCurrent) s.examCurrent.subjective[qid] = val; });
  const nav = document.querySelector('.exam-nav');
  if (nav) {
    const cur = currentExam(); const p = getPaper(cur.paperId);
    const i = p.questions.findIndex(q => q.id === qid);
    const btn = nav.children[i];
    if (btn) btn.classList.toggle('done', !!val.trim());
  }
}

export function mount(root, ctx) {
  const cur = currentExam();
  if (!cur || ctx.params[0] !== cur.paperId) return;
  if (Date.now() >= cur.deadline) { submitExam(ctx, true); return; }
  clearInterval(timerId);
  timerId = setInterval(() => {
    const el = document.getElementById('exam-timer');
    const left = Math.max(0, Math.floor((cur.deadline - Date.now()) / 1000));
    if (el) { el.textContent = fmtDuration(left); if (left <= 60) el.classList.add('urgent'); }
    if (left <= 0) { clearInterval(timerId); submitExam(ctx, true); }
  }, 1000);
}
export function unmount() { clearInterval(timerId); timerId = null; }
