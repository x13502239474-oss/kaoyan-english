/* 学习统计：全部数值由本地真实记录派生，无数据时明确标注「暂无数据」 */
import * as store from '../store.js';
import * as words from '../words.js';
import * as srs from '../srs.js';
import { ui } from '../ui.js';
import { esc, pct, clamp, fmtShort } from '../utils.js';
import { COURSES } from '../../data/courses.js';

function rate(arr) {
  const s = arr.reduce((n, a) => n + (Number(a.score) || 0), 0);
  const t = arr.reduce((n, a) => n + (Number(a.total) || 0), 0);
  return { s, t, n: arr.length, p: t > 0 ? pct(s, t) : null };
}
function barChart(items, alt = false) {
  const max = Math.max(1, ...items.map(x => x.value));
  return `<div class="bar-chart">${items.map((x, i) => `
    <div class="bar-col"><span class="val">${x.value}</span>
      <div class="bar ${alt && i % 2 ? 'alt' : ''}" style="height:${Math.round((x.value / max) * 100)}%"></div>
      <span class="lbl">${esc(x.label)}</span></div>`).join('')}</div>`;
}
function ring(percent, label) {
  const p = clamp(percent, 0, 100);
  return `<div class="ring" style="background:conic-gradient(var(--brand) ${p}%, var(--surface-3) 0)">
    <div class="ring-txt">${p}%<span class="ring-sub">${esc(label)}</span></div></div>`;
}

