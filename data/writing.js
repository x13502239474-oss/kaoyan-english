/* ============================================================
   写作训练 —— 演示内容（题目 / 格式 / 素材 / 范文拆解 分离存储）
   ------------------------------------------------------------
   ⚠️ 题目、格式模板、句型素材与范文均为【AI 生成的演示示例】，
   非历年真题、非教材原文、非官方范文。范文用于结构拆解示范。
   ============================================================ */
export const WRITING_META = {
  contentLabel: 'ai', labelText: '演示材料·AI生成',
  disclaimer: '演示示例，非真题、非官方范文；句型与模板为通用写作表达，请自行核对后使用。'
};

export const WRITING_TOPICS = [
  { id:'w1', kind:'small', type:'letter', title:'建议信 · 向图书馆提改进建议', minutes:20, wordLimit:'约 100 词',
    prompt:'You have some suggestions for the university library. Write a letter to the librarian to (1) state your purpose, (2) give two specific suggestions, and (3) express your hope for a reply. Do not sign your own name; use "Li Ming" instead.（演示题目，AI 生成）' },
  { id:'w2', kind:'small', type:'notice', title:'通知 · 校园读书分享会', minutes:20, wordLimit:'约 100 词',
    prompt:'Write a notice on behalf of the Students\u2019 Union to announce a campus reading club meeting. Include the time, the venue, the main activity and how to sign up.（演示题目，AI 生成）' },
  { id:'w3', kind:'big', type:'chart', title:'图表作文 · 通勤方式变化', minutes:35, wordLimit:'约 150 词',
    prompt:'The table below shows how employees in a company commuted in 2015 and 2025 (illustrative figures). Write an essay that (1) describes the changes, (2) gives possible reasons, and (3) offers a brief comment.（演示题目与数据均为 AI 生成的虚构数据）',
    chart:{ caption:'演示用虚构数据（非真实统计）', headers:['通勤方式','2015','2025'], rows:[['自驾','42%','28%'],['公共交通','35%','46%'],['骑行/步行','15%','21%'],['远程办公','8%','5%']] } },
  { id:'w4', kind:'big', type:'essay', title:'现象议论 · 碎片化学习', minutes:35, wordLimit:'约 150 词',
    prompt:'Some people believe short, fragmented study sessions suit a busy life, while others argue that deep learning requires long, uninterrupted blocks. Discuss both views and give your own opinion.（演示题目，AI 生成）' }
];

/* 常见应用文格式（通用结构说明 + 可套用骨架，非教材原文） */
export const WRITING_FORMATS = [
  { id:'f1', name:'书信 / 电子邮件', scene:'建议信、投诉信、邀请信、感谢信',
    structure:'称呼 → 写信目的 → 具体事项（2 点，分条） → 期待回复 → 落款',
    skeleton:'Dear Sir or Madam, / Dear [Name],\n\nI am writing to …（一句话说明目的）.\n\nFirst, … . Second, … .\n\nI would appreciate it if you could … . I look forward to your reply.\n\nYours sincerely,\nLi Ming',
    tips:['首段不要寒暄，直接说明写信目的','建议类用 I would suggest that … / It would be helpful if …','结尾不用真实姓名，按题目要求使用 Li Ming'] },
  { id:'f2', name:'通知 / 告示', scene:'活动通知、招募、变更公告',
    structure:'标题 → 时间地点 → 活动内容 → 参与方式 → 发布单位与日期',
    skeleton:'NOTICE\n\n[Activity] will be held at [venue] on [date/time].\n\nThe event will include … . All students are welcome.\n\nThose interested please sign up at [place/email] before [deadline].\n\nStudents\u2019 Union\n[Date]',
    tips:['标题居中大写 NOTICE','信息要素（时间、地点、报名方式）必须齐全','落款为组织名，不写个人姓名'] },
  { id:'f3', name:'图表作文', scene:'柱状图、表格、饼图、折线图',
    structure:'第一段：概述图表 + 描述主要变化 → 第二段：分析原因（2 条） → 第三段：评论或趋势判断',
    skeleton:'The table/chart illustrates … between [A] and [B].\n\nOverall, … rose from … to … , while … declined … .\n\nTwo factors may account for these changes. First, … . In addition, … .\n\nIn my view, this trend is likely to continue, provided that … .',
    tips:['描述数据要给出具体数值或幅度，不要只说「变化很大」','不要逐格抄表，抓最大值、最小值与变化最显著项','原因段与描述段必须分段'] },
  { id:'f4', name:'现象议论文', scene:'观点对比、利弊分析',
    structure:'引入争议 → 一方观点及理由 → 另一方观点及理由 → 自己立场 + 简要论证 → 收束',
    skeleton:'It is often debated whether … .\n\nSupporters argue that … , mainly because … .\n\nAdmittedly, opponents point out that … .\n\nFrom my perspective, … , since … . Therefore, … .',
    tips:['Admittedly / Nevertheless 等让步词能显著提升连贯性','自己的立场要明确，不要两段各打五十大板后不了了之','结尾避免引入全新论点'] }
];

