/* 数据与设置：导出/恢复、批量导入、发音、学习目标、PWA 说明、内容声明 */
import * as store from '../store.js';
import * as words from '../words.js';
import * as speech from '../speech.js';
import { ui } from '../ui.js';
import { esc, attr, fmtDate, parseWordLines, readFileText, downloadFile } from '../utils.js';
import { CORE_META } from '../../data/words.core.js';

const TEMPLATE = {
  _说明:'批量导入模板。words / articles 两个字段当前版本会真实生效；courses / examPapers 为后续扩展预留的数据结构示例。',
  _标注:'导入的内容归用户所有，界面会标记为「用户导入」；请勿导入无使用权的材料。',
  words:[
    { word:'abandon', phonetic:'/əˈbændən/', pos:'v.', meaning:'放弃；抛弃',
      example:'The board decided to abandon the plan.', exampleZh:'董事会决定放弃该计划。',
      collocations:['abandon oneself to 沉溺于'], rare:'n. 放纵（with abandon）', tier:'high', tags:['阅读'] },
    { word:'sustain', phonetic:'/səˈsteɪn/', pos:'v.', meaning:'维持；支撑',
      example:'It is hard to sustain such growth.', exampleZh:'很难维持这样的增长。',
      collocations:['sustain growth 维持增长'], rare:'', tier:'high', tags:[] }
  ],
  articles:[
    { id:'my-r1', title:'自定义阅读文章标题', topic:'自定义', level:'用户导入', minutes:10,
      paragraphs:[{ no:1, text:'Paste your own English paragraph here.' }],
      gloss:[{ word:'paragraph', phonetic:'/ˈpærəɡrɑːf/', meaning:'n. 段落', para:1 }],
      sentences:[{ para:1, text:'Paste your own English paragraph here.', split:'主干：…', note:'…' }],
      structure:{ thesis:'一句话主旨', outline:['第1段：…'], tone:'…' },
      questions:[{ id:'my-r1q1', type:'single', tag:'细节题', stem:'What is this paragraph about?',
        options:['A proper option','Another option','Third option','Fourth option'] }],
      answerKeys:{ 'my-r1q1':{ answer:0, location:'第 1 段', knowledge:'细节定位',
        correct:'正确选项理由', wrong:['A…','C…','D…'] } } }
  ],
  courses:[{ _示例:'课程导入字段预留', id:'my-co1', cat:'reading', title:'自定义课程', points:[] }],
  examPapers:[{ _示例:'试卷导入字段预留', id:'my-e1', name:'自定义试卷', year:'用户导入', sections:[] }]
};

function sizeKB() { return (JSON.stringify(store.get()).length / 1024).toFixed(1); }

