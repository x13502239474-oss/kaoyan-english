/* ============================================================
   零依赖自动化回归测试：node tools/smoke-test.js
   ------------------------------------------------------------
   1) 全量 JS 语法检查（ESM / CJS 分开）
   2) 内容数据引用一致性（文章/题目/答案解析分离后互相对得上）
   3) 核心逻辑：持久化、SRS、错题去重、导出恢复、批量导入解析
   4) 30+ 路由渲染冒烟（所有页面真的能渲染出 HTML）
   5) HTTP 静态资源可达性（启动 server.js 实测）
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');
const { pathToFileURL } = require('url');

const ROOT = path.join(__dirname, '..');
let pass = 0, fail = 0;
const failures = [];
function ok(name, cond, detail = '') {
  if (cond) { pass++; console.log('  \x1b[32mPASS\x1b[0m ' + name + (detail ? '  ' + detail : '')); }
  else { fail++; failures.push(name + (detail ? ' — ' + detail : '')); console.log('  \x1b[31mFAIL\x1b[0m ' + name + '  ' + detail); }
}
function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}
function group(t) { console.log('\n\x1b[36m' + t + '\x1b[0m'); }

/* ---------- 1) 语法检查 ---------- */
function syntaxCheck() {
  group('1. 语法检查');
  const esm = [...walk(path.join(ROOT, 'js')), ...walk(path.join(ROOT, 'data'))].filter(f => f.endsWith('.js'));
  const cjs = [path.join(ROOT, 'server.js'), ...walk(path.join(ROOT, 'tools')).filter(f => f.endsWith('.js'))];
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ky-en-syntax-'));
  let i = 0;
  for (const f of esm) {
    const t = path.join(tmp, 'f' + (i++) + '.mjs');
    fs.writeFileSync(t, fs.readFileSync(f));
    try { cp.execFileSync(process.execPath, ['--check', t], { stdio: 'pipe' }); ok('ESM ' + path.relative(ROOT, f).replace(/\\/g, '/'), true); }
    catch (e) { ok('ESM ' + path.relative(ROOT, f).replace(/\\/g, '/'), false, String(e.stderr || e.message).slice(0, 300)); }
  }
  for (const f of cjs) {
    try { cp.execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); ok('CJS ' + path.relative(ROOT, f).replace(/\\/g, '/'), true); }
    catch (e) { ok('CJS ' + path.relative(ROOT, f).replace(/\\/g, '/'), false, String(e.stderr || e.message).slice(0, 300)); }
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  return esm;
}

