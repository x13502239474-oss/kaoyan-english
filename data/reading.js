/* ============================================================
   阅读理解 —— 演示内容（文章 / 题目 / 答案与解析 分离存储）
   ------------------------------------------------------------
   ⚠️ 全部文章、题目、选项、答案与解析均为【AI 生成的演示示例】，
   不是历年考研英语二真题，也不是任何教材原文或官方答案。
   仅用于验证「阅读训练」功能。正式材料请用「设置 → 批量导入」导入。
   数据结构分离：ARTICLES（正文+生词+长难句+结构） / QUESTIONS（题干+选项）
                 / ANSWER_KEYS（答案+定位+正误解析）
   ============================================================ */
export const READING_META = {
  contentLabel: 'ai', labelText: '演示文章·AI生成',
  disclaimer: '演示示例，非真题、非教材原文、非官方答案。'
};

export const ARTICLES = [
  {
    id: 'r1', title: 'The Four-Day Workweek: Promise and Practice',
    topic: '经济与管理', level: '演示·中等', minutes: 9,
    paragraphs: [
      { no:1, text:'In recent years a shorter working week has moved from a fringe idea to a serious management proposal. Supporters argue that compressing the same workload into four days forces organisations to remove low-value meetings, clarify priorities and automate routine reporting. Critics reply that output cannot simply be preserved by removing a day, especially in labour-intensive services where presence itself is the product.' },
      { no:2, text:'A trial involving several dozen firms coordinated by a research group in 2022 reported that most participating companies chose to keep the four-day arrangement after the pilot ended. Employees described lower fatigue and a sharper boundary between work and personal time. Yet the sample was small, the firms volunteered to take part, and nearly all were office-based knowledge businesses. Such conditions make generalisation hazardous.' },
      { no:3, text:'The financial mechanism is not mysterious. If a firm can hold revenue steady while cutting meetings, duplication and rework, its cost per unit of output falls. But this depends on a prior investment in process design and on managers willing to give up direct control over how hours are spent. Where supervision is measured by time rather than results, the reform tends to stall.' },
      { no:4, text:'For policymakers the practical question is therefore less about the number of days than about measurement. Without agreed indicators of output, quality and customer impact, any comparison of schedules degenerates into anecdote. A shorter week may well be a useful experiment, but it is a test of an organisation\u2019s ability to define what it actually produces.' }
    ],
    gloss: [
      { word:'fringe', phonetic:'/frɪndʒ/', meaning:'a. 边缘的、非主流的', para:1 },
      { word:'compress', phonetic:'/kəmˈpres/', meaning:'v. 压缩', para:1 },
      { word:'labour-intensive', phonetic:'/ˈleɪbə ɪnˈtensɪv/', meaning:'a. 劳动密集型的', para:1 },
      { word:'generalisation', phonetic:'/ˌdʒenrəlaɪˈzeɪʃn/', meaning:'n. 推广、泛化', para:2 },
      { word:'duplication', phonetic:'/ˌdjuːplɪˈkeɪʃn/', meaning:'n. 重复、复制', para:3 },
      { word:'degenerates', phonetic:'/dɪˈdʒenəreɪts/', meaning:'v. 退化为、沦为', para:4 }
    ],
    sentences: [
      { para:1, text:'Supporters argue that compressing the same workload into four days forces organisations to remove low-value meetings, clarify priorities and automate routine reporting.',
        split:'主干：Supporters argue + that 宾语从句；从句主语 = 动名词短语 compressing…into four days；谓语 forces；宾语 organisations；宾补为三个并列不定式 remove / clarify / automate（to 省略）。',
        note:'注意 force sb to do 的并列不定式结构，是阅读中常见的「一主三谓」长句。' },
      { para:3, text:'If a firm can hold revenue steady while cutting meetings, duplication and rework, its cost per unit of output falls.',
        split:'主干：its cost … falls；If 引导条件从句；while cutting 为省略了 it is 的时间状语；hold revenue steady 为「hold + 宾语 + 形容词宾补」。',
        note:'hold sth + adj. 是高频表达，意为「使…保持某种状态」。' }
    ],
    structure: {
      thesis:'缩短工作周的价值取决于组织能否先定义并衡量产出，而非单纯减少天数。',
      outline:['第1段：提出争议（支持方 vs 反对方）','第2段：引述试验及其样本局限','第3段：解释成本机制与前提条件','第4段：归结到「衡量指标」这一政策核心'],
      tone:'客观分析、有限肯定，包含明显的让步与限定（Yet / Such conditions / may well）。'
    }
  },
  {
    id: 'r2', title: 'Why Small Urban Green Spaces Matter',
    topic: '社会与环境', level: '演示·中等', minutes: 9,
    paragraphs: [
      { no:1, text:'City planners have long favoured large flagship parks, partly because they are easier to map, fund and celebrate. A growing body of research, however, suggests that small patches of greenery distributed across ordinary streets may deliver more everyday benefit per hectare than a single distant destination.' },
      { no:2, text:'The reason is proximity. A park that requires a twenty-minute bus ride is visited mainly at weekends, whereas a pocket garden on the walk to a shop is passed several times a week. Repeated low-intensity contact appears to matter more for stress recovery than occasional long visits, though researchers caution that the evidence is largely correlational.' },
      { no:3, text:'Small sites also change how residents use a neighbourhood. Where a vacant lot becomes a planted courtyard, people tend to slow down, stop and talk to one another. This « incidental sociability » is difficult to capture in standard transport or land-value models, which is precisely why it is often omitted from cost-benefit calculations.' },
      { no:4, text:'None of this argues against big parks. Rather, it suggests that a portfolio approach is wiser: protect the large sites for recreation and ecology, while treating scattered small plots as everyday infrastructure. The planning challenge is administrative as much as horticultural, because small parcels usually sit with several different owners.' }
    ],
    gloss: [
      { word:'flagship', phonetic:'/ˈflæɡʃɪp/', meaning:'a. 标志性的、旗舰的', para:1 },
      { word:'hectare', phonetic:'/ˈhekteə(r)/', meaning:'n. 公顷', para:1 },
      { word:'proximity', phonetic:'/prɒkˈsɪməti/', meaning:'n. 邻近、接近', para:2 },
      { word:'correlational', phonetic:'/ˌkɒrəˈleɪʃənl/', meaning:'a. 相关性的（非因果）', para:2 },
      { word:'incidental', phonetic:'/ˌɪnsɪˈdentl/', meaning:'a. 附带的、偶发的', para:3 },
      { word:'horticultural', phonetic:'/ˌhɔːtɪˈkʌltʃərəl/', meaning:'a. 园艺的', para:4 }
    ],
    sentences: [
      { para:2, text:'A park that requires a twenty-minute bus ride is visited mainly at weekends, whereas a pocket garden on the walk to a shop is passed several times a week.',
        split:'并列对比句：A park + that 定语从句 + is visited；whereas 引导对比分句；a pocket garden + 后置定语 on the walk to a shop + is passed。',
        note:'whereas 表对比转折，是判断作者态度的信号词；两个被动语态均隐去施动者，强调「被使用频率」。' },
      { para:3, text:'This incidental sociability is difficult to capture in standard transport or land-value models, which is precisely why it is often omitted from cost-benefit calculations.',
        split:'主干：This … sociability is difficult to capture；which 引导非限制性定语从句指代整句；why 引导表语从句。',
        note:'which 指代前件整句是英译汉常考结构，通常译为「这也就是为什么…」。' }
    ],
    structure: {
      thesis:'小型分散绿地因「可达性」带来高频日常收益，规划上应与大型公园组合配置而非二选一。',
      outline:['第1段：反常识提出观点（小绿地单位面积收益更高）','第2段：解释机制——邻近性与重复接触','第3段：补充社会效益及其难以量化','第4段：结论——组合式配置与行政难题'],
      tone:'温和论证、以限定语保持严谨（appears to / though / None of this argues against）。'
    }
  }
];

