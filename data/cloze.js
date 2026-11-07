/* ============================================================
   完形填空 —— 演示内容（文章 / 选项 / 答案与解析 分离存储）
   ------------------------------------------------------------
   ⚠️ 全部为【AI 生成的演示示例】，非真题、非教材原文、非官方答案。
   文章用 {{n}} 标记空格；CLOZE_BLANKS 只存选项，CLOZE_KEYS 只存答案与解析。
   ============================================================ */
export const CLOZE_META = {
  contentLabel: 'ai', labelText: '演示文章·AI生成',
  disclaimer: '演示示例，非真题、非教材原文、非官方答案。'
};

export const CLOZE_PASSAGES = [
  {
    id: 'k1', title: 'Learning a Language in Small Steps', topic: '语言学习', minutes: 12,
    text: 'Many learners begin a language course with great enthusiasm, only to give up a few weeks later. The problem is rarely a lack of ability; more often it is the {{1}} of an unrealistic plan. A schedule that demands two hours of study every evening may look impressive on paper, {{2}} it collapses at the first busy week.\n\nResearchers who study habit formation suggest a different {{3}} . Instead of measuring how long you study, decide on a small action that can be repeated {{4}} : ten new words while waiting for a bus, or one short paragraph before breakfast. Because the action is modest, there is little {{5}} to postpone it, and repetition gradually turns effort into routine.\n\nThis approach also changes how learners {{6}} progress. A single long session produces a satisfying sense of achievement, but its effect fades quickly. By {{7}} , short daily contact keeps vocabulary active in memory, which is precisely {{8}} spaced review is built on.\n\nNone of this means that intensive study is {{9}} . It simply works best when it rests on a base of small, reliable habits. For most people, consistency, {{10}} intensity, is the better predictor of long-term success.',
    gloss: [
      { word:'enthusiasm', phonetic:'/ɪnˈθjuːziæzəm/', meaning:'n. 热情' },
      { word:'postpone', phonetic:'/pəˈspəʊn/', meaning:'v. 推迟' },
      { word:'spaced review', phonetic:'/speɪst rɪˈvjuː/', meaning:'n. 间隔复习' }
    ]
  }
];

/* 只存选项，不含答案 */
export const CLOZE_BLANKS = {
  k1: [
    { no:1, options:['pressure','absence','consequence','advantage'] },
    { no:2, options:['so','but','because','unless'] },
    { no:3, options:['objection','approach','conclusion','excuse'] },
    { no:4, options:['rarely','daily','briefly','formally'] },
    { no:5, options:['temptation','opportunity','permission','evidence'] },
    { no:6, options:['ignore','measure','deny','delay'] },
    { no:7, options:['contrast','chance','accident','request'] },
    { no:8, options:['when','where','what','which'] },
    { no:9, options:['useless','essential','possible','expensive'] },
    { no:10, options:['rather than','along with','except for','due to'] }
  ]
};

/* 答案索引（0-3）、上下文关联、词汇语法解析 */
export const CLOZE_KEYS = {
  k1: {
    1:{ answer:0, context:'上句说问题「很少是能力不足」，本句转折到真正原因；下文「不切实际的计划」带来的是压力，形成因果链。', lexicon:'pressure of an unrealistic plan「不切实际计划带来的压力」；absence（缺乏）与上文 a lack of 重复且逻辑相反。', knowledge:'名词词义辨析 + 上下文因果' },
    2:{ answer:1, context:'前半句「纸面上看起来很棒」与后半句「第一个忙碌的星期就崩了」构成转折。', lexicon:'but 表转折；so 表结果、because 表原因、unless 表条件，均不符。', knowledge:'逻辑连接词 / 转折关系' },
    3:{ answer:1, context:'本段提出与「长时间学习计划」不同的另一套做法，下文用 Instead of 展开具体方法。', lexicon:'approach「方法」与上一段 plan 呼应；objection「反对」、conclusion「结论」不合语境。', knowledge:'名词词义辨析 + 段落主旨' },
    4:{ answer:1, context:'后文举例「等公交时」「早饭前」以及下段 short daily contact，都指向每日重复。', lexicon:'daily 与 repeated 搭配；rarely 与语义相反，briefly 修饰时长而非频率。', knowledge:'副词辨析 + 下文复现线索' },
    5:{ answer:0, context:'因为动作很小，所以「推迟它的诱惑」很小，与前句 modest 构成因果。', lexicon:'temptation to postpone「拖延的诱因」；little 修饰不可数名词 temptation。', knowledge:'固定搭配 + 因果推理' },
    6:{ answer:1, context:'下句对比「一次长时间学习」与「每日短时接触」，讨论的正是如何衡量进步。', lexicon:'measure progress「衡量进步」；与上段 Instead of measuring how long you study 原词复现。', knowledge:'动词辨析 + 原词复现' },
    7:{ answer:0, context:'前句讲长时学习，本句讲短时接触，两者构成对比。', lexicon:'by contrast「相比之下」为固定短语；by chance「偶然」、by accident「意外」不合逻辑。', knowledge:'固定短语 / 对比衔接' },
    8:{ answer:2, context:'空格引导表语从句，且在从句中作 built on 的宾语，指「间隔复习所依据的东西」。', lexicon:'what = the thing which；which 引导定语从句需先行词，when/where 不作宾语。', knowledge:'名词性从句 / 表语从句' },
    9:{ answer:0, context:'None of this means… 是否定式让步，后文 simply works best 说明集中学习并非无用，只是需要基础。', lexicon:'useless「无用的」；若选 essential 则与让步逻辑冲突。', knowledge:'形容词辨析 + 否定让步' },
    10:{ answer:0, context:'全文反复强调 consistency（持续性），结论把「持续性」与「强度」对比。', lexicon:'rather than「而不是」；along with「连同」会抹去对比关系。', knowledge:'介词短语辨析 + 全文主旨' }
  }
};
