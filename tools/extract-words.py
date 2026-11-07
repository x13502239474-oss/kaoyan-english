# -*- coding: utf-8 -*-
"""
从用户提供的《英语二2010-2021全部词汇.docx》自动抽取「英文词形 + 年份」清单。
- 只读源文件，不修改、不移动、不删除任何个人文件
- 输出 data/words.corpus.js（ES module）
- 结果仅含词形与出现年份，不含音标/释义；明确标注为自动抽取、非官方权威词表
用法: python tools/extract-words.py
"""
import zipfile, re, html, os, json, collections, datetime, sys

SRC = r'D:/图片/考研/英语二/英语二2010-2021全部词汇.docx'
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, '..', 'data', 'words.corpus.js'))

# 功能词 + OCR/排版噪声（不进入词表）
STOP = set('''
the a an and or but for from into onto of to in on at by with without within as is are was were be been being
this that these those it its they them their he she his her we our you your i me my one ones one's
not no nor yet so if then than there here when where which who whom whose what how why all any some each every
can could may might must shall should will would do does did done have has had having
out up down off over under again more most less least very much many few own same other another such
make made making take took taken give gave given get got keep kept set put pay paid run ran go went come came
say said see saw seem seemed become became become hold held bring brought find found think thought know knew
part section text textl texts chapter item note notes tpyf cal sth sb etc eg ie vs via per
v n a ad adv prep conj pron num int vt vi aux art abbr adj pl sing u c uncountable countable
bull run auction house bid fetch noten pay lack bottom away current late
'''.split())

BAD_PREFIX = ('text', 'tpyf', 'wps', 'xml', 'http', 'www')


def read_lines(path):
    d = zipfile.ZipFile(path).read('word/document.xml').decode('utf-8', 'ignore')
    paras = re.findall(r'<w:p[ >].*?</w:p>', d, re.S)
    out = []
    for para in paras:
        t = ''.join(re.findall(r'<w:t[^>]*>(.*?)</w:t>', para, re.S))
        t = html.unescape(t).strip()
        # 丢弃混入的 XML 属性残片
        if t and '<w:' not in t and 'w:val' not in t and 'w:pos' not in t:
            out.append(t)
    return out


def main():
    if not os.path.exists(SRC):
        print('[跳过] 未找到源资料:', SRC)
        print('        已保留现有 data/words.corpus.js，不做改动。')
        return 0
    lines = read_lines(SRC)
    print('有效文本行:', len(lines))

    # 按年份切段（年份标记行形如「皆 2010」「砂 2011」，很短）
    segments = []
    cur_year, buf = None, []
    for line in lines:
        m = re.search(r'\b(20(?:1[0-9]|2[01]))\b', line)
        if m and len(line) <= 14:
            if cur_year and buf:
                segments.append((cur_year, buf))
            cur_year, buf = m.group(1), []
        elif cur_year:
            buf.append(line)
    if cur_year and buf:
        segments.append((cur_year, buf))
    print('年份段:', ', '.join(y for y, _ in segments))

    by_year = {}
    occur = collections.defaultdict(list)   # word -> [year,...]
    count = collections.Counter()
    for year, seg in segments:
        seen = set()
        for line in seg:
            for raw in re.findall(r"[A-Za-z][A-Za-z'-]{1,}", line):
                w = raw.lower().strip("-'")
                if len(w) < 3 or len(w) > 20 or w in STOP:
                    continue
                if w.startswith(BAD_PREFIX) or not re.fullmatch(r"[a-z][a-z'-]*", w):
                    continue
                if w.endswith("'s") or "'" in w:
                    w = w.split("'")[0]
                    if len(w) < 3:
                        continue
                count[w] += 1
                if w not in seen:
                    seen.add(w)
                    occur[w].append(year)
        by_year[year] = sorted(seen)

    words = []
    for w, yrs in occur.items():
        uniq = sorted(set(yrs))
        tier = 'high' if len(uniq) >= 3 else ('mid' if len(uniq) == 2 else 'low')
        words.append({'w': w, 'freq': count[w], 'years': uniq, 'tier': tier})
    words.sort(key=lambda x: (-len(x['years']), -x['freq'], x['w']))

    meta = {
        'source': '英语二2010-2021全部词汇.docx（用户提供的个人学习资料）',
        'extractedAt': datetime.date.today().isoformat(),
        'method': '从 docx 的 word/document.xml 自动抽取英文词形并按年份归组',
        'contentLabel': 'user',
        'labelText': '用户资料·自动抽取',
        'disclaimer': ('源文档为排版后的 OCR 文本，单词与释义分离，故本清单【仅含英文词形与出现年份】，'
                       '不含音标、词性与中文释义；自动抽取可能残留噪声词条。'
                       '本清单不是官方大纲词表或权威词汇数据，请通过「批量导入」或卡片内「编辑词条」补全释义后使用。'),
        'yearCount': len(by_year),
        'wordCount': len(words)
    }

    body = (
        '/* 本文件由 tools/extract-words.py 自动生成，请勿手工编辑。\n'
        '   来源与免责说明见 CORPUS_META。重新抽取: python tools/extract-words.py */\n'
        "export const CORPUS_META = " + json.dumps(meta, ensure_ascii=False, indent=2) + ';\n\n'
        "export const CORPUS_BY_YEAR = " + json.dumps(by_year, ensure_ascii=False, indent=2) + ';\n\n'
        "export const CORPUS_WORDS = " + json.dumps(words, ensure_ascii=False) + ';\n'
    )
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write(body)
    print('已写出:', OUT)
    print('词数:', len(words), '| 高频(≥3年份):', sum(1 for x in words if x['tier'] == 'high'))
    return 0


if __name__ == '__main__':
    sys.exit(main())