/* 题干与选项：不含答案 */
export const QUESTIONS = {
  r1: [
    { id:'r1q1', type:'single', tag:'细节题', stem:'According to Paragraph 1, what do supporters claim a four-day week forces firms to do?',
      options:['Hire additional staff for customer service','Cut low-value meetings and clarify priorities','Extend daily opening hours to clients','Shift more work to labour-intensive units'] },
    { id:'r1q2', type:'single', tag:'推理题', stem:'The author mentions that the trial firms "volunteered to take part" mainly to ___.',
      options:['praise the firms\u2019 commitment to reform','show why the results may not apply broadly','argue that the pilot lasted too long','explain how the sample was funded'] },
    { id:'r1q3', type:'single', tag:'词义题', stem:'In Paragraph 3, "the reform tends to stall" is closest in meaning to ___.',
      options:['the reform spreads very quickly','the reform is formally cancelled','the reform comes to a stop or slows down','the reform becomes more expensive'] },
    { id:'r1q4', type:'single', tag:'主旨题', stem:'Which statement best captures the author\u2019s conclusion?',
      options:['A four-day week should be adopted by all industries immediately','Output measurement matters more than the number of working days','Large firms benefit more than small ones from shorter weeks','Employee fatigue is the only reliable indicator of reform success'] }
  ],
  r2: [
    { id:'r2q1', type:'single', tag:'细节题', stem:'Why have planners traditionally preferred large parks, according to Paragraph 1?',
      options:['They are simpler to plan, finance and publicise','They recover stress more effectively','They require fewer owners to coordinate','They generate higher land values nearby'] },
    { id:'r2q2', type:'single', tag:'细节题', stem:'The "proximity" argument in Paragraph 2 rests on the idea that ___.',
      options:['long visits are more restorative than short ones','frequent brief exposure may matter more than rare long visits','bus journeys add to weekend stress','pocket gardens are cheaper to build than large parks'] },
    { id:'r2q3', type:'single', tag:'推理题', stem:'It can be inferred that incidental sociability is often left out of cost-benefit calculations because ___.',
      options:['it has been proven to be economically trivial','residents rarely talk in planted courtyards','standard models are not designed to measure it','transport agencies forbid such estimates'] },
    { id:'r2q4', type:'single', tag:'态度题', stem:'The author\u2019s attitude towards large flagship parks is ___.',
      options:['strongly critical','cautiously complementary','entirely indifferent','unreservedly enthusiastic'] }
  ]
};