export function render(ctx) {
  const s = store.get();
  const snap = store.snapshot();
  const all = words.allWords();
  const due = srs.dueQueue(all);
  const reading = rate(s.readingAttempts);
  const cloze = rate(s.clozeAttempts);
  const examObj = rate(s.examResults.map(x => ({ score:x.objectiveScore || 0, total:x.objectiveTotal || 0 })));
  const wordTest = rate(s.wordTests);
  const forecast = srs.forecast(all, 7);
  const dist = srs.levelDistribution();

  const masteredRate = snap.started ? pct(snap.mastered, snap.started) : 0;
  const todayReviewRate = clamp(pct(snap.daily.reviews || 0, (snap.daily.reviews || 0) + due.length), 0, 100);

  const modules = [
    { name:'阅读理解', r:reading, hint:'回原文核对定位与同义替换' },
    { name:'完形填空', r:cloze, hint:'先判断前后分句方向再选词' },
    { name:'考试客观题', r:examObj, hint:'用题号导航检查未答题' },
    { name:'单词测试', r:wordTest, hint:'优先清理逾期词与低熟练度词' }
  ];
  const weak = modules.filter(m => m.r.p !== null && m.r.t >= 2).sort((a, b) => a.r.p - b.r.p).slice(0, 2);
  const noData = modules.every(m => m.r.p === null);

  const weekLabels = ['今天','+1天','+2天','+3天','+4天','+5天','+6天'];

  return `
  ${ui.sectionHead('学习统计', `<a class="more" href="#/settings">数据管理 ›</a>`)}
  <div class="stat-grid section">
    ${ui.statCard(snap.started, '单词累计学习量', `词库共 ${all.length} 词`)}
    ${ui.statCard(snap.mastered, '已标记掌握', `掌握率 ${masteredRate}%`)}
    ${ui.statCard(snap.reviewsDone, '单词累计复习次数', `今日 ${snap.daily.reviews || 0} 次`)}
    ${ui.statCard(snap.coursesDone + '/' + COURSES.length, '已完成课程', `复习计划 ${Object.values(s.courses).filter(c => c.inReview).length} 课`)}
  </div>

  <section class="section">
    ${ui.sectionHead('单词复习情况')}
    <div class="card card-pad flex gap-4 wrap">
      ${ring(todayReviewRate, '今日复习完成率')}
      <div class="flex-1" style="min-width:180px">
        <div class="kv"><span class="k">今日已复习</span><span class="v">${snap.daily.reviews || 0} 次</span></div>
        <div class="kv"><span class="k">当前到期</span><span class="v">${due.length} 词</span></div>
        <div class="kv"><span class="k">逾期最久</span><span class="v">${due.length ? Math.floor(due[0].overdueDays) + ' 天' : '—'}</span></div>
        <div class="kv"><span class="k">收藏生词</span><span class="v">${snap.favorites} 词</span></div>
      </div>
    </div>
  </section>

  <section class="section">
    ${ui.sectionHead('未来 7 天复习量预测', '', '按当前到期时间推算')}
    <div class="card card-pad">
      ${barChart(forecast.map((f, i) => ({ label:weekLabels[i], value:f.count })))}
      <div class="t-xs t-muted mt-3">「今天」包含所有已逾期词；预测随每次评分实时更新。</div>
    </div>
  </section>

  <section class="section">
    ${ui.sectionHead('单词掌握度分布')}
    <div class="card card-pad">
      ${dist.map((n, i) => `<div class="level-bar">
        <span class="lb-name">${esc(srs.LEVEL_NAMES[i])}</span>
        <span class="lb-track"><i style="width:${Math.max(0, Math.min(100, pct(n, Math.max(1, snap.started))))}%"></i></span>
        <span class="lb-num">${n}</span></div>`).join('')}
      <div class="t-xs t-muted mt-2">未接触的词不计入分布；每次评分会调整熟练度等级与下次复习时间。</div>
    </div>
  </section>

  <section class="section">
    ${ui.sectionHead('各模块正确率')}
    <div class="card card-pad">
      ${modules.map(m => `<div class="kv">
        <span class="k">${esc(m.name)} <span class="t-xs t-muted">(${m.r.n} 次练习)</span></span>
        <span class="v">${m.r.p === null ? '<span class="t-muted">暂无数据</span>' : m.r.p + '%'}</span></div>`).join('')}
      <div class="divider"></div>
      <div class="flex between"><span class="t-sm t-muted">翻译训练次数</span><b>${s.translations.length}</b></div>
      <div class="flex between mt-2"><span class="t-sm t-muted">写作练习次数</span><b>${s.essays.length}</b></div>
      <div class="flex between mt-2"><span class="t-sm t-muted">模拟考试次数</span><b>${s.examResults.length}</b></div>
    </div>
  </section>

  <section class="section">
    ${ui.sectionHead('薄弱模块分析')}
    <div class="card card-pad">
      ${noData
        ? `<div class="t-sm t-muted">暂无足够数据。完成至少一次阅读、完形、单词测试或模拟考后，这里会基于真实正确率给出薄弱项。</div>`
        : weak.length
          ? weak.map((m, i) => `<div class="mb-3">
              <div class="flex between"><b>${i + 1}. ${esc(m.name)}</b><span class="chip chip-warn">${m.r.p}% · ${m.r.s}/${m.r.t}</span></div>
              <div class="t-sm t-ink2 mt-1">建议：${esc(m.hint)}。可从 <a href="#/review">错题本</a> 重练该模块的错题。</div>
            </div>`).join('')
          : `<div class="t-sm t-muted">已有练习但样本量较少（单模块需至少 2 题），继续练习后给出排序。</div>`}
      <div class="t-xs t-muted mt-2">分析仅基于本机记录的作答结果，不构成任何水平评估或预测。</div>
    </div>
  </section>

  <section class="section">
    ${ui.sectionHead('模拟考试成绩记录', `<a class="more" href="#/exam">去考试 ›</a>`)}
    <div class="card card-pad">
      ${s.examResults.length ? s.examResults.slice(0, 8).map(r => `<div class="kv">
        <span class="k">${esc(r.paperName || r.paperId)} <span class="t-xs t-muted">${esc(fmtShort(r.at))}</span></span>
        <span class="v">客观题 ${r.objectiveScore || 0}/${r.objectiveTotal || 0} 分 ${r.auto ? '<span class="chip chip-warn">自动交卷</span>' : ''}</span></div>`).join('')
        : `<div class="t-sm t-muted t-center" style="padding:14px 0">暂无考试记录。</div>`}
      <div class="t-xs t-muted mt-3">主观题（翻译/写作）不自动判分，答卷保存在考试报告与写作/翻译记录中，需人工自评。</div>
    </div>
  </section>`;
}
