/* ============================================================
   真题与模拟考试 —— 演示内容（试卷 / 文章 / 题目 / 答案 分离存储）
   ------------------------------------------------------------
   ⚠️ 本站【不含任何历年真题】。以下两套为【AI 生成的演示模拟卷】，
   year 字段为演示标签，不代表真实考试年份；题目、答案、解析均为示例。
   如需练习真题，请通过「设置 → 批量导入」自行导入你拥有使用权的材料。
   ============================================================ */
export const EXAM_META = {
  contentLabel: 'ai', labelText: '演示模拟卷·AI生成',
  disclaimer: '本站不含历年真题。以下为 AI 生成的演示模拟卷，非真题、非官方答案。'
};

/* 试卷元信息：只描述结构与引用，不内联题目 */
export const EXAM_PAPERS = [
  { id:'e1', name:'演示模拟卷 A', year:'演示·A组', duration:45, totalScore:60,
    desc:'完形 3 题 + 阅读 3 题 + 翻译 1 题 + 写作 1 题（客观题自动评分，主观题保存答卷）',
    sections:[
      { id:'s1', type:'cloze', title:'第一部分 完形（演示）', qids:['e1q1','e1q2','e1q3'] },
      { id:'s2', type:'reading', title:'第二部分 阅读（演示）', qids:['e1q4','e1q5','e1q6'], passage:'p1' },
      { id:'s3', type:'translation', title:'第三部分 翻译（主观题）', qids:['e1q7'] },
      { id:'s4', type:'writing', title:'第四部分 写作（主观题）', qids:['e1q8'] }
    ] },
  { id:'e2', name:'演示模拟卷 B', year:'演示·B组', duration:45, totalScore:60,
    desc:'完形 3 题 + 阅读 3 题 + 翻译 1 题 + 写作 1 题（客观题自动评分，主观题保存答卷）',
    sections:[
      { id:'s1', type:'cloze', title:'第一部分 完形（演示）', qids:['e2q1','e2q2','e2q3'] },
      { id:'s2', type:'reading', title:'第二部分 阅读（演示）', qids:['e2q4','e2q5','e2q6'], passage:'p2' },
      { id:'s3', type:'translation', title:'第三部分 翻译（主观题）', qids:['e2q7'] },
      { id:'s4', type:'writing', title:'第四部分 写作（主观题）', qids:['e2q8'] }
    ] }
];

/* 阅读短文（与题目分离） */
export const EXAM_PASSAGES = {
  p1:{ title:'演示短文 A · 远程协作',
    text:'Distributed teams have become ordinary rather than exceptional. Their main advantage is not lower cost but access to people who would never relocate to a single city. The difficulty is coordination: when colleagues rarely share the same hours, small misunderstandings wait longer to be corrected. Teams that write down decisions in a shared document report fewer such delays than teams that rely on live meetings alone. Written records are slower to produce, yet they remain available to whoever joins later, which is why many managers now treat documentation as part of the work rather than an afterthought.' },
  p2:{ title:'演示短文 B · 城市噪音',
    text:'Noise is usually discussed as a nuisance, but researchers increasingly treat it as a planning variable. Traffic sound falls sharply with distance from a main road, so a single row of dense planting or a low barrier can change the character of a courtyard. Measurements alone, however, do not predict annoyance well: the same level of sound is tolerated differently depending on whether residents feel they have some control over their environment. This may explain why small design changes that give people a choice of where to sit often produce a larger improvement in satisfaction than modest reductions in decibels.' }
};

