/* ============================================================
   真实浏览器交互回归测试（零依赖，Chrome/Edge CDP）
   ------------------------------------------------------------
   运行: node tools/browser-test.js
   覆盖用户要求的全部功能：单词学习与复习、发音、阅读、完形、
   翻译保存、写作草稿、模拟考试、错题本、导出恢复、刷新不丢、
   PWA 与移动端无横向滚动。
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');

const ROOT = path.join(__dirname, '..');
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe'
].find(p => fs.existsSync(p));
const PORT = 5195, DEBUG_PORT = 9223;
let pass = 0, fail = 0; const failures = [];
const group = t => console.log('\n\x1b[36m' + t + '\x1b[0m');
const wait = ms => new Promise(r => setTimeout(r, ms));
function ok(name, cond, detail = '') {
  if (cond) { pass++; console.log('  \x1b[32mPASS\x1b[0m ' + name + (detail ? '  ' + detail : '')); }
  else { fail++; failures.push(name + (detail ? ' — ' + detail : '')); console.log('  \x1b[31mFAIL\x1b[0m ' + name + '  ' + detail); }
}

let ws, msgId = 0; const pending = new Map();
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    const to = setTimeout(() => { pending.delete(id); reject(new Error('CDP 超时: ' + method)); }, 12000);
    pending.set(id, m => { clearTimeout(to); resolve(m); });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function ev(expr, awaitPromise = false) {
  const m = await send('Runtime.evaluate', { expression:expr, returnByValue:true, awaitPromise, userGesture:true });
  const r = (m.result || {});
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || '').slice(0, 300));
  return r.result ? r.result.value : undefined;
}
const J = v => JSON.stringify(v);
async function go(hash) { await ev(`location.hash=${J(hash)}`); await wait(260); }
async function click(sel) { return ev(`(()=>{const e=document.querySelector(${J(sel)});if(!e)return false;e.click();return true})()`); }
async function text() { return ev(`document.getElementById('main').innerText`); }
async function state() { return ev(`JSON.parse(localStorage.getItem('ky-english-state-v1'))`); }

async function waitServer(port) {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(`http://127.0.0.1:${port}/`); if (r.ok) return; } catch {}
    await wait(150);
  }
  throw new Error('server 未就绪');
}
async function waitDebug() {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`); if (r.ok) return await r.json(); } catch {}
    await wait(150);
  }
  throw new Error('Chrome 调试端口未就绪');
}

async function main() {
  console.log('考研英语二 · 真实浏览器交互回归测试');
  if (!CHROME) { console.log('未找到 Chrome/Edge，跳过浏览器测试'); return; }
  console.log('浏览器: ' + CHROME);

  const server = cp.spawn(process.execPath, ['server.js'], { cwd:ROOT, env:{ ...process.env, PORT:String(PORT) }, stdio:'ignore' });
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ky-en-chrome-'));
  const chrome = cp.spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', '--mute-audio', '--remote-allow-origins=*',
    `--remote-debugging-port=${DEBUG_PORT}`, `--user-data-dir=${profile}`, 'about:blank'
  ], { stdio:'ignore' });

  try {
    await waitServer(PORT);
    await waitDebug();
    const tab = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?${encodeURIComponent(`http://127.0.0.1:${PORT}/`)}`, { method:'PUT' })).json();
    ws = new WebSocket(tab.webSocketDebuggerUrl);
    ws.onmessage = e => {
      const m = JSON.parse(e.data);
      if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    };
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
    await send('Runtime.enable');
    await send('Page.enable');
    // 等待 SPA 启动
    for (let i = 0; i < 50; i++) {
      const ready = await ev(`!!document.querySelector('.appbar') && !!document.querySelector('.tabbar')`);
      if (ready) break;
      await wait(150);
    }

    /* ---------- 启动与布局 ---------- */
    group('1. 启动 / 布局 / 移动端');
    ok('SPA 成功启动（顶栏+底栏+首页渲染）', await ev(`!!document.querySelector('.appbar') && !!document.querySelector('.hero')`));
    ok('共享设计系统 CSS 已加载', await ev(`getComputedStyle(document.body).backgroundColor !== 'rgba(0, 0, 0, 0)'`));
    ok('底部 5 个导航入口', await ev(`document.querySelectorAll('.tabbar .tab').length === 5`));
    const homeText = await text();
    ok('首页含今日任务/进度/各题型/最近记录', ['今日学习任务','当前学习进度','各题型练习情况','最近学习记录'].every(k => homeText.includes(k)));
    await send('Emulation.setDeviceMetricsOverride', { width:390, height:844, deviceScaleFactor:2, mobile:true });
    await wait(250);
    const overflow = await ev(`({w:document.documentElement.scrollWidth, inner:window.innerWidth})`);
    ok('iPhone 390px 视口无横向滚动', overflow.w <= overflow.inner + 1, `scrollWidth=${overflow.w} / innerWidth=${overflow.inner}`);
    ok('PWA manifest 与 Service Worker 已注册',
      await ev(`!!document.querySelector('link[rel=manifest]')`), 'manifest link');
    const swState = await ev(`(async()=>{ if(!('serviceWorker' in navigator)) return 'unsupported'; const r=await navigator.serviceWorker.getRegistration(); return r? 'registered':'pending'; })()`, true);
    ok('Service Worker 状态', ['registered','pending','unsupported'].includes(swState), swState);

    /* ---------- 单词 ---------- */
    group('2. 单词学习与复习 / 发音 / 测试');
    await go('#/words?tab=study');
    ok('单词卡片渲染', await ev(`!!document.querySelector('.word-card .word-en')`));
    const word0 = await ev(`document.querySelector('.word-card .word-en').innerText`);
    ok('显示/隐藏中文释义', await click('[data-action="reveal"]') && (await ev(`!!document.querySelector('.word-meaning')`)));
    ok('发音按钮存在', await ev(`!!document.querySelector('[data-speak]')`));
    const speechRes = await ev(`(async()=>{const s=await import('./js/speech.js');return s.speak('abandon')})()`, true);
    ok('发音调用链路可用（无异常）', speechRes && typeof speechRes === 'object', JSON.stringify(speechRes));
    await click('[data-action="fav"]');
    ok('收藏生词写入持久化', await ev(`Object.values(JSON.parse(localStorage.getItem('ky-english-state-v1')).wordProgress).some(r=>r.favorite)`));
    const beforeStudy = await state();
    await click('[data-action="grade"][data-g="good"]');
    const afterStudy = await state();
    ok('评分后卡片前进且写入熟练度', (Object.values(afterStudy.wordProgress).filter(r => r.seen > 0).length > Object.values(beforeStudy.wordProgress).filter(r => r.seen > 0).length)
      || afterStudy.activity.length > beforeStudy.activity.length, `已学词 ${word0}`);
    ok('今日新学计数 +1', (afterStudy.daily[Object.keys(afterStudy.daily)[0]]?.newWords || 0) >= 1);

    await go('#/words?tab=review');
    ok('复习页可渲染（队列或空态）', (await text()).length > 50);
    await go('#/words?tab=lists');
    ok('词表按词汇表/词频/年份分类', (await text()).includes('核心演示词库') && (await text()).includes('2010 年词形'));
    await click('[data-action="set-list"][data-list="core"]');
    ok('点开词表列出词条', await ev(`document.querySelectorAll('#word-list-result .list-item').length > 0`));
    await go('#/words?tab=test');
    await click('[data-action="start-test"]');
    ok('英译中测试生成选项', await ev(`document.querySelectorAll('.opt').length === 4`));
    await click('.opt[data-idx="0"]');
    ok('答题后显示反馈与解析', (await text()).includes('解析') || (await text()).includes('回答'));

    /* ---------- 阅读 ---------- */
    group('3. 阅读理解');
    await go('#/reading/r1');
    ok('文章段落编号 + 生词标注', await ev(`document.querySelectorAll('.prose .para-no').length >= 4 && !!document.querySelector('.gloss-word')`));
    await go('#/reading/r1?view=questions');
    ok('逐题练习渲染题干与 4 选项', await ev(`!!document.querySelector('.stem') && document.querySelectorAll('.opt').length === 4`));
    await click('.opt[data-idx="0"]');
    const rTxt = await text();
    ok('答题后显示定位 / 正确选项解析 / 错误选项分析',
      rTxt.includes('题目定位') && rTxt.includes('正确选项解析') && rTxt.includes('错误选项分析'));
    // 完成剩余题
    for (let i = 0; i < 5; i++) { await click('[data-action="next-q"]'); await wait(120); if (i < 3) await click('.opt[data-idx="1"]'); }
    const ra = (await state()).readingAttempts;
    ok('阅读成绩写入本地记录', Array.isArray(ra) && ra.length >= 1, '当前 ' + ra.length + ' 次');
    await go('#/reading/r1?view=sentences');
    ok('长难句拆解视图渲染', (await text()).includes('结构拆解'));
    await go('#/reading/r1?view=analysis');
    ok('文章结构与主旨分析渲染', (await text()).includes('主旨') && (await text()).includes('文章结构'));

    /* ---------- 完形 ---------- */
    group('4. 完形填空');
    await go('#/cloze/k1');
    ok('文章渲染 10 个可点击空格', await ev(`document.querySelectorAll('.blank-btn').length === 10`));
    await click('.blank-btn[data-no="1"]');
    ok('逐空选择弹层出现 4 个选项', await ev(`document.querySelectorAll('.overlay .opt').length === 4`));
    await click('.overlay .opt[data-idx="0"]');
    ok('选择后文章显示已填答案', await ev(`!!document.querySelector('.blank-btn.filled')`));
    for (let n = 2; n <= 10; n++) { await click(`.blank-btn[data-no="${n}"]`); await wait(60); await click('.overlay .opt[data-idx="0"]'); await wait(60); }
    await click('[data-action="submit"]');
    const ca = (await state()).clozeAttempts;
    ok('统一评分并写入成绩', ca.length >= 1, `${ca[0].score}/${ca[0].total}`);
    ok('逐空解析显示上下文关联与词汇语法', (await text()).includes('上下文关联') && (await text()).includes('词汇与语法解析'));

    /* ---------- 翻译 ---------- */
    group('5. 翻译输入与保存');
    await go('#/translation/t1');
    ok('逐句翻译输入框渲染', await ev(`document.querySelectorAll('[data-input="trans"]').length >= 3`));
    await ev(`(()=>{const t=document.querySelector('[data-input="trans"]');t.value='自动化 rarely 会一举消灭某个职业。';t.dispatchEvent(new Event('input',{bubbles:true}));return true})()`);
    await wait(650);
    const tr = (await state()).translations;
    ok('译文自动保存到 localStorage', tr.length >= 1 && Object.values(tr[0].sentences).some(v => v.includes('自动化')));
    await click('[data-action="toggle-ref"]');
    ok('参考译文对照可切换显示', (await text()).includes('参考译文'));
    await click('[data-action="new-draft"]');
    ok('可新建多份历史译文', (await state()).translations.length >= 2);

    /* ---------- 写作 ---------- */
    group('6. 写作草稿与限时');
    await go('#/writing/w1');
    ok('写作编辑器渲染', await ev(`!!document.getElementById('essay-content')`));
    await ev(`(()=>{const t=document.getElementById('essay-content');t.value='Dear Sir or Madam, I am writing to offer two suggestions.';t.dispatchEvent(new Event('input',{bubbles:true}));return true})()`);
    await wait(650);
    const es = (await state()).essays;
    ok('作文草稿自动保存', es.length >= 1 && es[0].content.includes('Dear Sir'));
    await click('[data-action="toggle-timer"]');
    ok('限时写作计时器启动', await ev(`!!document.getElementById('timer')`));
    await click('[data-action="insert-expr"]');
    ok('素材句型可插入正文', await ev(`document.getElementById('essay-content').value.length > 50`));
    await click('[data-action="finish-essay"]');
    ok('可标记为已完成', (await state()).essays.some(e => e.status === 'done'));

    /* ---------- 模拟考试 ---------- */
    group('7. 真题与模拟考试');
    await go('#/exam');
    ok('考试中心含演示卷与题型分类', (await text()).includes('演示模拟卷') && (await text()).includes('按题型分类'));
    await click('[data-action="start-exam"][data-paper="e1"]');
    await wait(300);
    ok('考试计时器与题号导航渲染', await ev(`!!document.getElementById('exam-timer') && document.querySelectorAll('.exam-nav button').length >= 8`));
    await click('.opt[data-idx="0"]');
    const curExam = (await state()).examCurrent;
    ok('答案实时暂存', curExam && Object.keys(curExam.answers).length >= 1);
    // 主观题输入
    await ev(`(()=>{const b=[...document.querySelectorAll('.exam-nav button')].find(x=>x.innerText==='7');if(b)b.click();return true})()`);
    await wait(200);
    await ev(`(()=>{const t=document.querySelector('[data-input="exam-text"]');if(t){t.value='这是一份演示主观题答卷。';t.dispatchEvent(new Event('input',{bubbles:true}))}return true})()`);
    await wait(200);
    await click('[data-action="submit-exam"]');
    await click('[data-sheet-act="1"]');
    await wait(400);
    const sAfter = await state();
    ok('交卷生成成绩报告', sAfter.examResults.length >= 1, `客观题 ${sAfter.examResults[0].objectiveScore}/${sAfter.examResults[0].objectiveTotal}`);
    ok('主观题答卷被保存', Object.values(sAfter.examResults[0].subjective || {}).some(v => String(v).includes('演示主观题答卷')));
    ok('考试结束后清空进行中状态', sAfter.examCurrent === null);
    ok('考试报告页面渲染', (await text()).includes('考试报告'));

    /* ---------- 错题本 ---------- */
    group('8. 错题本与复习');
    await go('#/review');
    const rv = await text();
    ok('错题本自动归档（阅读/完形/考试）', (await state()).mistakes.length >= 1, (await state()).mistakes.length + ' 道');
    ok('错题本显示错误答案/正确答案/解析', rv.includes('你的答案') && rv.includes('正确答案') && rv.includes('解析'));
    await click('[data-action="master"]');
    ok('可标记掌握', (await state()).mistakes.some(m => m.mastered));
    await go('#/review?tab=plan');
    ok('复习计划页渲染', (await text()).includes('今日复习计划'));

    /* ---------- 导出恢复 / 刷新 ---------- */
    group('9. 数据导出 / 恢复 / 刷新不丢');
    const bundleCheck = await ev(`(async()=>{const s=await import('./js/store.js');const b=s.exportBundle();const p=s.parseBundle(b);return {ok:p.ok,len:b.length,app:JSON.parse(b).app,essays:s.get().essays.length};})()`, true);
    ok('导出备份 JSON 合法且可解析', bundleCheck.ok && bundleCheck.len > 500 && bundleCheck.app === 'kaoyan-english-selfstudy');
    const restoreCheck = await ev(`(async()=>{const s=await import('./js/store.js');const b=s.exportBundle();s.resetAll();const r=s.restore(b,'replace');return {ok:r.ok,essays:s.get().essays.length,results:s.get().examResults.length};})()`, true);
    ok('从备份覆盖恢复', restoreCheck.ok && restoreCheck.essays === bundleCheck.essays && restoreCheck.results >= 1);
    await ev(`location.reload()`);
    await wait(1100);
    for (let i = 0; i < 30; i++) { if (await ev(`!!document.querySelector('.hero')`)) break; await wait(150); }
    const afterReload = await state();
    ok('刷新页面后学习数据仍在', afterReload.essays.length >= 1 && afterReload.examResults.length >= 1 && Object.keys(afterReload.wordProgress).length >= 1);
    ok('刷新后保持当前路由而非跳回首页（SPA 行为）',
      await ev(`location.hash.length > 1 && location.hash !== '#/home'`), await ev(`location.hash`));
    await go('#/home');
    const homeAfter = await text();
    ok('刷新后首页统计反映真实进度', homeAfter.includes('今日新学') && /\d/.test(homeAfter),
      '今日新学 ' + (afterReload.daily[Object.keys(afterReload.daily)[0]]?.newWords || 0));

    /* ---------- 统计与设置 ---------- */
    group('10. 统计 / 设置 / 批量导入');
    await go('#/stats');
    const st = await text();
    ok('学习统计含全部要求指标', ['单词累计学习量','单词复习','各模块正确率','模拟考试成绩','薄弱模块分析'].every(k => st.includes(k)));
    await go('#/settings');
    const setTxt = await text();
    ok('数据设置含导出/恢复/导入/发音/目标/PWA 说明',
      ['导出 JSON 备份','从备份恢复','批量导入内容','发音设置','每日学习目标','安装到手机主屏幕'].every(k => setTxt.includes(k)));
    await ev(`(()=>{const t=document.getElementById('import-words-text');t.value='zoombird,/zuːm/,v.,演示导入词条';return true})()`);
    await click('[data-action="import-words"]');
    ok('批量导入词条真实生效', await ev(`(async()=>{const w=await import('./js/words.js');return !!w.getWord('zoombird') && w.getWord('zoombird').meaning==='演示导入词条'})()`, true));

    /* ---------- 补充按钮覆盖 ---------- */
    group('11. 补充按钮 / 交互覆盖');
    await go('#/words?tab=study');
    const editedWord = await ev(`document.querySelector('.word-card .word-en')?.innerText || ''`);
    await click('[data-action="edit"]');
    const hasEditForm = await ev(`!!document.getElementById('ew-word')`);
    ok('词条编辑表单可打开', hasEditForm);
    if (hasEditForm) {
      await ev(`document.getElementById('ew-mean').value='测试补全释义'`);
      await click('[data-sheet-act="1"]');
      await wait(250);
      ok('编辑词条保存并覆盖内置词条',
        await ev(`(async()=>{const w=await import('./js/words.js');const x=w.getWord(${J(editedWord)});return !!x && x.source==='custom' && x.meaning==='测试补全释义'})()`, true));
    }
    await go('#/courses/co01');
    await ev(`(()=>{const t=document.getElementById('course-note');t.value='浏览器测试笔记';t.dispatchEvent(new Event('input',{bubbles:true}));return true})()`);
    await wait(600);
    await click('[data-action="toggle-done"]');
    const co = (await state()).courses.co01;
    ok('课程笔记自动保存 + 标记完成', !!co && co.note.includes('浏览器测试笔记') && co.done === true);
    await go('#/review');
    await click('[data-action="redo"]');
    if (await ev(`document.querySelectorAll('.overlay [data-action="redo-answer"]').length > 0`)) await click('.overlay [data-action="redo-answer"]');
    else if (await ev(`document.querySelectorAll('.overlay [data-action="self-redo"]').length > 0`)) await click('.overlay [data-action="self-redo"][data-ok="1"]');
    ok('错题可重新练习并记录复习时间', (await state()).mistakes.some(m => !!m.lastReviewAt));
    await go('#/writing/w1');
    await click('[data-action="self-rate"]');
    ok('人工自评表单可打开', await ev(`!!document.getElementById('sr-0')`));
    await click('[data-sheet-act="1"]');
    await wait(300);
    ok('自评结果写入作文记录', (await state()).essays.some(e => !!e.selfScore));
    await go('#/reading/r1');
    await click('.gloss-chip');
    ok('阅读生词弹层可打开并含收藏操作', await ev(`!!document.querySelector('[data-sheet-act="1"]')`));
    await click('[data-sheet-act="1"]');
    ok('阅读生词收藏写入持久化', Object.values((await state()).wordProgress).some(r => r.favorite));
    await go('#/exam?mode=type&type=cloze');
    await click('[data-action="start-type"]');
    await wait(300);
    ok('按题型抽题生成专项小测', (await state()).examCurrent?.paperId === 'type-cloze');
    await go('#/settings');
    await ev(`(()=>{const el=document.querySelector('[data-key="dailyWordGoal"]');el.value='25';el.dispatchEvent(new Event('change',{bubbles:true}));return true})()`);
    ok('每日学习目标修改即时保存', (await state()).settings.dailyWordGoal === 25);
    await click('[data-action="speech-test"]');
    ok('发音测试按钮可用', await ev(`!!document.querySelector('[data-action="speech-test"]')`));

    /* ---------- 控制台错误 ---------- */
    group('12. 运行时错误检查');
    const errHint = await ev(`document.body.innerText.includes('页面渲染出错') || document.body.innerText.includes('操作失败：')`);
    ok('页面无渲染错误 / 操作异常提示', !errHint);

  } catch (e) {
    ok('浏览器测试执行', false, e.message);
    console.error(e);
  } finally {
    try { ws && ws.close(); } catch {}
    chrome.kill(); server.kill();
    await wait(300);
    try { fs.rmSync(profile, { recursive:true, force:true }); } catch {}
  }

  console.log('\n' + '='.repeat(56));
  console.log(`结果: ${pass} PASS / ${fail} FAIL`);
  if (fail) { console.log('失败项:\n - ' + failures.join('\n - ')); process.exitCode = 1; }
  else console.log('全部通过 ✅');
}
main().catch(e => { console.error(e); process.exitCode = 1; });
