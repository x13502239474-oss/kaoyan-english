/* 学习首页：今日任务 / 进度 / 单词与复习 / 各题型 / 最近记录 / 快捷入口 */
import * as store from '../store.js';
import * as words from '../words.js';
import * as srs from '../srs.js';
import { ui } from '../ui.js';
import { esc, today, fmtShort, pct, clamp } from '../utils.js';
import { ARTICLES, READING_META } from '../../data/reading.js';
import { CLOZE_PASSAGES } from '../../data/cloze.js';
import { TRANSLATION_TASKS } from '../../data/translation.js';
import { WRITING_TOPICS } from '../../data/writing.js';
import { COURSES } from '../../data/courses.js';
import { EXAM_PAPERS } from '../../data/exams.js';

const QUICK = [
  { id:'words', name:'背单词', icon:'card' },
  { id:'reading', name:'阅读', icon:'book' },
  { id:'cloze', name:'完形', icon:'list' },
  { id:'translation', name:'翻译', icon:'pen' },
  { id:'writing', name:'写作', icon:'note' },
  { id:'exam', name:'模拟考', icon:'clock' }
];

function rate(attempts) {
  const s = attempts.reduce((n, a) => n + (a.score || 0), 0);
  const t = attempts.reduce((n, a) => n + (a.total || 0), 0);
  return { s, t, p: t ? pct(s, t) : null, n: attempts.length };
}