/* 答案、定位、正确选项解析、错误选项分析：与题目分离存储 */
export const ANSWER_KEYS = {
  r1: {
    r1q1:{ answer:1, location:'第 1 段第 2 句（Supporters argue that…）', knowledge:'细节定位 / 并列不定式',
      correct:'原文明确说压缩工时会迫使组织 remove low-value meetings, clarify priorities and automate routine reporting，与 B 完全对应。',
      wrong:['A：原文未提增聘客服人员，属无中生有。','C：原文未提延长营业时间。','D：劳动密集型行业在第 1 段末作为反方论据出现，不是支持方主张。'] },
    r1q2:{ answer:1, location:'第 2 段第 3 句（Yet the sample was small…）', knowledge:'推理判断 / 样本局限',
      correct:'作者用 Yet 引出三项局限，紧接着说 Such conditions make generalisation hazardous，说明「自愿参加」是为了提示结论不可随意推广。',
      wrong:['A：语境是限定而非赞扬。','C：原文未讨论试点时长。','D：原文未说明经费来源。'] },
    r1q3:{ answer:2, location:'第 3 段末句', knowledge:'词义猜测 / 语境推断',
      correct:'stall 本义「熄火、停滞」，前文说改革依赖流程投入与放权，缺乏条件时自然「推进不下去」，故选 C。',
      wrong:['A：与 stall 语义相反。','B：stall 不等于被正式取消。','D：原文未涉及成本上升。'] },
    r1q4:{ answer:1, location:'第 4 段（For policymakers…）', knowledge:'主旨大意',
      correct:'末段明确 the practical question is less about the number of days than about measurement，末句进一步收束到「定义产出」，对应 B。',
      wrong:['A：作者态度谨慎，且强调条件，未主张立即全面推行。','C：原文未比较企业规模。','D：疲劳只在第 2 段作为员工反馈出现，不是结论。'] }
  },
  r2: {
    r2q1:{ answer:0, location:'第 1 段第 1 句', knowledge:'细节定位 / 因果',
      correct:'because they are easier to map, fund and celebrate 与 A「更易规划、筹资与宣传」同义替换。',
      wrong:['B：压力恢复是第 2 段内容，且指向小绿地。','C：多业主协调是第 4 段提到的「小地块」难题。','D：地价并非原文给出的偏好原因。'] },
    r2q2:{ answer:1, location:'第 2 段第 3 句', knowledge:'细节理解 / 对比',
      correct:'Repeated low-intensity contact appears to matter more … than occasional long visits 直接支持 B。',
      wrong:['A：与原文比较方向相反。','C：通勤只是说明「远」的例子，不是论点。','D：成本比较原文未涉及。'] },
    r2q3:{ answer:2, location:'第 3 段末句', knowledge:'推理判断',
      correct:'原文说该效益 difficult to capture in standard … models, which is precisely why it is often omitted，即模型测不了所以被略去。',
      wrong:['A：作者并未证明其经济上微不足道。','B：与原文「人们会停下来交谈」相反。','D：原文没有提到机构禁止。'] },
    r2q4:{ answer:1, location:'第 4 段第 1 句（None of this argues against big parks）', knowledge:'态度判断',
      correct:'作者先否定「反对大公园」的解读，再提出 portfolio approach 组合配置，属「审慎但互补」的肯定。',
      wrong:['A：与首句直接冲突。','C：作者明确讨论了大型公园的作用。','D：complementary 不等于无条件热烈支持，且全文有大量限定语。'] }
  }
};