/* ---------- 构建可在 Node 中 import 的 .mjs 树 ---------- */
function buildTree(esm) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ky-en-run-'));
  for (const f of esm) {
    const rel = path.relative(ROOT, f).replace(/\.js$/, '.mjs');
    const dest = path.join(tmp, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    let src = fs.readFileSync(f, 'utf8');
    src = src.replace(/from\s+(['"])([^'"]+)\.js\1/g, (m, q, p) => `from ${q}${p}.mjs${q}`);
    fs.writeFileSync(dest, src, 'utf8');
  }
  return tmp;
}
const U = (tmp, rel) => pathToFileURL(path.join(tmp, rel)).href;

async function main() {
  console.log('考研英语二 · 自学网站 自动化回归测试');
  console.log('项目目录: ' + ROOT);
  const esm = syntaxCheck();
  const tmp = buildTree(esm);

  /* Node 环境下模拟浏览器最小 API */
  const mem = new Map();
  globalThis.localStorage = {
    getItem: k => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: k => mem.delete(k), clear: () => mem.clear()
  };
  globalThis.document = {
    getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
    addEventListener() {}, createElement: () => ({ style: {}, appendChild() {}, click() {}, remove() {} }),
    body: { appendChild() {}, removeChild() {} }
  };
  globalThis.window = { addEventListener() {}, scrollTo() {} };
  globalThis.location = { hash: '#/home', protocol: 'http:', replace() {} };
  // Node 22 的 navigator 为只读全局，无需覆盖

  const store = await import(U(tmp, 'js/store.mjs'));
  const srs = await import(U(tmp, 'js/srs.mjs'));
  const utils = await import(U(tmp, 'js/utils.mjs'));
  const words = await import(U(tmp, 'js/words.mjs'));
  const ui = await import(U(tmp, 'js/ui.mjs'));

  /* ---------- 2) 数据一致性 ---------- */
  group('2. 内容数据引用一致性');
  const core = await import(U(tmp, 'data/words.core.mjs'));
  const corpus = await import(U(tmp, 'data/words.corpus.mjs'));
  const reading = await import(U(tmp, 'data/reading.mjs'));
  const cloze = await import(U(tmp, 'data/cloze.mjs'));
  const trans = await import(U(tmp, 'data/translation.mjs'));
  const writingD = await import(U(tmp, 'data/writing.mjs'));
  const coursesD = await import(U(tmp, 'data/courses.mjs'));
  const exams = await import(U(tmp, 'data/exams.mjs'));

  ok('核心演示词库条数与声明一致', core.CORE_WORDS.length === core.CORE_META.count, core.CORE_WORDS.length + ' 词');
  ok('核心词条字段齐全（音标/释义/例句/搭配）',
    core.CORE_WORDS.every(w => w.word && w.phonetic && w.meaning && w.example && Array.isArray(w.collocations)));
  ok('核心词条 id 唯一', new Set(core.CORE_WORDS.map(w => w.id)).size === core.CORE_WORDS.length);
  ok('资料词形清单有声明与免责说明', corpus.CORPUS_WORDS.length === corpus.CORPUS_META.wordCount && !!corpus.CORPUS_META.disclaimer,
    corpus.CORPUS_WORDS.length + ' 词 / ' + corpus.CORPUS_META.yearCount + ' 个年份段');
  ok('资料词形按年份分组且年份段非空',
    Object.keys(corpus.CORPUS_BY_YEAR).length === corpus.CORPUS_META.yearCount && Object.values(corpus.CORPUS_BY_YEAR).every(a => a.length > 0));

  let rAll = true, rCount = 0;
  for (const a of reading.ARTICLES) {
    const qs = reading.QUESTIONS[a.id] || [], keys = reading.ANSWER_KEYS[a.id] || {};
    if (!qs.length || !a.paragraphs.length || !a.structure || !a.sentences.length) rAll = false;
    for (const q of qs) { rCount++; const k = keys[q.id]; if (!k || !(k.answer >= 0 && k.answer < q.options.length) || !k.location || !k.correct || !Array.isArray(k.wrong)) rAll = false; }
  }
  ok('阅读：文章/题目/定位/正误解析一一对应', rAll, reading.ARTICLES.length + ' 篇 ' + rCount + ' 题');

  let cAll = true, cCount = 0;
  for (const p of cloze.CLOZE_PASSAGES) {
    const bs = cloze.CLOZE_BLANKS[p.id] || [], keys = cloze.CLOZE_KEYS[p.id] || {};
    const marks = (p.text.match(/\{\{\d+\}\}/g) || []).length;
    if (marks !== bs.length) cAll = false;
    for (const b of bs) { cCount++; const k = keys[b.no]; if (!k || !(k.answer >= 0 && k.answer < b.options.length) || !k.context || !k.lexicon) cAll = false; }
  }
  ok('完形：文章空位数 = 选项组数 = 答案组数', cAll, cCount + ' 空');

  let tAll = true;
  for (const t of trans.TRANSLATION_TASKS) {
    const refs = trans.TRANSLATION_REFS[t.id] || [];
    if (t.sentences.length !== refs.length) tAll = false;
    for (const sn of t.sentences) if (!sn.en || !sn.grammar || !sn.split) tAll = false;
    for (const r of refs) if (!r.ref || !r.note) tAll = false;
  }
  ok('翻译：每句都有参考译文与语法/拆解（原文与译文分离）', tAll, trans.TRANSLATION_TASKS.length + ' 段');

  ok('写作：范文引用的题目存在',
    writingD.WRITING_SAMPLES.every(s => writingD.WRITING_TOPICS.some(t => t.id === s.topicId)));
  ok('写作：格式/素材/范文齐全',
    writingD.WRITING_FORMATS.length >= 3 && writingD.WRITING_MATERIALS.length >= 15 && writingD.WRITING_SAMPLES.length >= 2);
  ok('课程：分类覆盖 6 类且每课结构完整',
    coursesD.CATEGORIES.length === 6 && coursesD.COURSES.every(c => coursesD.CATEGORIES.some(x => x.id === c.cat)
      && c.points.length && c.difficulties.length && c.examples.length && c.analysis),
    coursesD.COURSES.length + ' 课');

  let eAll = true, eCount = 0;
  for (const p of exams.EXAM_PAPERS) {
    const qs = exams.EXAM_QUESTIONS[p.id] || [], keys = exams.EXAM_KEYS[p.id] || {};
    const ids = p.sections.flatMap(s => s.qids);
    if (ids.length !== qs.length || new Set(ids).size !== ids.length) eAll = false;
    for (const q of qs) {
      eCount++;
      if (!ids.includes(q.id)) eAll = false;
      if (q.type === 'single' && (!keys[q.id] || !(keys[q.id].answer >= 0 && keys[q.id].answer < (q.options || []).length))) eAll = false;
      if (q.type === 'text' && keys[q.id]) eAll = false; // 主观题不应有自动答案
      if (q.passage && !exams.EXAM_PASSAGES[q.passage]) eAll = false;
    }
  }
  ok('考试：试卷引用题目存在、客观题有答案、主观题不自动判分', eAll, exams.EXAM_PAPERS.length + ' 卷 ' + eCount + ' 题');
  ok('所有内容模块带明确标注声明',
    [reading.READING_META, cloze.CLOZE_META, trans.TRANSLATION_META, writingD.WRITING_META,
     coursesD.COURSE_META, exams.EXAM_META, core.CORE_META, corpus.CORPUS_META]
      .every(m => m && (m.disclaimer || m.labelText || m.contentLabel)));

  /* ---------- 3) 核心逻辑 ---------- */
  group('3. 核心逻辑（持久化 / SRS / 导出恢复 / 导入）');
  store.init();
  ok('store 初始化并写入 localStorage', !!mem.get(store.STORAGE_KEY));

  const rec = store.wordRec('abandon');
  const g1 = srs.grade(rec, 'good');
  ok('SRS「记得」提升等级并安排下次复习', g1.level === 1 && g1.dueAt > Date.now(), 'Lv.' + g1.level + ' / ' + g1.interval + ' 天');
  const g2 = srs.grade(rec, 'again');
  ok('SRS「忘了」降级并在 10 分钟后重现', g2.level === 0 && g2.dueAt - Date.now() < 11 * 60 * 1000);
  store.save();
  ok('刷新后可重新载入掌握记录', (() => { store.init(); return store.wordRec('abandon').seen >= 2; })());

  store.update(s => { s.mistakes = []; });
  store.addMistake({ source:'reading', questionId:'r1q1', stem:'Q1', userAnswer:1, correctAnswer:2 });
  store.addMistake({ source:'reading', questionId:'r1q1', stem:'Q1', userAnswer:3, correctAnswer:2 });
  ok('同一错题重复作答去重并累加复习次数', store.get().mistakes.length === 1 && store.get().mistakes[0].reviewCount === 1);

  store.update(s => { s.settings.dailyWordGoal = 33; s.essays.push({ id:'es-test', content:'hello world', at:new Date().toISOString() }); });
  const bundle = store.exportBundle();
  ok('导出备份是合法 JSON 且带应用标识', (() => { try { const o = JSON.parse(bundle); return o.app === store.APP_TAG && o.state.settings.dailyWordGoal === 33; } catch { return false; } })());
  ok('备份结构校验拒绝其他应用', store.parseBundle(JSON.stringify({ app:'other-app', state:{} })).ok === false);
  ok('备份结构校验拒绝非法 JSON', store.parseBundle('{oops').ok === false);

  store.resetAll();
  ok('重置后数据清空', Object.keys(store.get().wordProgress).length === 0);
  const r1 = store.restore(bundle, 'replace');
  ok('覆盖恢复还原全部数据', r1.ok && store.get().settings.dailyWordGoal === 33 && store.get().essays.length === 1);
  store.resetAll();
  store.update(s => { s.customWords.push({ id:'x-keep', word:'keepme', meaning:'保留' }); });
  const r2 = store.restore(bundle, 'merge');
  ok('合并恢复保留双方记录', r2.ok && store.get().essays.length === 1 && store.get().customWords.some(w => w.word === 'keepme'));

  const lines = utils.parseWordLines('abandon,/əˈbændən/,v.,放弃；抛弃\nsustain,/səˈsteɪn/,v.,维持');
  ok('批量导入：逐行文本解析', lines.length === 2 && lines[0].word === 'abandon' && lines[0].meaning === '放弃；抛弃');
  const jsonLines = utils.parseWordLines('[{"word":"zoom","phonetic":"/zuːm/","meaning":"快速上升"}]');
  ok('批量导入：JSON 数组解析', jsonLines.length === 1 && jsonLines[0].word === 'zoom');
  ok('词库索引：演示词条 + 资料词形 + 用户导入 = 去重合并',
    (() => { const all = words.allWords(); return all.length > core.CORE_WORDS.length && all.some(w => w.source === 'corpus') && all.some(w => w.source === 'custom'); })(),
    words.allWords().length + ' 词');
  words.upsertCustomWord({ word:'abandon', meaning:'用户覆盖的释义' });
  ok('用户导入词条优先于内置演示词条', words.getWord('abandon').meaning === '用户覆盖的释义');
  const learned = words.allWords().slice(0, 3).map(w => w.word);
  ok('SRS 到期队列按逾期优先排序', (() => {
    store.resetAll();
    learned.forEach((w, i) => { const r = store.wordRec(w); r.seen = 1; r.dueAt = Date.now() - (i + 1) * 86400000; });
    store.save();
    const q = srs.dueQueue(words.allWords());
    return q.length === learned.length && q[0].overdueDays > q[q.length - 1].overdueDays;
  })());
  ok('新词队列排除已学词', (() => {
    const q = srs.newQueue(words.allWords(), 5);
    return q.length === 5 && !q.some(w => learned.includes(w.word));
  })());
  ok('内容标注 chip 生成正确', ui.labelChip('ai').includes('label-ai') && ui.labelChip('user').includes('label-user'));

  /* ---------- 4) 路由渲染冒烟 ---------- */
  group('4. 全站路由渲染冒烟');
  const viewNames = ['home','practice','words','reading','cloze','translation','writing','courses','exam','review','stats','settings'];
  const views = {};
  for (const v of viewNames) views[v] = await import(U(tmp, `js/views/${v}.mjs`));
  const ctxFor = (route) => {
    const [p, qs] = route.split('?');
    const seg = p.split('/').filter(Boolean);
    return { name:seg[0] || 'home', params:seg.slice(1), query:new URLSearchParams(qs || ''),
      go(){}, setQuery(){}, refresh(){}, toast(){}, store, ui, esc:utils.esc, attr:utils.attr, speech:{} };
  };
  const routes = [
    ['home','home'], ['practice','practice'],
    ['words','words?tab=study'], ['words','words?tab=review'], ['words','words?tab=test'],
    ['words','words?tab=lists'], ['words','words?tab=fav'],
    ['reading','reading'], ['reading','reading/r1'], ['reading','reading/r1?view=questions'],
    ['reading','reading/r1?view=sentences'], ['reading','reading/r1?view=analysis'], ['reading','reading/r2?view=questions'],
    ['cloze','cloze'], ['cloze','cloze/k1'],
    ['translation','translation'], ['translation','translation/t1'], ['translation','translation/t2'],
    ['writing','writing'], ['writing','writing?tab=materials'], ['writing','writing?tab=formats'],
    ['writing','writing?tab=samples'], ['writing','writing?tab=mine'], ['writing','writing/w1'],
    ['courses','courses'], ['courses','courses/co01'],
    ['exam','exam'], ['exam','exam?mode=type&type=cloze'], ['exam','exam?mode=type&type=vocab'],
    ['exam','exam/e1'], ['exam','exam/e2'],
    ['review','review'], ['review','review?tab=plan'], ['review','review?tab=words'],
    ['stats','stats'], ['settings','settings']
  ];
  let renderFail = [];
  for (const [v, route] of routes) {
    try {
      const html = views[v].render(ctxFor(route));
      if (typeof html !== 'string' || html.length < 60) renderFail.push(route + ' (空输出)');
      else if (html.includes('undefined') || html.includes('[object Object]')) renderFail.push(route + ' (含 undefined/对象字面量)');
    } catch (e) { renderFail.push(route + ' (' + e.message + ')'); }
  }
  ok('全部路由渲染出有效 HTML', renderFail.length === 0, routes.length + ' 条路由' + (renderFail.length ? ' → ' + renderFail.join(' | ') : ''));
  ok('每个视图都实现了交互动作表', viewNames.filter(v => v !== 'home' && v !== 'stats' && v !== 'practice').every(v => views[v].actions && Object.keys(views[v].actions).length > 0));
  ok('首页/统计/练习中心为纯展示页', ['home','stats','practice'].every(v => typeof views[v].render === 'function'));

  /* ---------- 5) HTTP 资源可达性 ---------- */
  group('5. HTTP 静态资源可达性');
  const child = cp.spawn(process.execPath, ['server.js'], { cwd:ROOT, env:{ ...process.env, PORT:'5194' } });
  let buf = '';
  const ready = new Promise((resolve, reject) => {
    const to = setTimeout(() => reject(new Error('服务器启动超时')), 8000);
    child.stdout.on('data', d => { buf += d.toString(); const m = buf.match(/localhost:(\d+)/); if (m) { clearTimeout(to); resolve(Number(m[1])); } });
    child.on('error', e => { clearTimeout(to); reject(e); });
  });
  try {
    const port = await ready;
    const files = walk(ROOT).filter(f => /\.(html|css|js|json|webmanifest|svg|png|md)$/i.test(f)
      && !f.includes(`${path.sep}tools${path.sep}`) && !f.includes(`${path.sep}tests${path.sep}`) && !f.includes(`${path.sep}docs${path.sep}`));
    let bad = [];
    for (const f of files) {
      const rel = path.relative(ROOT, f).split(path.sep).join('/');
      try { const r = await fetch(`http://127.0.0.1:${port}/${rel}`); if (!r.ok) bad.push(rel + ' → ' + r.status); }
      catch (e) { bad.push(rel + ' → ' + e.message); }
    }
    ok('所有静态资源返回 200', bad.length === 0, files.length + ' 个文件' + (bad.length ? ' → ' + bad.slice(0, 5).join(' | ') : ''));
    const idx = await (await fetch(`http://127.0.0.1:${port}/`)).text();
    ok('首页 HTML 含 PWA manifest / module 入口 / 视口', idx.includes('manifest.webmanifest') && idx.includes('type="module"') && idx.includes('viewport'));
    const mf = await (await fetch(`http://127.0.0.1:${port}/manifest.webmanifest`)).json();
    ok('PWA manifest 结构完整', mf.name && mf.icons && mf.icons.length >= 3 && mf.display === 'standalone');
    const sw = await (await fetch(`http://127.0.0.1:${port}/sw.js`)).text();
    ok('Service Worker 缓存清单覆盖全部视图与数据文件', sw.includes('views/settings.js') && sw.includes('data/words.corpus.js') && sw.includes('data/exams.js'));
  } catch (e) { ok('HTTP 测试', false, e.message); }
  finally { child.kill(); }

  fs.rmSync(tmp, { recursive:true, force:true });
  console.log('\n' + '='.repeat(56));
  console.log(`结果: ${pass} PASS / ${fail} FAIL`);
  if (fail) { console.log('失败项:\n - ' + failures.join('\n - ')); process.exitCode = 1; }
  else console.log('全部通过 ✅');
}

main().catch(e => { console.error('测试脚本异常:', e); process.exitCode = 1; });