export function render(ctx) {
  const s = store.get();
  const snap = store.snapshot();
  const all = words.allWords();
  const due = srs.dueQueue(all);
  const goalNew = s.settings.dailyWordGoal || 20;
  const goalRev = s.settings.dailyReviewGoal || 30;
  const newDone = snap.daily.newWords || 0;
  const revDone = snap.daily.reviews || 0;
  const practiceDone = snap.daily.practice || 0;
  const wordPctOfAll = pct(snap.started, all.length);
  const coursePct = pct(snap.coursesDone, COURSES.length);
  const reviewPct = clamp(pct(revDone, Math.max(1, revDone + due.length)), 0, 100);

  const tasks = [
    { title:`新学单词 ${Math.min(newDone, goalNew)} / ${goalNew}`, done:newDone >= goalNew, href:'#/words?tab=study' },
    { title:`复习单词 ${Math.min(revDone, goalRev)} / ${goalRev}`, done:revDone >= goalRev, href:'#/words?tab=review' },
    { title:`完成 1 次专项练习（已完成 ${practiceDone}）`, done:practiceDone >= 1, href:'#/practice' },
    { title:`清理到期错题（待办 ${snap.mistakesOpen}）`, done:snap.mistakesOpen === 0, href:'#/review' }
  ];

  const rRate = rate(s.readingAttempts), cRate = rate(s.clozeAttempts);
  const examObjective = rate(s.examResults.map(x => ({ score:x.objectiveScore || 0, total:x.objectiveTotal || 0 })));
  const modules = [
    { name:'阅读理解', n:rRate.n, sub:rRate.p === null ? '尚未练习' : `正确率 ${rRate.p}%`, href:'#/reading', color:'var(--brand)' },
    { name:'完形填空', n:cRate.n, sub:cRate.p === null ? '尚未练习' : `正确率 ${cRate.p}%`, href:'#/cloze', color:'var(--info)' },
    { name:'翻译训练', n:s.translations.length, sub:`保存 ${s.translations.length} 份译文`, href:'#/translation', color:'var(--warn)' },
    { name:'写作训练', n:s.essays.length, sub:`${s.essays.filter(e => e.status === 'done').length} 篇已完成`, href:'#/writing', color:'var(--seal)' },
    { name:'模拟考试', n:s.examResults.length, sub:examObjective.p === null ? '尚无成绩' : `客观题 ${examObjective.p}%`, href:'#/exam', color:'var(--success)' },
    { name:'课程学习', n:snap.coursesDone, sub:`共 ${COURSES.length} 课`, href:'#/courses', color:'var(--label-demo)' }
  ];

  const lastExam = s.examResults[0] || null;
  const activity = s.activity.slice(0, 6);
  const weekday = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][new Date().getDay()];

  return `
  <div class="source-line">${ui.labelChip('ai','本站内容标注')}
    <span class="t-xs t-muted">内置文章/题目/课程/试卷均为演示或 AI 生成示例，不含历年真题；词形清单来自你提供的资料（仅词形）。</span></div>

  <section class="section">
    <div class="hero">
      <div class="flex between"><div><div class="h-title">${esc(today())} · ${weekday}</div>
        <div class="h-sub">今天先从 ${due.length ? `复习 ${due.length} 个到期单词` : '新学一组单词'} 开始</div></div>
        <div style="opacity:.85">${ui.icon('target', 30)}</div></div>
      <div class="h-stats">
        <div class="h-stat"><b>${newDone}</b><span>今日新学</span></div>
        <div class="h-stat"><b>${revDone}</b><span>今日复习</span></div>
        <div class="h-stat"><b>${due.length}</b><span>待复习</span></div>
      </div>
    </div>
  </section>

  <section class="section">
    ${ui.sectionHead('今日学习任务', `<a class="more" href="#/settings">调整目标 ›</a>`)}
    <div class="card card-pad">
      ${tasks.map(t => `<a class="task-row ${t.done ? 'done' : ''}" href="${t.href}">
        <span class="tk-check">${t.done ? ui.icon('check', 14) : ''}</span>
        <span class="flex-1 ${t.done ? 't-muted' : ''}" style="${t.done ? 'text-decoration:line-through' : ''}">${esc(t.title)}</span>
        ${ui.icon('arrow', 16)}</a>`).join('')}
    </div>
  </section>

  <section class="section">
    ${ui.sectionHead('当前学习进度')}
    <div class="grid grid-2 grid-md-3">
      <div class="card card-pad">
        <div class="flex between"><span class="t-sm t-muted">单词学习量</span><b>${snap.started}</b></div>
        ${ui.progressBar(wordPctOfAll, true)}
        <div class="t-xs t-muted mt-2">已接触 ${snap.started} / ${all.length} 词 · 已掌握 ${snap.mastered} · 收藏 ${snap.favorites}</div>
      </div>
      <div class="card card-pad">
        <div class="flex between"><span class="t-sm t-muted">单词复习完成率</span><b>${reviewPct}%</b></div>
        ${ui.progressBar(reviewPct, true)}
        <div class="t-xs t-muted mt-2">今日已复习 ${revDone} · 仍到期 ${due.length} · 累计复习 ${snap.reviewsDone} 次</div>
      </div>
      <div class="card card-pad">
        <div class="flex between"><span class="t-sm t-muted">已完成课程</span><b>${snap.coursesDone}/${COURSES.length}</b></div>
        ${ui.progressBar(coursePct, true)}
        <div class="t-xs t-muted mt-2">加入复习计划 ${Object.values(s.courses).filter(c => c.inReview).length} 课</div>
      </div>
    </div>
  </section>

  <section class="section">
    ${ui.sectionHead('快速进入')}
    <div class="quick-grid">
      ${QUICK.map(q => `<a class="quick" href="#/${q.id}"><span class="qi">${ui.icon(q.icon, 20)}</span><span>${esc(q.name)}</span></a>`).join('')}
    </div>
  </section>

  <section class="section">
    ${ui.sectionHead('各题型练习情况', `<a class="more" href="#/stats">完整统计 ›</a>`)}
    <div class="grid grid-2 grid-md-3">
      ${modules.map(m => `<a class="card card-pad" href="${m.href}">
        <div class="flex between"><span class="t-md t-bold">${esc(m.name)}</span><span class="pill-num">${m.n}</span></div>
        <div class="t-sm t-muted mt-1">${esc(m.sub)}</div></a>`).join('')}
    </div>
  </section>

  <section class="section">
    ${ui.sectionHead('待复习内容', `<a class="more" href="#/review">去复习 ›</a>`)}
    <div class="card card-pad">
      <div class="kv"><span class="k">到期单词</span><span class="v">${due.length} 个</span></div>
      <div class="kv"><span class="k">未掌握错题</span><span class="v">${snap.mistakesOpen} 道</span></div>
      <div class="kv"><span class="k">课程复习计划</span><span class="v">${Object.values(s.courses).filter(c => c.inReview).length} 课</span></div>
      <div class="kv"><span class="k">最近一次模拟考</span><span class="v">${lastExam ? `${esc(lastExam.paperName || lastExam.paperId)} · ${lastExam.objectiveScore || 0}/${lastExam.objectiveTotal || 0} 分` : '暂无记录'}</span></div>
    </div>
  </section>

  <section class="section">
    ${ui.sectionHead('最近学习记录')}
    <div class="card card-pad">
      ${activity.length ? activity.map(a => `<div class="activity-item">
        <span class="at">${esc(fmtShort(a.at))}</span><span class="flex-1">${esc(a.title)}</span>
        ${a.detail ? `<span class="t-xs t-muted">${esc(a.detail)}</span>` : ''}</div>`).join('')
        : `<div class="t-sm t-muted t-center" style="padding:14px 0">还没有学习记录，从上面的快捷入口开始吧。</div>`}
    </div>
  </section>

  ${ui.contentNotice({ contentLabel:'demo', labelText:'内容说明', disclaimer:'本站内置课程、文章、题目、范文与试卷均为演示/AI 生成示例，不含历年考研真题、官方答案或权威词汇数据。' })}`;
}
