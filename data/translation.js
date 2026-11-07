/* ============================================================
   翻译训练 —— 演示内容（原文+语法分析 / 参考译文 分离存储）
   ------------------------------------------------------------
   ⚠️ 全部为【AI 生成的演示示例】，非历年真题、非官方参考译文。
   ============================================================ */
export const TRANSLATION_META = {
  contentLabel: 'ai', labelText: '演示材料·AI生成',
  disclaimer: '演示示例，非真题、非官方参考译文；参考译文仅供自评对照。'
};

export const TRANSLATION_TASKS = [
  {
    id:'t1', title:'演示段落 A · 技术与工作', direction:'en2zh', minutes:15,
    source:'AI 生成演示段落',
    fullText:'Automation rarely removes an occupation in one stroke. What it changes first is the mix of tasks inside a job, and that shift is easy to overlook. A clerk who once typed every figure by hand may now spend most of the day checking what a system has produced. Because the title on the contract stays the same, observers conclude that nothing has happened, when in fact the skills required have been quietly rewritten.',
    sentences:[
      { no:1, en:'Automation rarely removes an occupation in one stroke.',
        grammar:'频度副词 rarely 表否定含义；in one stroke 为方式状语「一下子、一举」。',
        split:'简单句：主语 Automation + 谓语 removes + 宾语 an occupation + 状语。注意 rarely 虽非 not，但译成中文时常处理为「很少／几乎不会」。' },
      { no:2, en:'What it changes first is the mix of tasks inside a job, and that shift is easy to overlook.',
        grammar:'What 引导主语从句；and 连接并列分句；be + adj. + to do 结构。',
        split:'主语从句 What it changes first（it 指 automation）作主语，系动词 is，表语 the mix of tasks；后半句 that shift 回指前半句的变化。' },
      { no:3, en:'A clerk who once typed every figure by hand may now spend most of the day checking what a system has produced.',
        grammar:'who 引导定语从句；spend time doing 结构；what 引导宾语从句；现在完成时 has produced。',
        split:'主干：A clerk … may now spend most of the day checking …；who 从句修饰 clerk；checking 后接 what 从句作宾语。翻译时可把长定语前置拆成短句。' },
      { no:4, en:'Because the title on the contract stays the same, observers conclude that nothing has happened, when in fact the skills required have been quietly rewritten.',
        grammar:'Because 引导原因状语从句；that 引导宾语从句；when 在此表「然而／却」的对比转折（非「当…时」）；required 为过去分词作后置定语。',
        split:'主句 observers conclude + that 宾语从句；when 引出与前文判断相反的事实；the skills required = the skills that are required。这是本段最易误译处。' }
    ]
  },
  {
    id:'t2', title:'演示段落 B · 城市与阅读', direction:'en2zh', minutes:15,
    source:'AI 生成演示段落',
    fullText:'Public libraries were once justified mainly by the books they held. Today their value is increasingly measured by the space they make available: a quiet desk, a reliable connection, and a room in which nobody is expected to buy anything. This change has not been driven by technology alone. It also reflects a broader recognition that access to a shared, unhurried place has become scarce in dense cities.',
    sentences:[
      { no:1, en:'Public libraries were once justified mainly by the books they held.',
        grammar:'被动语态 were justified；they held 为省略关系代词的定语从句修饰 the books。',
        split:'主干：Public libraries were justified by …；mainly 为程度状语。英译汉时被动常转主动：「人们过去主要以藏书量来论证公共图书馆的价值」。' },
      { no:2, en:'Today their value is increasingly measured by the space they make available: a quiet desk, a reliable connection, and a room in which nobody is expected to buy anything.',
        grammar:'冒号后为三项同位列举；in which 引导定语从句修饰 a room；be expected to do 被动。',
        split:'主干 their value is measured by the space；they make available 为省略关系代词的定语从句；三项并列成分需译得整齐，保持排比感。' },
      { no:3, en:'It also reflects a broader recognition that access to a shared, unhurried place has become scarce in dense cities.',
        grammar:'that 引导同位语从句说明 recognition 的内容；access to 为固定搭配；现在完成时 has become。',
        split:'主干：It reflects a recognition + that 同位语从句；从句主语为 access to a shared, unhurried place。注意 recognition 可转译为动词「人们意识到」。' }
    ]
  }
];

/* 参考译文与译法说明：与原文分离存储 */
export const TRANSLATION_REFS = {
  t1:[
    { no:1, ref:'自动化很少会一举消灭某个职业。', note:'rarely 译「很少」比「不」更贴切；in one stroke 意译「一举／一下子」。' },
    { no:2, ref:'它最先改变的是一份工作内部各项任务的构成，而这种转变很容易被忽视。', note:'What 主语从句转译为「…的是」；that shift 宜补出「这种转变」以承接上文。' },
    { no:3, ref:'过去要亲手录入每一个数字的职员，如今可能一天中的大部分时间都在核对系统生成的结果。', note:'who 定语从句较长，拆成前置短句更合汉语习惯；spend … checking 译「花时间核对」。' },
    { no:4, ref:'由于合同上的职位名称没有变，观察者便以为一切如旧，然而事实上，所需的技能已被悄然改写。', note:'when 在此是转折「然而」，不是时间状语；被动 have been rewritten 可保留「被」也可转主动。' }
  ],
  t2:[
    { no:1, ref:'过去，人们主要以藏书量来论证公共图书馆存在的价值。', note:'被动转主动，补出泛指主语「人们」；justified by 译「以…来论证其合理性」。' },
    { no:2, ref:'如今，衡量其价值的标准越来越变成它所提供的空间：一张安静的书桌、一条稳定的网络，以及一个不要求你消费任何东西的房间。', note:'冒号后三项保持排比；in which 定语从句可压缩为前置定语。' },
    { no:3, ref:'这也反映出一种更广泛的认识：在拥挤的城市里，能有一处共享而从容的空间，已经变得稀缺。', note:'recognition 名词转动词「人们意识到／反映出一种认识」；unhurried 意译「从容」。' }
  ]
};
