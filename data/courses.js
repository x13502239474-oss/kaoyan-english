/* ============================================================
   课程学习系统 —— 演示内容（知识点 / 例句 / 解析 结构化存储）
   ------------------------------------------------------------
   ⚠️ 全部课程讲解为【AI 编写的方法论演示内容】，非教材原文、
   非机构课程讲义。学习笔记、完成状态、复习计划由本地 store 保存。
   ============================================================ */
export const COURSE_META = {
  contentLabel: 'ai', labelText: '演示课程·AI编写',
  disclaimer: '演示示例课程，非教材原文或机构讲义；方法为通用学习策略。'
};

export const CATEGORIES = [
  { id:'vocab', name:'词汇', icon:'词', desc:'词根词缀、熟词僻义与记忆策略' },
  { id:'grammar', name:'语法', icon:'法', desc:'长难句主干、从句与非谓语' },
  { id:'reading', name:'阅读', icon:'读', desc:'定位、推断与主旨判断' },
  { id:'cloze', name:'完形', icon:'完', desc:'逻辑衔接与词义辨析' },
  { id:'translation', name:'翻译', icon:'译', desc:'拆句、词性转换与汉语表达' },
  { id:'writing', name:'写作', icon:'写', desc:'格式、结构与图表描述' }
];

export const COURSES = [
  { id:'co01', cat:'vocab', title:'词根词缀：拆分长单词', minutes:12, level:'基础',
    points:['常见前缀决定方向或否定：un-/in-/dis-/re-/pre-/over-','常见后缀决定词性：-tion/-ment（名词）、-ive/-able（形容词）、-ize/-ify（动词）','词根承载核心义：spect（看）、port（搬）、duct（引导）、scrib（写）'],
    difficulties:['前缀 in- 有「不」与「向内」两义，需靠语境判断','同一词根可能有多形式（produce / product / production），词性不可想当然'],
    examples:[
      { en:'The new policy was introduced to reduce duplication.', zh:'新政策旨在减少重复劳动。', note:'introduce = intro(向内)+duce(引导)；reduce = re(回)+duce(引导) → 引回、减少。' },
      { en:'The findings are consistent with earlier research.', zh:'这些发现与早前研究一致。', note:'con-(共同)+sist(站立)+-ent → 站在一起 → 一致的。' }
    ],
    analysis:'拆词的目标不是背词根表，而是在阅读中遇到生词时能快速猜测「大致义 + 词性」。建议步骤：先划掉前后缀找词根 → 用词根义造一个粗略中文 → 回代原句检查是否通顺 → 再查证。猜错也要保留记录，错的猜测能暴露词根义掌握不准的地方。',
    keywords:['词根','词缀','猜词','词性'] },

  { id:'co02', cat:'vocab', title:'熟词僻义：别被第一反应骗了', minutes:12, level:'进阶',
    points:['高频小词常有多个义项，阅读理解偏爱考「非第一义」','一词多义往往由具体语境的搭配对象决定','建立「僻义清单」比单独背生词更划算'],
    difficulties:['assume 除「假定」外还有「承担、呈现、就任」','maintain 除「维持」外还有「坚称、赡养」','apparent 除「明显」外还有「表面上的、未必真实的」'],
    examples:[
      { en:'He assumed office in March.', zh:'他于三月就任。', note:'assume = 就任，不是「假定」。' },
      { en:'The company maintains that the figures are accurate.', zh:'公司坚称这些数据准确。', note:'maintain = 主张、坚称，后接 that 从句。' },
      { en:'Their apparent calm concealed real anxiety.', zh:'他们表面上的平静掩盖了真实的焦虑。', note:'apparent 与 real 对举时，取「表面上的」。' }
    ],
    analysis:'判断僻义的信号：① 常见义代入后句子逻辑不通；② 出现与之对举的词（apparent vs real）；③ 搭配对象变化（assume + office/responsibility）。遇到这三类信号时，先停下来问「有没有更贴切的义项」，再查证并加入僻义清单。',
    keywords:['一词多义','熟词僻义','语境'] },

  { id:'co03', cat:'grammar', title:'找主干：长难句第一步', minutes:15, level:'基础',
    points:['一个句子只有一个主谓核心，先找谓语动词再找主语','介词短语、从句、非谓语短语先整体括起来跳读','并列连词 and / but / or 可能连接两个并列主干'],
    difficulties:['以 -ed 结尾的词可能是谓语过去式，也可能是过去分词作定语','that 可能引导定语从句、宾语从句或同位语从句，功能不同'],
    examples:[
      { en:'The report published last week assesses the impact of the new rules on small firms.', zh:'上周发布的报告评估了新规对小企业的影响。', note:'published 是过去分词作定语；真正谓语是 assesses。先跳读 published last week。' },
      { en:'What the survey shows is that habits change slowly.', zh:'调查所显示的是，习惯改变得很慢。', note:'What 从句作主语，is 为系动词，that 从句作表语。' }
    ],
    analysis:'实操四步：① 圈出所有连词与关系词；② 划掉介词短语和从句，剩下的即主干；③ 把主干先译成一句短中文；④ 再把修饰成分逐层挂回去。翻译腔太重通常是因为把修饰成分硬塞进同一个汉语句子，可适当拆句。',
    keywords:['主干','谓语','修饰成分','拆句'] },

  { id:'co04', cat:'grammar', title:'非谓语与从句的互换', minutes:15, level:'进阶',
    points:['现在分词表主动/进行，过去分词表被动/完成','不定式常表目的或尚未发生的动作','分词短语可改写为定语从句，反之亦然'],
    difficulties:['悬垂修饰：分词逻辑主语须与主句主语一致','having done 强调先于主句动作完成'],
    examples:[
      { en:'Written in plain English, the guide is easy to follow.', zh:'这本指南用浅显英语写成，容易理解。', note:'Written 被动，逻辑主语是 the guide；等价于 which was written in plain English。' },
      { en:'Having checked the data twice, she submitted the report.', zh:'核对两遍数据后，她提交了报告。', note:'having checked 表示动作先于 submitted 完成。' }
    ],
    analysis:'阅读中把分词还原成从句，能快速确认「谁做的」；写作中用分词替换从句可让句子更紧凑。但要检查逻辑主语：*Walking down the street, the tree looked tall 是典型悬垂错误，因为 tree 不会走路。',
    keywords:['分词','不定式','定语从句','悬垂修饰'] },

  { id:'co05', cat:'reading', title:'细节题：定位与同义替换', minutes:14, level:'基础',
    points:['先看题干找定位词（专有名词、数字、独特名词），再回原文','正确答案常是原文的同义改写，而非原词照抄','选项含 must / only / all / never 等绝对词时优先警惕'],
    difficulties:['题干用概括词，原文用具体词，需靠语义而非字面匹配','跨越两句的信息整合题，定位不能只盯一句'],
    examples:[
      { en:'原文: … firms volunteered to take part … → 选项: the results may not apply broadly', zh:'原文「自愿参加」→ 选项「结论未必可推广」', note:'这是推断式同义替换：样本自选 → 代表性受限。' },
      { en:'原文: easier to map, fund and celebrate → 选项: simpler to plan, finance and publicise', zh:'三词逐一替换', note:'map→plan、fund→finance、celebrate→publicise，典型高考/考研式改写。' }
    ],
    analysis:'定位后用「三问」核验：这句与题干问的是同一件事吗？选项的每个限定成分原文都有依据吗？有没有把「可能」说成「必然」？错误选项最常见的是无中生有、张冠李戴与程度夸大三类。',
    keywords:['定位','同义替换','绝对词','排除法'] },

  { id:'co06', cat:'reading', title:'主旨与态度：抓段落首尾与限定语', minutes:14, level:'进阶',
    points:['主旨看首段末句与末段首句，而非某个例子','态度由限定语体现：may / appears to / yet / none of this','举例段落服务于观点，不能当选观点本身'],
    difficulties:['作者引述他人观点 ≠ 作者本人立场','「有限肯定」与「强烈批评」的区别常在一个让步句'],
    examples:[
      { en:'None of this argues against big parks. Rather, it suggests a portfolio approach.', zh:'这并不意味着反对大型公园，而是建议组合配置。', note:'Rather 之后才是作者立场；前半句用于排除误读。' },
      { en:'A shorter week may well be a useful experiment, but it is a test of …', zh:'缩短工作周或许是有益的尝试，但它检验的是…', note:'may well + but 表明谨慎肯定，不是无条件支持。' }
    ],
    analysis:'做主旨题时，把每段首句写成 5 字左右的中文标签，串起来看指向；再核对末段是否收束到同一对象。态度题优先找「让步 + 转折」结构：作者往往在转折后给出真实立场，在让步部分预先挡掉一种极端解读。',
    keywords:['主旨','态度','让步','限定语'] },

  { id:'co07', cat:'cloze', title:'逻辑衔接：先定关系再选词', minutes:14, level:'基础',
    points:['常见关系：转折、因果、递进、对比、条件、让步','空格前后各读一句，判断方向向上还是向下','连接词题不靠词义，靠前后分句的语义关系'],
    difficulties:['but / yet / however 语气与位置不同','as / since 既可表原因也可表时间'],
    examples:[
      { en:'It may look impressive on paper, ___ it collapses at the first busy week.', zh:'纸面上好看，但第一个忙周就崩了。', note:'前后一正一反 → 转折 → but。' },
      { en:'___ the title stays the same, observers conclude that nothing has happened.', zh:'因为职位名称没变，观察者便以为一切如旧。', note:'前因后果 → Because。' }
    ],
    analysis:'把前后分句各用一个「+ / −」标记情感或结果方向：同向多为因果、递进；反向多为转折、让步。标记完再去看选项，可以避免被形近词带偏。做完通读一遍，检查连接词是否让整段逻辑自洽。',
    keywords:['逻辑连词','转折','因果','方向判断'] },

  { id:'co08', cat:'cloze', title:'词义辨析与上下文复现', minutes:14, level:'进阶',
    points:['名词题看搭配对象与修饰语，动词题看主语和宾语','上下文常出现原词复现或同义复现，是强线索','固定搭配题优先检索介词与形式'],
    difficulties:['中文释义相近的四个词，差别在语体或使用场景','抽象名词与 little / much / great 的搭配限制'],
    examples:[
      { en:'Because the action is modest, there is little ___ to postpone it.', zh:'动作很小，几乎没有拖延的诱因。', note:'little + 不可数名词 temptation；与 modest 构成因果。' },
      { en:'This approach also changes how learners ___ progress.', zh:'这种做法也改变了学习者衡量进步的方式。', note:'上段 Instead of measuring 原词复现 → measure。' }
    ],
    analysis:'四个选项都认识却选不出，通常是因为只看空格所在句。把搜索范围扩到「上一句 + 下一句」，找复现词、指代（this / such / that shift）与并列结构。若仍无把握，先跳过，做完整篇后再回看——后文往往给出答案线索。',
    keywords:['词义辨析','复现','固定搭配','指代'] },

  { id:'co09', cat:'translation', title:'拆句与重组：英译汉的基本动作', minutes:15, level:'基础',
    points:['英语重形合（长句多层挂载），汉语重意合（短句顺次铺开）','定语从句过长时拆成独立小句','被动语态常转主动，补出泛指主语'],
    difficulties:['when 表「然而」而非「当…时」的转折用法','同位语从句与定语从句的区分'],
    examples:[
      { en:'Public libraries were once justified mainly by the books they held.', zh:'过去，人们主要以藏书量来论证公共图书馆的价值。', note:'被动转主动 + 补主语「人们」。' },
      { en:'… observers conclude that nothing has happened, when in fact the skills required have been quietly rewritten.', zh:'…观察者便以为一切如旧，然而事实上所需技能已被悄然改写。', note:'when 取转折义；required 为过去分词作后置定语。' }
    ],
    analysis:'推荐流程：找主干 → 译成一句独立中文 → 逐个挂载修饰成分 → 按汉语时间/逻辑顺序重排 → 通读删掉多余的「的」「被」「了」。判断标准是：不看英文，中文单读是否像一句自然的话。',
    keywords:['拆句','被动转主动','形合意合','后置定语'] },

  { id:'co10', cat:'translation', title:'词性转换与抽象名词', minutes:15, level:'进阶',
    points:['英语抽象名词常转译为汉语动词或副词','recognition / access / availability 等词直译易生硬','介词短语常转译为汉语的状语或小句'],
    difficulties:['of 结构多层嵌套时的切分顺序','「access to + 名词」不宜硬译「对…的接近」'],
    examples:[
      { en:'It reflects a broader recognition that … has become scarce.', zh:'这反映出人们更普遍地意识到：…已变得稀缺。', note:'recognition 名词 → 动词「意识到」。' },
      { en:'access to a shared, unhurried place', zh:'能有一处共享而从容的空间', note:'access to 转译为「能有／得以使用」。' }
    ],
    analysis:'遇到「冠词 + 抽象名词 + of/that」时，先问：这个名词背后是不是一个动作？若是，把它还原成动词再找主语，句子立刻顺。译文完成后做一次「去欧化」检查：删掉可被动词替代的「进行、作出、加以」，合并连续的「的」。',
    keywords:['词性转换','抽象名词','去欧化','通顺度'] },

  { id:'co11', cat:'writing', title:'小作文：格式分不能丢', minutes:14, level:'基础',
    points:['书信 = 称呼 + 目的 + 事项 + 期待 + 落款；通知 = 标题 + 要素 + 落款','题目给出的每一个要点都要在文中有对应句','字数不足往往因为只写了要点没有展开理由'],
    difficulties:['落款按题目要求用 Li Ming，不能写真实姓名','通知不写称呼，书信不能漏称呼'],
    examples:[
      { en:'I am writing to offer two suggestions that I believe would benefit students.', zh:'我写此信是想提出两点建议。', note:'一句话同时完成「目的」与「要点数量」。' },
      { en:'I would appreciate it if you could consider these proposals.', zh:'如能考虑这些建议，我将不胜感激。', note:'委婉请求，避免命令语气。' }
    ],
    analysis:'动笔前用 30 秒列提纲：三个要点各写一句主题句，每句后面补一句理由或细节。这样既不会漏点，也自然地达到字数。写完检查四项：称呼/标题、要点齐全、落款、有无真实个人信息。',
    keywords:['书信','通知','要点覆盖','落款'] },

  { id:'co12', cat:'writing', title:'图表作文：描述、原因、评论三段式', minutes:15, level:'进阶',
    points:['第一段概述图表 + 点出总体趋势，不罗列所有数字','第二段抓最大值、最小值与变化最显著项做对比','第三段给两条原因，末段作有条件的评论'],
    difficulties:['逐格抄表会挤占篇幅且显得没有概括能力','时态：有明确过去年份用过去时，趋势判断用现在/将来'],
    examples:[
      { en:'Overall, public transport became the dominant choice, while driving declined noticeably.', zh:'总体而言，公交成为主流，而自驾明显下降。', note:'用 while 一句写清两条相反趋势。' },
      { en:'This trend is likely to continue, provided that …', zh:'在…条件下，这一趋势有望延续。', note:'provided that 让结论不绝对化。' }
    ],
    analysis:'描述段只回答「什么变了、变了多少」，原因段只回答「为什么」，两段不要互相串。数字务必与题目图表一致（本演示题的数据为虚构，仅用于练习结构）。最后留 2 分钟检查主谓一致与单复数。',
    keywords:['三段式','趋势描述','原因分析','时态'] }
];
