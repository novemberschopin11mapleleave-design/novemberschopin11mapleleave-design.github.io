(() => {
  const $ = s => document.querySelector(s);
  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
  const reg = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const source = $("#source");
  const polished = $("#polished");
  const feedback = $("#feedback");
  const status = $("#status");
  let lastPolished = "";
  let timer = null;

  const GRAMMAR = [
    { re: /\bstudent should\b/gi, to: "students should", type: "主谓一致", pattern: "plural subject + base verb", why: "这里指学生群体，student 用复数 students。" },
    { re: /\bstudent will\b/gi, to: "students will", type: "主谓一致", pattern: "plural subject + modal", why: "泛指学生，用 students。" },
    { re: /\bteacher teach\b/gi, to: "teachers teach", type: "主谓一致", pattern: "plural subject + base verb", why: "泛指老师，用 teachers；动词保持原形。" },
    { re: /\bteach student\b/gi, to: "teach students", type: "单复数", pattern: "verb + plural object", why: "teach 的宾语是学生群体，用 students。" },
    { re: /\bhomeworks\b/gi, to: "homework", type: "不可数名词", pattern: "uncountable noun", why: "homework 不可数，不加 s。" },
    { re: /\bgood grade\b/gi, to: "good grades", type: "单复数", pattern: "plural countable noun", why: "泛指成绩，grade 用复数。" },
    { re: /\bcopy answer\b/gi, to: "copy answers", type: "单复数", pattern: "plural object", why: "copy 的宾语是多个答案，用 answers。" },
    { re: /\bask teacher\b/gi, to: "ask teachers", type: "单复数", pattern: "verb + plural object", why: "泛指老师，用 teachers。" },
    { re: /\bhave difficult in\b/gi, to: "have difficulty with", type: "搭配", pattern: "have difficulty with + noun", why: "difficulty 是名词，搭配 with。" },
    { re: /\bForm 5 student\b/gi, to: "Form 5 students", type: "单复数", pattern: "plural noun", why: "指一群中五学生，用复数。" },
    { re: /\bschool should\b/gi, to: "schools should", type: "主谓一致", pattern: "plural subject + modal", why: "泛指学校，用 schools。" },
    { re: /\bIf teacher\b/gi, to: "If teachers", type: "主谓一致", pattern: "plural subject", why: "条件句里泛指老师，用 teachers。" }
  ];

  const VOCAB = [
    { re: /\bvery important\b/gi, to: "crucial", type: "替换", why: "very important 太泛；crucial 更具体、更正式。" },
    { re: /\bI think\b/g, to: "I believe", type: "语气", why: "议论文里 I believe / In my view 比 I think 正式。" },
    { re: /\bbad\b/gi, to: "harmful", type: "替换", why: "bad 太笼统；harmful 说明「有害」。" },
    { re: /\bgood reason\b/gi, to: "valid reason", type: "搭配", why: "valid reason 是更自然的搭配。" },
    { re: /\bsome people\b/gi, to: "some individuals", type: "替换", why: "individuals 比 people 更正式。" },
    { re: /\ba lot of\b/gi, to: "considerable", type: "替换", why: "a lot of 偏口语；considerable 更适合书面语。" },
    { re: /\bget good grades\b/gi, to: "receive good grades", type: "搭配", why: "receive grades 是更正式的搭配。" },
    { re: /\bthings\b/gi, to: "issues", type: "替换", why: "things 太泛；issues 更具体。" },
    { re: /\bmany\b/gi, to: "numerous", type: "替换", why: "numerous 比 many 正式。" }
  ];

  const STYLE_RULES = {
    academic: [
      { re: /\bIn my opinion, this is not a good reason\b/gi, to: "In my opinion, this objection does not hold up", type: "句式", why: "用 objection / hold up 替代 good reason，论证更清楚。" },
      { re: /\bAI is very important in our life\b/gi, to: "AI plays a pivotal role in our life", type: "句式", why: "把 be + very important 换成动词短语，句子更有力。" },
      { re: /\bsome people (think|believe|say)( that)?\b/gi, to: "critics argue that", type: "句式", why: "把 some people think 改成更具体的批评者立场。" },
      { re: /\bThey say( that)?\b/gi, to: "They contend that", type: "句式", why: "contend 比 say 更适合议论文。" },
      { re: /\bI think\b/gi, to: "I would argue", type: "语气", why: "I would argue 比 I think 更有论证感。" },
      { re: /\bis very important\b/gi, to: "plays a pivotal role", type: "句式", why: "把 be + very important 换成动词短语，句子更有力。" },
      { re: /\bhas a big effect on\b/gi, to: "leaves a profound mark on", type: "句式", why: "把 have a big effect 换成更具体的动词短语。" },
      { re: /\bThis is not a good reason\b/gi, to: "This objection does not hold up", type: "句式", why: "用 objection / hold up 替代 good reason，论证更清楚。" },
      { re: /\bWe should use it carefully\b/gi, to: "It should be handled with care", type: "句式", why: "被动 + 名词化，语气更正式。" },
      { re: /\bAI is a tool, not a replacement\b/gi, to: "AI is a tool, not a substitute for judgement", type: "句式", why: "substitute for judgement 比 replacement 更具体。" },
      { re: /\bcan help them\b/gi, to: "can enable them to", type: "句式", why: "enable sb to do 比 help sb do 更正式。" }
    ],
    rhetorical: [
      { re: /\bIn my opinion, this is not a good reason\b/gi, to: "In my opinion, this objection is a house of cards", type: "修辞", why: "a house of cards 表示论证站不住脚；适合反驳。" },
      { re: /\bAI is very important in our life\b/gi, to: "AI has become part of everyday life", type: "修辞", why: "比 very important 具体，但不过度比喻。" },
      { re: /\bsome people (think|believe|say)( that)?\b/gi, to: "sceptics paint a grim picture, arguing that", type: "修辞", why: "paint a grim picture 是形象化说法，适合描述负面立场；不要每段都用。" },
      { re: /\bThey say( that)?\b/gi, to: "They contend that", type: "句式", why: "contend 比 say 更适合议论文。" },
      { re: /\bI think\b/gi, to: "I would argue", type: "语气", why: "I would argue 比 I think 更有论证感。" },
      { re: /\bAI is bad\b/gi, to: "AI casts a long shadow", type: "修辞", why: "casts a long shadow 表示长期负面影响；语气较强。" },
      { re: /\bThis is not a good reason\b/gi, to: "This objection is a house of cards", type: "修辞", why: "a house of cards 表示论证站不住脚；适合反驳。" },
      { re: /\bWe should use it carefully\b/gi, to: "It should be handled with care", type: "句式", why: "比 use it carefully 更正式。" },
      { re: /\bAI is a tool, not a replacement\b/gi, to: "AI is a double-edged tool, not a substitute for judgement", type: "修辞", why: "double-edged 与 substitute 并用，比单纯 replacement 更有画面。" },
      { re: /\bcan help them\b/gi, to: "can enable them to", type: "句式", why: "enable sb to do 比 help sb do 更正式。" }
    ]
  };

  const RHETORIC_BANK = [
    { phrase: "paint a grim picture", use: "描述负面现状/对方立场", ex: "Critics paint a grim picture of AI in schools." },
    { phrase: "a double-edged sword", use: "利弊并存", ex: "AI is a double-edged sword: it saves time but can weaken judgement." },
    { phrase: "the tip of the iceberg", use: "问题只是冰山一角", ex: "One late assignment is only the tip of the iceberg." },
    { phrase: "a stepping stone", use: "过渡/机会", ex: "Part-time work can be a stepping stone to a career." },
    { phrase: "casts a long shadow", use: "长期负面影响", ex: "The policy still casts a long shadow over students." }
  ];

  const GENRE_HINTS = {
    article: { title: "DSE 文体 · Article", tmpl: "Headline + hook + 2–3 body paragraphs + takeaway", ex: "Have you ever wondered who checks AI's answers? This article argues that students should.", why: "Article 要有标题/开头钩子，结尾给读者一个 takeaway。" },
    letter: { title: "DSE 文体 · Letter to the Editor", tmpl: "Dear Editor, ... I am writing to ... Yours faithfully,", ex: "I am writing to raise concerns about the new homework policy.", why: "开头说明目的，结尾重申诉求；语气正式但不僵硬。" },
    proposal: { title: "DSE 文体 · Proposal", tmpl: "The purpose of this proposal is to ... / Need → Plan → Benefits", ex: "The purpose of this proposal is to suggest a peer-tutoring scheme.", why: "Proposal 要清楚分「需要 / 方案 / 好处」，不要写成议论文。" },
    report: { title: "DSE 文体 · Report", tmpl: "Introduction → Findings → Conclusion / Recommendations", ex: "This report examines attendance in Form 4 and recommends a shorter morning break.", why: "Report 用标题分节，事实先行，建议放最后。" },
    speech: { title: "DSE 文体 · Speech", tmpl: "Good morning, everyone. Today I want to ...", ex: "Good morning, everyone. Today I want to talk about why we should read beyond the textbook.", why: "Speech 要有称呼、直接对听众说话，句子可以短一些。" },
    blog: { title: "DSE 文体 · Blog", tmpl: "Catchy title + personal voice + short paragraphs", ex: "Three things I wish I had known before my first DSE mock.", why: "Blog 可以有个人语气，但仍要有一个清楚的中心。" },
    email: { title: "DSE 文体 · Email", tmpl: "Dear ..., I am writing to ... Best regards,", ex: "Dear Mr Chan, I am writing to ask whether the deadline can be extended.", why: "Email 要有称呼、目的、请求/行动，结尾礼貌。" }
  };

  const PARAPHRASE = [
    { cat: "开头", from: "Nowadays", to: ["In recent years", "In today's world", "Over the past decade"], why: "时间状语开头，换说法避免重复。" },
    { cat: "开头", from: "In my opinion", to: ["From my perspective", "I would argue", "It seems to me"], why: "立场句，比 In my opinion 更有变化。" },
    { cat: "转折", from: "However", to: ["Nevertheless", "That said", "Even so"], why: "转折；后两个更口语一点。" },
    { cat: "转折", from: "but", to: ["yet", "although", "while"], why: "句内转折，注意后面接从句还是并列句。" },
    { cat: "因果", from: "because of", to: ["owing to", "due to", "as a result of"], why: "因果短语，后面接名词。" },
    { cat: "因果", from: "so", to: ["therefore", "consequently", "as a result"], why: "结果；therefore 放句中更正式。" },
    { cat: "举例", from: "For example", to: ["For instance", "A case in point is", "To illustrate"], why: "举例；A case in point is 后面接名词。" },
    { cat: "递进", from: "Also", to: ["In addition", "Moreover", "What is more"], why: "递进，不要每段都用。" },
    { cat: "结尾", from: "In conclusion", to: ["To sum up", "Overall", "For these reasons"], why: "收束；For these reasons 更贴论证。" },
    { cat: "观点", from: "I think", to: ["I believe", "In my view", "I would argue"], why: "立场；I would argue 更有论证感。" },
    { cat: "观点", from: "some people think", to: ["critics argue", "sceptics contend", "some observers believe"], why: "转述他方立场。" },
    { cat: "程度", from: "very important", to: ["crucial", "pivotal", "play a key role"], why: "重要性；play a key role 需要接 in。" },
    { cat: "程度", from: "a lot of", to: ["considerable", "a wide range of", "numerous"], why: "数量；注意后面接可数还是不可数。" },
    { cat: "评价", from: "good", to: ["beneficial", "effective", "valuable"], why: "评价；按语境选，不要一律换。" },
    { cat: "评价", from: "bad", to: ["harmful", "damaging", "detrimental"], why: "评价；detrimental 常接 to。" },
    { cat: "展示", from: "This shows", to: ["This suggests", "This illustrates", "This indicates"], why: "推进论证；suggests 比 shows 留有余地。" },
    { cat: "时间", from: "later", to: ["subsequently", "afterwards", "in the following years"], why: "时间过渡。" },
    { cat: "举例", from: "such as", to: ["including", "for instance", "ranging from ... to ..."], why: "举例；ranging from 适合范围。" }
  ];

  function apply(text, rules, kind) {
    let out = text;
    const changes = [];
    for (const r of rules) {
      out = out.replace(r.re, m => {
        let fix = typeof r.to === "function" ? r.to(m) : r.to;
        if (m[0] === m[0].toUpperCase() && fix[0] === fix[0].toLowerCase()) {
          fix = fix[0].toUpperCase() + fix.slice(1);
        }
        changes.push({ kind, quote: m, fix, type: r.type, why: r.why, pattern: r.pattern });
        return fix;
      });
    }
    return { out, changes };
  }

  function suggestPatterns(text) {
    const out = [];
    if (/\bI think\b/i.test(text)) {
      out.push({ title: "立场句", tmpl: "I believe / In my view + clause", ex: "I believe students should use AI for homework.", why: "比 I think 正式，适合议论文。" });
    }
    if (!/(in conclusion|to sum up|overall|for these reasons|in short)/i.test(text)) {
      out.push({ title: "结尾收束 C1", tmpl: "For these reasons, ... remains ...", ex: "For these reasons, teaching judgement remains the more practical choice.", why: "原文结尾停在建议上，没有把立场收回来。" });
    }
    if (/(however|but)/i.test(text)) {
      out.push({ title: "让步", tmpl: "Although ..., ...", ex: "Although AI is fast, it can still be wrong.", why: "先承认对方最强的一点，再给回应。" });
    }
    if (/AI is a tool, not a replacement/i.test(text)) {
      out.push({ title: "对比定义", tmpl: "X is not Y but Z", ex: "AI is not a replacement for thinking but a tool for checking it.", why: "把「不是…而是…」写成一句，立场更清楚。" });
    }
    if (out.length < 3) {
      out.push({ title: "举例 E2", tmpl: "Consider a student who ...", ex: "Consider a student who checks one grammar point and rewrites the sentence.", why: "给一个具体场景，代替泛泛的判断。" });
    }
    return out.slice(0, 4);
  }

  function mark(text, changes) {
    let html = esc(text);
    const seen = new Set();
    for (const c of changes) {
      if (!c.fix || seen.has(c.fix)) continue;
      seen.add(c.fix);
      const cls = c.kind === "grammar" ? "fix" : c.kind === "ai" ? "ai" : "up";
      html = html.replace(new RegExp(reg(esc(c.fix)), "g"), `<mark class="${cls}">${esc(c.fix)}</mark>`);
    }
    return html.split(/\n\s*\n/).map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");
  }

  function row(c) {
    const tag = c.type ? `<span class="tag">${esc(c.type)}</span>` : "";
    const why = `${c.why || ""}${c.pattern ? " · " + c.pattern : ""}`;
    return `<li class="fb-row">${tag}<code>${esc(c.quote)}</code><span class="arrow">→</span><code>${esc(c.fix)}</code><span class="why">${esc(why)}</span></li>`;
  }

  let paraRows = [];

  function renderParaphrase(text) {
    const lower = text.toLowerCase();
    const found = PARAPHRASE.filter(p => lower.includes(p.from.toLowerCase()));
    paraRows = found.length ? found : PARAPHRASE.slice(0, 10);
    const title = found.length ? "你文中的替换" : "常用替换";
    $("#paraphrase").innerHTML = `<section class="fb-block"><h3>${title} <span>${paraRows.length}</span></h3><div class="fb-list">${paraRows.map((p, i) => `<div class="para-row">
      <div class="para-from"><code>${esc(p.from)}</code><span>${esc(p.cat)}</span></div>
      <div class="chips">${p.to.map(t => `<button class="chip" data-copy="${esc(t)}">${esc(t)}</button>`).join("")}</div>
      <div class="para-why">${esc(p.why)}</div>
      <button class="save-word" data-save="${i}">+ 加入我的词库</button>
    </div>`).join("")}</div></section>`;
  }

  function saveWord(p) {
    const KEY = "wl-profile-v1";
    let prof = null;
    try { prof = JSON.parse(localStorage.getItem(KEY) || "null"); } catch {}
    if (!prof) {
      status.textContent = "先到「我的词库」创建本地档案";
      return;
    }
    if (!Array.isArray(prof.words)) prof.words = [];
    if (!prof.words.some(w => w.from === p.from)) {
      prof.words.push({ from: p.from, to: p.to, cat: p.cat, learned: false, added: Date.now() });
      localStorage.setItem(KEY, JSON.stringify(prof));
      status.textContent = `已加入我的词库：${p.from}`;
    } else {
      status.textContent = `词库里已有：${p.from}`;
    }
    setTimeout(() => { status.textContent = ""; }, 1800);
  }

  // ── AI 精批（Key 在服务端；前端只调同源 /api/ai，用户无感）
  let aiData = null;      // reserved for a future LLM layer
  let AI_AVAILABLE = false; // this portfolio demo is rules-only
  let aiSeq = 0;
  let aiTimer = null;

  async function probeAI() {
    try {
      const r = await fetch("/api/health", { cache: "no-store" });
      const j = await r.json();
      AI_AVAILABLE = Boolean(j && j.ai);
    } catch { AI_AVAILABLE = false; }
  }

  async function runAI(text) {
    const seq = ++aiSeq;
    if (status) status.textContent = "AI 精批中…";
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "mark",
          text,
          genre: $("#genre").value,
          level: $("#style").value
        })
      });
      const data = await res.json();
      if (seq !== aiSeq) return;
      if (!data || data.ok === false) {
        aiData = null;
        if (status) status.textContent = data && data.kind === "risk"
          ? "这段触发内容审核，AI 已跳过，改用规则批改"
          : "AI 暂时不可用，使用规则批改";
        render();
        return;
      }
      aiData = { items: data.items || [], overall: data.overall || "", polished: data.polished || "", forText: text };
      if (status) status.textContent = `AI 精批：${aiData.items.length} 条建议`;
      render();
    } catch {
      if (seq !== aiSeq) return;
      aiData = null;
      if (status) status.textContent = "AI 不可用，使用规则批改";
      render();
    }
  }
  function render() {
    const text = source.value;
    const level = $("#style").value;
    const aiReady = Boolean(aiData && aiData.forText === text && aiData.items && aiData.items.length);
    let out, changes, s, aiChanges = [];

    if (aiReady) {
      // AI 在后台逐词过完、直接给整篇改后版本；items 只用来做说明和高亮
      aiChanges = aiData.items.map(it => ({ kind: "ai", quote: it.quote, fix: it.rewrite, type: it.type, why: it.why }));
      if (aiData.polished) {
        out = aiData.polished;
        changes = aiChanges;
      } else {
        out = text;
        for (const it of aiData.items) {
          const at = out.indexOf(it.quote);
          if (at === -1) continue;
          out = out.slice(0, at) + it.rewrite + out.slice(at + it.quote.length);
        }
        const g2 = apply(out, GRAMMAR, "grammar");
        out = g2.out;
        changes = [...aiChanges, ...g2.changes];
      }
      s = { changes: [] };
    } else {
      const g = apply(text, GRAMMAR, "grammar");
      s = apply(g.out, STYLE_RULES[level] || [], "style");
      const v = apply(s.out, VOCAB, "vocab");
      changes = [...g.changes, ...s.changes, ...v.changes];
      out = v.out;
    }
    lastPolished = out;
    polished.innerHTML = text.trim() ? mark(out, [...changes, ...aiChanges]) : `<p class="empty-note">左边贴一段作文，这里会出现真正改过的版本。</p>`;

    const hint = GENRE_HINTS[$("#genre").value];
    const patterns = text.trim() ? [...(hint ? [hint] : []), ...suggestPatterns(text)].slice(0, 4) : [];
    const blocks = [];
    if (aiChanges.length || (aiData && aiData.forText === text && aiData.overall)) {
      const rows = aiChanges.map(c => `<li class="fb-row"><span class="tag ai">AI</span><code>${esc(c.quote)}</code><span class="arrow">→</span><code>${esc(c.fix)}</code><span class="why">${esc(c.why || "")}</span></li>`).join("");
      const overall = aiData && aiData.forText === text && aiData.overall ? `<p class="ai-overall">${esc(aiData.overall)}</p>` : "";
      blocks.push(`<section class="fb-block ai-block"><h3>AI 精批 <span>${aiChanges.length}</span></h3>${overall}${rows ? `<ul class="fb-list">${rows}</ul>` : ""}</section>`);
    }
    const grammarChanges = changes.filter(c => c.kind === "grammar");
    const styleChanges = changes.filter(c => c.kind === "style");
    const vocabChanges = changes.filter(c => c.kind === "vocab");
    if (grammarChanges.length) blocks.push(`<section class="fb-block"><h3>语法 Grammar <span>${grammarChanges.length}</span></h3><ul class="fb-list">${grammarChanges.map(row).join("")}</ul></section>`);
    if (styleChanges.length) blocks.push(`<section class="fb-block"><h3>句式改写 <span>${styleChanges.length}</span></h3><ul class="fb-list">${styleChanges.map(row).join("")}</ul></section>`);
    if (vocabChanges.length) blocks.push(`<section class="fb-block"><h3>替换词 <span>${vocabChanges.length}</span></h3><ul class="fb-list">${vocabChanges.map(row).join("")}</ul></section>`);
    if (patterns.length) blocks.push(`<section class="fb-block"><h3>DSE 句式</h3><div class="fb-list">${patterns.map(p => `<div class="pattern"><b>${esc(p.title)}</b><span class="tmpl">${esc(p.tmpl)}</span><span class="ex">${esc(p.ex)}</span><span class="why">${esc(p.why)}</span></div>`).join("")}</div></section>`);
    if (text.trim()) blocks.push(`<section class="fb-block"><h3>修辞表达 · 慎用</h3><div class="fb-list">${RHETORIC_BANK.map(p => `<div class="pattern"><b>${esc(p.phrase)}</b><span class="ex">${esc(p.ex)}</span><span class="why">${esc(p.use)}</span></div>`).join("")}</div></section>`);
    feedback.innerHTML = blocks.length ? blocks.join("") : `<div class="empty-note">没有发现可自动改的地方。可以先看右边的句式建议。</div>`;
    $("#changeCount").textContent = `${changes.length} 处改动`;
    const words = (text.match(/[A-Za-z][A-Za-z'-]*/g) || []).length;
    const paras = text.split(/\n\s*\n/).filter(p => p.trim()).length;
    $("#sourceMeta").textContent = `${words} words · ${paras} paragraphs`;
    renderParaphrase(text);
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(render, 220);
    clearTimeout(aiTimer);
    if (AI_AVAILABLE === false) return;
    const text = source.value;
    if (text.trim().length < 40) { aiData = null; return; }
    if (aiData && aiData.forText === text) return;
    aiTimer = setTimeout(() => runAI(text), 1100);
  }

  source.addEventListener("input", schedule);
  source.addEventListener("input", () => {
    try { localStorage.setItem("wl-marking-source-v1", source.value); } catch {}
  });
  $("#style").addEventListener("change", render);
  $("#genre").addEventListener("change", render);
  $("#paraphrase").addEventListener("click", e => {
    const chip = e.target.closest("[data-copy]");
    if (chip) { copy(chip.dataset.copy, "已复制：" + chip.dataset.copy); return; }
    const save = e.target.closest("[data-save]");
    if (save) {
      const p = paraRows[Number(save.dataset.save)];
      if (p) saveWord(p);
    }
  });
  $("#loadSample").addEventListener("click", () => { source.value = window.WL_MARKING.sample; render(); schedule(); status.textContent = "已载入 DSE 测试篇章"; });
  $("#clearAll").addEventListener("click", () => { source.value = ""; render(); status.textContent = ""; });

  function copy(text, okMsg) {
    if (!text) { status.textContent = "没有可复制的内容"; return; }
    const done = () => { status.textContent = okMsg; setTimeout(() => { status.textContent = ""; }, 1800); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallback());
    } else fallback();
    function fallback() {
      const t = document.createElement("textarea");
      t.value = text; document.body.appendChild(t); t.select();
      try { document.execCommand("copy"); done(); } catch { status.textContent = "复制失败"; }
      t.remove();
    }
  }

  $("#copyPolished").addEventListener("click", () => copy(lastPolished, "已复制 polished"));
  $("#copySample").addEventListener("click", () => copy(window.WL_MARKING.sample, "已复制测试篇章"));

  $("#sampleText").textContent = window.WL_MARKING.sample;
  source.value = window.WL_MARKING.sample;
  render();
  schedule();

  // ── 划词：点击任意单词 → 翻译 + 加入词库（前端演示；云端同步待接入，不落 localStorage）──
  const DICT = {
    "ai": "人工智能", "important": "重要的", "very": "非常", "students": "学生们",
    "student": "学生", "homework": "作业", "grades": "成绩", "grade": "成绩",
    "bad": "不好的", "good": "好的", "think": "认为", "copy": "抄袭 / 复制",
    "answers": "答案", "answer": "答案", "lazy": "懒惰的", "life": "生活",
    "lives": "生活", "use": "使用", "help": "帮助", "people": "人们",
    "crucial": "至关重要的", "pivotal": "关键的", "pressing": "紧迫的",
    "argue": "主张 / 论证", "concern": "担忧", "nowadays": "如今"
  };

  let wordPop = null;
  function closeWordPop() { if (wordPop) { wordPop.remove(); wordPop = null; } }

  function wordAtPoint(x, y) {
    if (document.caretRangeFromPoint) {
      const r = document.caretRangeFromPoint(x, y);
      if (r && r.startContainer.nodeType === 3) return { node: r.startContainer, offset: r.startOffset };
    }
    if (document.caretPositionFromPoint) {
      const p = document.caretPositionFromPoint(x, y);
      if (p && p.offsetNode && p.offsetNode.nodeType === 3) return { node: p.offsetNode, offset: p.offset };
    }
    return null;
  }

  function wordAround(node, offset) {
    const t = node.textContent;
    let s = offset, e = offset;
    while (s > 0 && /[A-Za-z'-]/.test(t[s - 1])) s--;
    while (e < t.length && /[A-Za-z'-]/.test(t[e])) e++;
    return t.slice(s, e);
  }

  function showWordPop(x, y, word) {
    closeWordPop();
    const trans = DICT[word.toLowerCase()] || "（演示）示例翻译";
    const pop = document.createElement("div");
    pop.className = "word-pop";
    pop.innerHTML = `
      <div class="wp-word">${esc(word)}</div>
      <div class="wp-trans">${esc(trans)}</div>
      <div class="wp-actions">
        <button class="primary" data-act="add">+ 加入词库</button>
        <button data-act="close">关闭</button>
      </div>`;
    document.body.appendChild(pop);
    const r = pop.getBoundingClientRect();
    pop.style.left = Math.min(x, window.innerWidth - r.width - 10) + "px";
    pop.style.top = Math.max(10, y - r.height - 12) + "px";
    pop.addEventListener("click", e => {
      const act = e.target.closest("button")?.dataset.act;
      if (act === "add") {
        status.textContent = `已加入词库「${word}」（演示 · 云端同步待接入）`;
        setTimeout(() => { if (status.textContent.includes("已加入词库")) status.textContent = ""; }, 2500);
        closeWordPop();
      } else if (act === "close") closeWordPop();
    });
    wordPop = pop;
  }

  polished.addEventListener("click", e => {
    if (e.target.closest("a")) return;
    const hit = wordAtPoint(e.clientX, e.clientY);
    if (!hit) return;
    const w = wordAround(hit.node, hit.offset);
    if (w && w.length > 1) showWordPop(e.clientX, e.clientY, w);
  });
  document.addEventListener("click", e => { if (wordPop && !wordPop.contains(e.target)) closeWordPop(); }, true);
})();