/* 常用表达与句型素材库（通用表达，AI 整理） */
export const WRITING_MATERIALS = [
  { id:'m01', cat:'开头', expr:'I am writing to bring to your attention …', zh:'我写此信是想提请您关注…', usage:'建议信/投诉信首句' },
  { id:'m02', cat:'开头', expr:'The chart provides an overview of …', zh:'该图表概览了…', usage:'图表作文首句' },
  { id:'m03', cat:'开头', expr:'It is widely debated whether …', zh:'…一直存在广泛争议', usage:'议论文引入' },
  { id:'m04', cat:'描述数据', expr:'… rose steadily from X to Y', zh:'…从 X 稳步上升至 Y', usage:'上升趋势' },
  { id:'m05', cat:'描述数据', expr:'… accounted for the largest share, at X%', zh:'…占比最大，为 X%', usage:'饼图/表格最大值' },
  { id:'m06', cat:'描述数据', expr:'By contrast, … fell by roughly X percentage points', zh:'相比之下，…下降了约 X 个百分点', usage:'对比下降' },
  { id:'m07', cat:'描述数据', expr:'The figure remained virtually unchanged', zh:'该数值基本保持不变', usage:'持平项' },
  { id:'m08', cat:'原因分析', expr:'Two factors may account for this shift.', zh:'有两个因素可以解释这一变化。', usage:'原因段主题句' },
  { id:'m09', cat:'原因分析', expr:'This is largely attributable to …', zh:'这主要归因于…', usage:'引出原因' },
  { id:'m10', cat:'原因分析', expr:'Improved access to … has made it easier to …', zh:'…的普及使…更容易实现', usage:'技术/设施类原因' },
  { id:'m11', cat:'转折让步', expr:'Admittedly, … ; nevertheless, …', zh:'诚然…；然而…', usage:'议论文让步' },
  { id:'m12', cat:'转折让步', expr:'While this concern is reasonable, it overlooks …', zh:'这一担忧固然合理，却忽略了…', usage:'反驳对方' },
  { id:'m13', cat:'举例', expr:'A case in point is …', zh:'一个典型例子是…', usage:'举例论证' },
  { id:'m14', cat:'举例', expr:'Take … as an example.', zh:'以…为例。', usage:'口语化举例' },
  { id:'m15', cat:'观点', expr:'From my perspective, …', zh:'在我看来…', usage:'亮明立场' },
  { id:'m16', cat:'观点', expr:'I am inclined to believe that …', zh:'我倾向于认为…', usage:'委婉立场' },
  { id:'m17', cat:'结尾', expr:'I would appreciate it if you could …', zh:'如能…我将不胜感激', usage:'书信结尾请求' },
  { id:'m18', cat:'结尾', expr:'I look forward to your early reply.', zh:'期待您尽早回复。', usage:'书信收尾' },
  { id:'m19', cat:'结尾', expr:'This trend is likely to continue in the years ahead.', zh:'这一趋势未来几年很可能延续。', usage:'图表作文收尾' },
  { id:'m20', cat:'结尾', expr:'Striking a balance between A and B is therefore essential.', zh:'因此，在 A 与 B 之间取得平衡至关重要。', usage:'议论文收尾' }
];

/* 范文 + 逐段拆解（AI 编写演示范文，非官方范文） */
export const WRITING_SAMPLES = [
  { id:'s1', topicId:'w1', title:'演示范文 · 建议信', level:'演示',
    body:'Dear Sir or Madam,\n\nI am writing as a regular user of the university library to offer two suggestions that I believe would benefit students.\n\nFirst, the number of power sockets in the reading room is far from adequate, so many of us have to leave once our laptops run out of battery. Adding a few sockets along the walls would solve this problem at little cost. Second, it would be helpful if the opening hours could be extended to 10 p.m. during the examination period, when demand for quiet study space is at its highest.\n\nI would appreciate it if you could consider these proposals. I look forward to your reply.\n\nYours sincerely,\nLi Ming',
    breakdown:[
      { part:'第 1 段', role:'表明身份 + 写信目的', note:'一句话交代「常来图书馆的学生」身份，直接给出 two suggestions，符合题目第 1 点要求。' },
      { part:'第 2 段（First）', role:'建议一 + 理由 + 可行方案', note:'问题（插座不足）→ 后果（笔记本没电只能离开）→ 低成本方案，形成完整论证链。' },
      { part:'第 2 段（Second）', role:'建议二 + 限定条件', note:'用 during the examination period 把建议限定在合理范围，显得可行而非苛求。' },
      { part:'第 3 段', role:'期待回复', note:'I would appreciate it if … 为委婉请求句式；落款用 Li Ming，不出现真实姓名。' }
    ] },
  { id:'s2', topicId:'w3', title:'演示范文 · 图表作文', level:'演示',
    body:'The table illustrates how employees at a company commuted in 2015 and 2025. Overall, public transport became the dominant choice, while driving declined noticeably.\n\nIn 2015, driving accounted for the largest share at 42%, compared with 35% for public transport. Ten years later, the pattern had reversed: public transport rose to 46% and cycling or walking increased from 15% to 21%, whereas driving fell to 28%. Remote working edged down slightly from 8% to 5%.\n\nTwo factors may account for these changes. Improved bus and metro coverage made public transport faster and more predictable. In addition, growing awareness of health and environmental issues encouraged shorter journeys on foot or by bike.\n\nIn my view, this shift is desirable and is likely to continue, provided that the company keeps supporting flexible travel arrangements.',
    breakdown:[
      { part:'第 1 段', role:'概述图表 + 点出总体趋势', note:'不复述全部数据，只给出「公交成为主流、自驾下降」这一总判断。' },
      { part:'第 2 段', role:'数据描述', note:'抓最大值、反转与变化最显著项；用 compared with / whereas / edged down 体现对比与幅度差异。' },
      { part:'第 3 段', role:'原因分析', note:'两条原因分别对应「供给改善」与「观念变化」，用 Two factors may account for 领起。' },
      { part:'第 4 段', role:'评论 + 条件限定', note:'provided that 让结论不绝对化，是图表作文收尾的稳妥写法。' }
    ] }
];