/* 题目：type=single 客观题 / type=text 主观题；不含答案 */
export const EXAM_QUESTIONS = {
  e1:[
    { id:'e1q1', section:'s1', type:'single', typeName:'完形', score:5, knowledge:'逻辑衔接',
      stem:'Written records are slower to produce, ___ they remain available to whoever joins later.', options:['because','yet','unless','since'] },
    { id:'e1q2', section:'s1', type:'single', typeName:'完形', score:5, knowledge:'词义辨析',
      stem:'Teams that write down decisions report fewer such ___.', options:['delays','benefits','meetings','managers'] },
    { id:'e1q3', section:'s1', type:'single', typeName:'完形', score:5, knowledge:'固定搭配',
      stem:'Many managers now treat documentation ___ part of the work.', options:['as','for','with','to'] },
    { id:'e1q4', section:'s2', type:'single', typeName:'阅读', score:5, knowledge:'细节定位', passage:'p1',
      stem:'According to the passage, the main advantage of distributed teams is ___.',
      options:['reduced office costs','access to people who would not relocate','longer working hours','fewer written records'] },
    { id:'e1q5', section:'s2', type:'single', typeName:'阅读', score:5, knowledge:'推理判断', passage:'p1',
      stem:'The author suggests that live meetings alone are ___.',
      options:['the most reliable way to correct misunderstandings','cheaper than documentation','insufficient for colleagues in different time zones','preferred by new team members'] },
    { id:'e1q6', section:'s2', type:'single', typeName:'阅读', score:5, knowledge:'主旨理解', passage:'p1',
      stem:'Which title best summarises the passage?', options:['Why Offices Still Matter','Documentation as Part of Distributed Work','The Cost of Relocation','How to Run a Meeting'] },
    { id:'e1q7', section:'s3', type:'text', typeName:'翻译', score:10, knowledge:'英译汉',
      stem:'将下面句子译成汉语（演示句，非真题）：Written records are slower to produce, yet they remain available to whoever joins later.', hint:'注意 yet 的转折与 whoever 引导的宾语从句。' },
    { id:'e1q8', section:'s4', type:'text', typeName:'写作', score:20, knowledge:'应用文/短文',
      stem:'演示写作题：用约 80 词说明「把讨论结论写下来」对团队协作的一个好处，并举例。', hint:'建议结构：观点句 → 理由 → 例子 → 收束句。' }
  ],
  e2:[
    { id:'e2q1', section:'s1', type:'single', typeName:'完形', score:5, knowledge:'逻辑衔接',
      stem:'Measurements alone do not predict annoyance well; ___ , perceived control matters.', options:['therefore','instead','moreover','otherwise'] },
    { id:'e2q2', section:'s1', type:'single', typeName:'完形', score:5, knowledge:'词义辨析',
      stem:'Traffic sound falls ___ with distance from a main road.', options:['sharply','slightly','rarely','equally'] },
    { id:'e2q3', section:'s1', type:'single', typeName:'完形', score:5, knowledge:'固定搭配',
      stem:'A larger improvement ___ satisfaction often comes from small design changes.', options:['in','on','at','for'] },
    { id:'e2q4', section:'s2', type:'single', typeName:'阅读', score:5, knowledge:'细节定位', passage:'p2',
      stem:'Why can a row of dense planting change a courtyard?',
      options:['It removes all traffic','Sound decreases quickly with distance from the road','It lowers residents\u2019 expectations','It increases measured decibels'] },
    { id:'e2q5', section:'s2', type:'single', typeName:'阅读', score:5, knowledge:'推理判断', passage:'p2',
      stem:'The author implies that giving residents a choice of where to sit ___.',
      options:['reduces decibels more than any barrier','has no measurable effect','raises satisfaction by increasing perceived control','makes noise regulation unnecessary'] },
    { id:'e2q6', section:'s2', type:'single', typeName:'阅读', score:5, knowledge:'词义猜测', passage:'p2',
      stem:'"nuisance" in the first sentence is closest to ___.', options:['a minor annoyance','a planning variable','a serious illness','a legal standard'] },
    { id:'e2q7', section:'s3', type:'text', typeName:'翻译', score:10, knowledge:'英译汉',
      stem:'将下面句子译成汉语（演示句，非真题）：The same level of sound is tolerated differently depending on whether residents feel they have some control over their environment.', hint:'注意被动转主动与 depending on whether 的处理。' },
    { id:'e2q8', section:'s4', type:'text', typeName:'写作', score:20, knowledge:'应用文/短文',
      stem:'演示写作题：用约 80 词描述你所在社区的一个噪音问题，并提出一条可行建议。', hint:'建议结构：问题 → 影响 → 建议 → 预期效果。' }
  ]
};

/* 仅客观题有答案；主观题只保存答卷，不自动判分 */
export const EXAM_KEYS = {
  e1:{
    e1q1:{ answer:1, explanation:'前后分句一慢一持久，构成转折，选 yet。' },
    e1q2:{ answer:0, explanation:'上句 small misunderstandings wait longer to be corrected，故记录决策可减少这类 delays。' },
    e1q3:{ answer:0, explanation:'treat A as B 为固定搭配「把 A 视为 B」。' },
    e1q4:{ answer:1, explanation:'原文 The main advantage is not lower cost but access to people who would never relocate，直接对应。' },
    e1q5:{ answer:2, explanation:'原文对比「写下来」与「仅依赖实时会议」，后者对不同时区同事不足。' },
    e1q6:{ answer:1, explanation:'末句把 documentation 视为工作本身，是全文收束点。' }
  },
  e2:{
    e2q1:{ answer:2, explanation:'前句说测量不够，本句补充另一因素，属递进，选 moreover。' },
    e2q2:{ answer:0, explanation:'原文 falls sharply with distance 原词复现。' },
    e2q3:{ answer:0, explanation:'improvement in + 名词，为固定搭配。' },
    e2q4:{ answer:1, explanation:'原文 Traffic sound falls sharply with distance from a main road, so … 为因果关系。' },
    e2q5:{ answer:2, explanation:'末句 larger improvement in satisfaction 与 perceived control 呼应。' },
    e2q6:{ answer:0, explanation:'nuisance 与后文 planning variable 对举，指「轻微的烦扰」。' }
  }
};