export function render(ctx) {
  const s = store.get();
  const speechSt = speech.status();
  const voices = speech.voiceOptions();
  const imported = s.customArticles.length;
  return `${ui.sectionHead('数据与设置')}

  <div class="card card-pad mb-3">
    <div class="t-md t-bold mb-2">本地数据状态</div>
    <div class="kv"><span class="k">存储方式</span><span class="v">浏览器 localStorage（仅本机）</span></div>
    <div class="kv"><span class="k">持久化状态</span><span class="v ${store.isPersistenceOK() ? 't-success' : 't-danger'}">${store.isPersistenceOK() ? '正常 · 刷新/关闭不丢失' : '不可用 · 请立即导出备份'}</span></div>
    <div class="kv"><span class="k">数据体积</span><span class="v">${sizeKB()} KB</span></div>
    <div class="kv"><span class="k">最后更新</span><span class="v">${esc(fmtDate(s.updatedAt))}</span></div>
    <div class="kv"><span class="k">Schema 版本</span><span class="v">v${s.version}</span></div>
    <div class="t-xs t-muted mt-2">本站不需要账号、云端数据库与跨设备同步；清除浏览器数据会一并清除学习记录，请定期导出备份。</div>
  </div>

  ${ui.sectionHead('备份与恢复')}
  <div class="card card-pad mb-3">
    <div class="switch-row"><div class="sr-main"><div class="sr-title">导出 JSON 备份</div>
      <div class="sr-desc">包含单词掌握记录、收藏、笔记、错题、译文、作文、考试成绩与设置。</div></div>
      <button class="btn btn-primary btn-sm" data-action="export">导出</button></div>
    <div class="switch-row"><div class="sr-main"><div class="sr-title">从备份恢复</div>
      <div class="sr-desc">选择此前导出的 .json 文件。覆盖=用备份替换当前数据；合并=保留双方记录并按 id 去重。</div></div></div>
    <div class="form-row mt-2">
      <select class="select" id="restore-mode"><option value="replace">覆盖当前数据</option><option value="merge">与当前数据合并</option></select>
      <label class="btn btn-outline" style="display:flex;align-items:center;justify-content:center">选择备份文件
        <input type="file" id="backup-file" data-change="backup-file" accept=".json,application/json" style="display:none"></label>
    </div>
    <div class="switch-row"><div class="sr-main"><div class="sr-title">重置全部学习数据</div>
      <div class="sr-desc">清空所有进度与记录，不可撤销。</div></div>
      <button class="btn btn-danger btn-sm" data-action="reset">重置</button></div>
  </div>

  ${ui.sectionHead('批量导入内容')}
  <div class="card card-pad mb-3">
    <div class="notice">${ui.icon('info',16)}<div>支持导入你自己拥有使用权的词汇表与阅读文章。导入内容会在界面标记为「用户导入」，不会伪装成官方数据。</div></div>
    <div class="t-sm t-bold mb-2">① 词汇表（立即生效）</div>
    <div class="t-xs t-muted mb-2">格式 A：每行 <span class="mono">单词,音标,词性,中文释义</span>；格式 B：JSON 数组（字段见下方模板）。同名会覆盖内置演示词条。</div>
    <textarea class="textarea" id="import-words-text" placeholder="abandon,/əˈbændən/,v.,放弃；抛弃&#10;sustain,/səˈsteɪn/,v.,维持；支撑"></textarea>
    <div class="btn-row mt-2">
      <button class="btn btn-sm btn-primary" data-action="import-words">导入到词库</button>
      <label class="btn btn-sm btn-outline" style="display:flex;align-items:center">选择 .txt/.json 文件
        <input type="file" id="words-file" data-change="words-file" accept=".txt,.json,.csv,text/plain" style="display:none"></label>
      <button class="btn btn-sm btn-ghost" data-action="download-template">下载模板</button>
    </div>
    <div class="divider"></div>
    <div class="t-sm t-bold mb-2">② 阅读文章 + 题目 + 答案解析（立即生效）</div>
    <div class="t-xs t-muted mb-2">粘贴含 <span class="mono">articles</span> 数组的 JSON（结构见模板），导入后会出现在「阅读理解」列表并可逐题练习。课程与试卷的导入字段已在模板中预留，供后续扩展。</div>
    <textarea class="textarea" id="import-articles-text" placeholder='{"articles":[{"id":"my-r1","title":"...","paragraphs":[...],"questions":[...],"answerKeys":{...}}]}'></textarea>
    <div class="btn-row mt-2">
      <button class="btn btn-sm btn-primary" data-action="import-articles">导入文章</button>
      <span class="t-xs t-muted" style="align-self:center">已导入自定义文章：${imported} 篇</span>
    </div>
    <div class="t-xs t-muted mt-3">说明：本站内置的课程、文章、题目与试卷以静态数据与代码分离存储（data/ 目录），新增内容无需改动界面代码；导入通道与数据结构均已预留。</div>
  </div>

  ${ui.sectionHead('发音设置')}
  <div class="card card-pad mb-3">
    <div class="notice ${speechSt.ok ? '' : 'warn'}">${ui.icon('sound',16)}<div>${esc(speechSt.text)}。发音使用浏览器/系统内置语音，免费、无需联网、无第三方密钥。</div></div>
    <label class="field"><span class="field-label">语速</span>
      <select class="select" data-change="setting" data-key="speechRate">
        ${[['0.7','慢速 0.7'],['0.85','偏慢 0.85'],['0.9','标准 0.9'],['1','较快 1.0'],['1.15','快速 1.15']].map(([v, t]) =>
          `<option value="${v}" ${Number(s.settings.speechRate) === Number(v) ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
    <label class="field"><span class="field-label">英语语音</span>
      <select class="select" data-change="setting" data-key="speechVoiceURI">
        <option value="">自动选择（推荐）</option>
        ${voices.map(v => `<option value="${attr(v.uri)}" ${s.settings.speechVoiceURI === v.uri ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}</select></label>
    <button class="btn btn-soft btn-sm" data-action="speech-test">${ui.icon('sound', 16)} 测试朗读</button>
    <div class="t-xs t-muted mt-2">iOS 需在用户点击后才会发声；若无声，请检查设备静音开关或换用 Safari / Chrome。</div>
  </div>

  ${ui.sectionHead('每日学习目标')}
  <div class="card card-pad mb-3">
    <div class="form-row">
      <label class="field"><span class="field-label">每日新学单词</span>
        <input class="input" type="number" min="1" max="200" value="${s.settings.dailyWordGoal}" data-change="setting" data-key="dailyWordGoal"></label>
      <label class="field"><span class="field-label">每日复习单词</span>
        <input class="input" type="number" min="1" max="300" value="${s.settings.dailyReviewGoal}" data-change="setting" data-key="dailyReviewGoal"></label>
    </div>
    <div class="t-xs t-muted">修改后立即生效并保存；目标用于首页进度与今日任务。</div>
  </div>

  ${ui.sectionHead('安装到手机主屏幕（PWA）')}
  <div class="card card-pad mb-3">
    <div class="t-sm t-ink2" style="line-height:2">
      <div><b>iPhone（Safari）</b>：打开本站 → 点底部分享按钮 → 选择「添加到主屏幕」。</div>
      <div><b>Android（Chrome）</b>：打开本站 → 右上角菜单 → 选择「安装应用 / 添加到主屏幕」。</div>
      <div><b>手机与电脑同一 Wi-Fi</b>：电脑启动服务后，用启动窗口显示的「手机访问」地址在手机浏览器打开即可。</div>
      <div>安装后可全屏使用；Service Worker 会缓存应用外壳，断网时仍可打开已加载过的页面与本地数据。</div>
    </div>
    <div class="t-xs t-muted mt-2">PWA 需要 http(s) 或 localhost；直接双击 index.html（file://）可浏览部分页面，但无法注册离线能力。</div>
  </div>

  ${ui.sectionHead('内容与合规声明')}
  <div class="card card-pad mb-3">
    <div class="t-sm t-ink2" style="line-height:1.95">
      <div>· 本站<b>不含任何历年考研英语二真题、官方答案或权威词汇数据</b>。</div>
      <div>· 内置文章、题目、选项、解析、课程讲解、范文与模拟卷均为 <b>AI 生成 / 演示示例</b>，界面已逐处标注，仅用于验证功能。</div>
      <div>· 核心演示词库 ${CORE_META.count} 条为 AI 编写的通用英语知识示例，非大纲词表；请勿作为备考依据。</div>
      <div>· 词形清单来自你提供的《英语二2010-2021全部词汇.docx》自动抽取，<b>仅含词形与年份</b>，无音标与释义，且可能含 OCR 噪声，已标注「用户资料·自动抽取」。</div>
      <div>· 所有学习数据只保存在本机浏览器，不上传、不共享。</div>
    </div>
    <div class="t-xs t-muted mt-3">本方案为个人学习工具参考，具体备考材料请以你拥有使用权的正式出版物为准。</div>
  </div>`;
}

export const actions = {
  export: (el, ctx) => {
    try { downloadFile(store.exportFilename(), store.exportBundle()); ui.toast('备份文件已下载', 'ok'); }
    catch (e) { ui.toast('导出失败：' + e.message, 'err'); }
  },
  reset: (el, ctx) => {
    ui.confirmSheet({ title:'重置全部学习数据？',
      desc:'<b class="t-danger">此操作会清空所有单词进度、错题、笔记、译文、作文与考试成绩，且不可撤销。</b><br><br>建议先点「导出」保存备份。',
      okText:'确认重置', danger:true, onOk:() => { store.resetAll(); words.invalidate(); ui.toast('已重置', 'ok'); location.reload(); } });
  },
  'import-words': (el, ctx) => {
    const text = document.getElementById('import-words-text')?.value || '';
    const arr = parseWordLines(text);
    if (!arr.length) return ui.toast('未解析到词条，请检查格式', 'err');
    let n = 0;
    arr.forEach(x => { if (words.upsertCustomWord(x)) n++; });
    ui.toast(`已导入 ${n} 个词条（同名覆盖）`, 'ok');
    ctx.refresh();
  },
  'download-template': (el, ctx) => {
    downloadFile('英语二-批量导入模板.json', JSON.stringify(TEMPLATE, null, 2));
    ui.toast('模板已下载', 'ok');
  },
  'import-articles': (el, ctx) => {
    const text = document.getElementById('import-articles-text')?.value || '';
    let obj;
    try { obj = JSON.parse(text); } catch { return ui.toast('不是合法 JSON', 'err'); }
    const arr = Array.isArray(obj) ? obj : (obj.articles || []);
    if (!arr.length) return ui.toast('未找到 articles 数组', 'err');
    const valid = arr.filter(a => a && a.id && a.title && Array.isArray(a.paragraphs) && a.paragraphs.length);
    if (!valid.length) return ui.toast('文章缺少 id / title / paragraphs 字段', 'err');
    store.update(s => {
      valid.forEach(a => {
        const idx = s.customArticles.findIndex(x => x.id === a.id);
        const item = { ...a, label:'user', importedAt:new Date().toISOString() };
        if (idx >= 0) s.customArticles[idx] = item; else s.customArticles.unshift(item);
      });
    });
    ui.toast(`已导入 ${valid.length} 篇文章，去阅读理解查看`, 'ok');
    ctx.refresh();
  },
  'speech-test': (el, ctx) => {
    const r = speech.speak('This is a pronunciation test. The schedule accommodates part-time students.');
    if (!r.ok) ui.toast(r.reason, 'err');
  }
};

export function onChange(el, ctx) {
  if (el.dataset.change === 'setting') {
    const key = el.dataset.key;
    let v = el.value;
    if (['dailyWordGoal', 'dailyReviewGoal'].includes(key)) v = Math.max(1, Math.min(300, parseInt(v, 10) || 20));
    if (key === 'speechRate') v = Number(v);
    store.update(s => { s.settings[key] = v; });
    ui.toast('设置已保存', 'ok');
    return;
  }
  if (el.dataset.change === 'backup-file') {
    const file = el.files && el.files[0];
    if (!file) return;
    const mode = document.getElementById('restore-mode')?.value || 'replace';
    readFileText(file).then(text => {
      const parsed = store.parseBundle(text);
      if (!parsed.ok) return ui.toast(parsed.error, 'err');
      const count = (parsed.state.mistakes || []).length + (parsed.state.essays || []).length;
      ui.confirmSheet({ title:'确认恢复备份',
        desc:`备份时间：${parsed.exportedAt ? esc(fmtDate(parsed.exportedAt)) : '未提供'}；包含约 ${count} 条错题/作文记录。<br>模式：<b>${mode === 'replace' ? '覆盖当前数据' : '与当前数据合并'}</b>。恢复后页面会重新加载。`,
        okText:'确认恢复', onOk:() => {
          const r = store.restore(text, mode);
          if (!r.ok) return ui.toast(r.error, 'err');
          ui.toast('恢复成功，正在重新加载…', 'ok');
          setTimeout(() => location.reload(), 500);
        } });
    }).catch(e => ui.toast('读取文件失败：' + e.message, 'err'));
    el.value = '';
    return;
  }
  if (el.dataset.change === 'words-file') {
    const file = el.files && el.files[0];
    if (!file) return;
    readFileText(file).then(text => {
      const ta = document.getElementById('import-words-text');
      if (ta) ta.value = text;
      ui.toast('文件已载入，点「导入到词库」生效', 'ok');
    }).catch(e => ui.toast('读取失败：' + e.message, 'err'));
    el.value = '';
  }
}
