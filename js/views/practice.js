/* 练习中心：六大专项入口 + 按题型分类练习 + 进度概览 */
import * as store from '../store.js';
import { ui } from '../ui.js';
import { esc, pct } from '../utils.js';
import { ARTICLES } from '../../data/reading.js';
import { CLOZE_PASSAGES } from '../../data/cloze.js';
import { TRANSLATION_TASKS } from '../../data/translation.js';
import { WRITING_TOPICS, WRITING_MATERIALS, WRITING_FORMATS, WRITING_SAMPLES } from '../../data/writing.js';
import { COURSES } from '../../data/courses.js';
import { EXAM_PAPERS, EXAM_QUESTIONS } from '../../data/exams.js';

const MODULES = [
  { id:'reading', name:'阅读理解', icon:'book', desc:'完整文章 · 段落编号 · 长难句 · 逐题解析', count:() => ARTICLES.length, unit:'篇演示文章',
    feats:['段落编号与生词标注','长难句拆解与结构分析','逐题定位 + 正误选项解析','错题自动归档'] },
  { id:'cloze', name:'完形填空', icon:'list', desc:'逐空选择 · 上下文关联 · 统一评分', count:() => CLOZE_PASSAGES.length, unit:'篇演示文章',
    feats:['逐空选择与答题状态','完成后统一评分','词汇/语法/上下文解析','错题自动记录'] },
  { id:'translation', name:'翻译训练', icon:'pen', desc:'逐句翻译 · 参考对照 · 历史译文', count:() => TRANSLATION_TASKS.length, unit:'个演示段落',
    feats:['逐句输入中文译文','自动保存 + 历史版本','参考译文对照','重点语法与长难句拆解'] },
  { id:'writing', name:'写作训练', icon:'note', desc:'小作文 / 大作文 · 限时 · 草稿 · 自评', count:() => WRITING_TOPICS.length, unit:'道演示题目',
    feats:['应用文格式与图表作文',`素材库 ${WRITING_MATERIALS.length} 条 / 范文拆解`,'限时写作与草稿自动保存','历史作文与人工自评'] },
  { id:'courses', name:'课程学习', icon:'layers', desc:'词汇 / 语法 / 阅读 / 完形 / 翻译 / 写作', count:() => COURSES.length, unit:'课演示课程',
    feats:['知识点 + 重点难点','典型例句与详细解析','学习笔记与标记完成','加入复习计划'] },
  { id:'exam', name:'真题与模拟考', icon:'clock', desc:'计时 · 题号导航 · 自动评分 · 考试报告', count:() => EXAM_PAPERS.length, unit:'套演示模拟卷',
    feats:['完整试卷模拟与考试计时','暂存答案 / 主动与自动交卷','客观题自动评分','错题归档与历史成绩'] }
];

const TYPES = [
  { id:'cloze', name:'完形专项', icon:'list' },
  { id:'reading', name:'阅读专项', icon:'book' },
  { id:'translation', name:'翻译专项', icon:'pen' },
  { id:'writing', name:'写作专项', icon:'note' },
  { id:'vocab', name:'词汇专项', icon:'card' },
  { id:'all', name:'综合小测', icon:'target' }
];

export function render(ctx) {
  const s = store.get();
  const done = {
    reading:s.readingAttempts.length, cloze:s.clozeAttempts.length,
    translation:s.translations.length, writing:s.essays.length,
    courses:Object.values(s.courses).filter(c => c.done).length, exam:s.examResults.length
  };
  const allQ = Object.values(EXAM_QUESTIONS).flat();

  return `
  ${ui.contentNotice({ contentLabel:'ai', labelText:'演示内容', disclaimer:'所有文章、题目、课程与试卷均为演示/AI 生成示例，不含历年真题与官方答案。' })}

  ${ui.sectionHead('六大专项')}
  <div class="grid grid-md-2 section">
    ${MODULES.map(m => `<div class="card card-pad">
      <a class="flex gap-3" href="#/${m.id}">
        <span class="li-ico">${ui.icon(m.icon, 20)}</span>
        <span class="flex-1"><span class="t-md t-bold">${esc(m.name)}</span>
          <span class="t-sm t-muted" style="display:block;margin-top:2px">${esc(m.desc)}</span></span>
        ${ui.icon('arrow', 18)}
      </a>
      <div class="chips mt-3">
        <span class="chip chip-brand">${m.count()} ${esc(m.unit)}</span>
        <span class="chip ${done[m.id] ? 'chip-success' : ''}">已完成 ${done[m.id]} 次</span>
      </div>
      <div class="t-sm t-ink2 mt-3" style="line-height:1.9">
        ${m.feats.map(f => `<div>· ${esc(f)}</div>`).join('')}
      </div>
      <a class="btn btn-soft btn-block btn-sm mt-3" href="#/${m.id}">进入${esc(m.name)}</a>
    </div>`).join('')}
  </div>

  ${ui.sectionHead('按题型分类练习', '', `题库共 ${allQ.length} 道演示题`)}
  <div class="card card-pad section">
    <div class="t-sm t-muted mb-3">从两套演示模拟卷中按题型抽题，生成限时小测（客观题自动评分）。</div>
    <div class="quick-grid">
      ${TYPES.map(t => `<a class="quick" href="#/exam?mode=type&type=${encodeURIComponent(t.id)}">
        <span class="qi">${ui.icon(t.icon, 20)}</span><span>${esc(t.name)}</span></a>`).join('')}
    </div>
    <div class="t-xs t-muted mt-3">按年份/套卷查看请到 <a href="#/exam">真题与模拟考</a>；内置试卷为演示分组，不代表真实考试年份。</div>
  </div>

  ${ui.sectionHead('学习闭环')}
  <div class="card card-pad">
    <div class="t-sm t-ink2" style="line-height:2">
      <div><span class="step-num">1</span>在「课程」学方法，在「单词」按间隔复习推进新词</div>
      <div><span class="step-num">2</span>在「阅读 / 完形 / 翻译 / 写作」做专项练习，答错自动进错题本</div>
      <div><span class="step-num">3</span>用「模拟考」检验，考试报告只统计客观题，主观题保留答卷自评</div>
      <div><span class="step-num">4</span>回「错题本」重练并标记掌握，在「统计」查看薄弱模块</div>
    </div>
  </div>`;
}
