#!/usr/bin/env node
// [인간] [삶] [목표] [목적] [꿈] 키워드 조사 — 인증 없이 쓸 수 있는 공개 API 만 사용.
//   - Hacker News (Algolia 공개 검색 API) 댓글
//   - Mastodon (mastodon.social 공개 해시태그 타임라인)
// 원문은 저장하지 않고 집계(빈도 · 연령대 · 카테고리)만 research/output/keywords.json 에 남긴다.
//
//   node research/collect-keywords.mjs
import { mkdirSync, writeFileSync } from 'node:fs';

const SEEDS = {
  human: { ko: '인간', hn: ['human needs', 'being human', 'human flourishing', 'what makes us human'], tags: ['humanity'] },
  life: { ko: '삶', hn: ['meaning of life', 'life goals', 'good life', 'in life I want'], tags: ['lifegoals', 'life'] },
  goal: { ko: '목표', hn: ['my goal is', 'goals for next year', 'career goals', 'bucket list'], tags: ['goals', 'bucketlist'] },
  purpose: { ko: '목적', hn: ['purpose in life', 'sense of purpose', 'my purpose', 'find meaning'], tags: ['purpose'] },
  dream: { ko: '꿈', hn: ['my dream', 'dream job', 'dream life', 'always dreamed'], tags: ['dreams'] },
};

// 앱의 11개 카테고리로 분류하기 위한 영어 키워드 사전 (src/categories/data.ts 의 id 와 동일)
const CATEGORY_WORDS = {
  health: ['health', 'healthy', 'fitness', 'exercise', 'gym', 'run', 'running', 'marathon', 'sleep', 'diet', 'weight', 'mental health', 'therapy', 'body', 'lift'],
  money: ['money', 'rich', 'wealth', 'salary', 'income', 'debt', 'invest', 'savings', 'retire', 'retirement', 'financial', 'financially', 'fire', 'mortgage', 'paid'],
  stability: ['house', 'home', 'apartment', 'stable', 'stability', 'security', 'secure', 'insurance', 'car', 'move to'],
  relationship: ['family', 'kids', 'children', 'wife', 'husband', 'partner', 'marriage', 'married', 'love', 'friends', 'friendship', 'parents', 'relationship'],
  network: ['community', 'network', 'networking', 'mentor', 'colleagues', 'belong', 'belonging', 'tribe', 'neighbors'],
  career: ['career', 'job', 'work', 'promotion', 'startup', 'company', 'business', 'founder', 'engineer', 'manager', 'boss', 'profession', 'skills'],
  recognition: ['famous', 'recognition', 'respect', 'status', 'prestige', 'reputation', 'known', 'award', 'success', 'successful', 'legacy'],
  growth: ['learn', 'learning', 'study', 'education', 'degree', 'read', 'books', 'language', 'skill', 'grow', 'growth', 'improve'],
  experience: ['travel', 'adventure', 'explore', 'hobby', 'music', 'art', 'write', 'writing', 'novel', 'build', 'create', 'craft', 'garden', 'fun'],
  mindset: ['happy', 'happiness', 'peace', 'meaning', 'meaningful', 'purpose', 'freedom', 'free time', 'content', 'balance', 'joy', 'calm', 'fulfillment'],
  contribution: ['help', 'helping', 'impact', 'world', 'society', 'give back', 'volunteer', 'charity', 'change the world', 'help others', 'make a difference'],
};

const STOP = new Set(`a an the and or but if then so to of in on at for with from by as is are was were be been being it its it's this that these those i me my mine we our you your he she they them their his her what which who whom when where why how all any both each few more most other some such no nor not only own same than too very can will just don't should now do does did doing have has had having would could i'm i've i'd you're there here into about over under again further once up down out off also get got make made like really much many one two lot lots thing things think know want wanted going go even still way well back time years year day people being something someone anything everything because while though since after before during through life goal goals purpose dream dreams human humans meaning that's doesn't isn't didn't can't won't need needs good see say said use used take better right actually may might find every without new point enough sure around etc first never always feel let put give lot also seems seem kind pretty probably maybe else rather instead least last next long different makes sense yes yeah able whole great true bit little part case fact means mean purposes https http www com org html net amp`.split(/\s+/));

const sleep = ms => new Promise(r => setTimeout(r, ms));
const strip = html => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&#x2F;/g, '/');

async function hn(query, pages = 3) {
  const out = [];
  for (let page = 0; page < pages; page++) {
    const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=comment&hitsPerPage=200&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) break;
    const json = await res.json();
    for (const h of json.hits) if (h.comment_text) out.push({ text: strip(h.comment_text), year: new Date(h.created_at).getFullYear() });
    if (page + 1 >= json.nbPages) break;
    await sleep(250);
  }
  return out;
}

async function mastodon(tag, pages = 5) {
  const out = [];
  let maxId = '';
  for (let i = 0; i < pages; i++) {
    const res = await fetch(`https://mastodon.social/api/v1/timelines/tag/${tag}?limit=40${maxId ? `&max_id=${maxId}` : ''}`);
    if (!res.ok) break;
    const posts = await res.json();
    if (!posts.length) break;
    for (const p of posts) {
      const text = strip(p.content);
      if ((p.tags?.length ?? 0) >= 8 || /chuffed\.org|wordpress\.com|gofundme/i.test(text)) continue;
      if (p.language && p.language !== 'en') continue;
      out.push({ text, year: new Date(p.created_at).getFullYear(), lang: p.language });
    }
    maxId = posts[posts.length - 1].id;
    await sleep(500);
  }
  return out;
}

// "I'm 34", "I am 28", "in my 30s", "at 45 I", "(31M)", "turning 40" → 연령대
function ageBand(text) {
  const t = text.toLowerCase();
  let m = t.match(/\bin my (twenties|thirties|forties|fifties|sixties|20s|30s|40s|50s|60s)\b/);
  if (m) {
    const w = { twenties: 20, thirties: 30, forties: 40, fifties: 50, sixties: 60 }[m[1]] ?? Number(m[1].slice(0, 2));
    return band(w);
  }
  m = t.match(/\b(?:i'm|i am|im|turning|turned|now) (\d{2})\b(?! ?(?:%|percent|hours|minutes|years ago|k\b))/) || t.match(/\((\d{2}) ?[mf]\)/) || t.match(/\b(\d{2}) ?(?:yo|y\/o|years old)\b/);
  if (m) {
    const n = Number(m[1]);
    if (n >= 18 && n <= 80) return band(n);
  }
  return null;
}
const band = n => (n < 30 ? '20s' : n < 40 ? '30s' : n < 50 ? '40s' : '50s');

function categorize(text) {
  const t = ` ${text.toLowerCase()} `;
  const hit = [];
  for (const [cat, words] of Object.entries(CATEGORY_WORDS)) {
    if (words.some(w => new RegExp(`\\b${w.replace(/ /g, '\\s+')}\\b`).test(t))) hit.push(cat);
  }
  return hit;
}

function tokens(text) {
  const words = text.toLowerCase().replace(/https?:\/\/\S+/g, ' ').match(/[a-z][a-z'-]{2,}/g) ?? [];
  const uni = words.filter(w => !STOP.has(w));
  const bi = [];
  for (let i = 0; i < words.length - 1; i++) {
    if (!STOP.has(words[i]) && !STOP.has(words[i + 1])) bi.push(`${words[i]} ${words[i + 1]}`);
  }
  return { uni, bi };
}

const inc = (m, k, n = 1) => m.set(k, (m.get(k) ?? 0) + n);
const top = (m, n) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);

const result = { generatedAt: new Date().toISOString(), sources: {}, seeds: {}, byAge: {}, totals: {} };
const ageCat = { '20s': new Map(), '30s': new Map(), '40s': new Map(), '50s': new Map() };
const ageCount = { '20s': 0, '30s': 0, '40s': 0, '50s': 0 };
const allCat = new Map();
let total = 0;

for (const [seed, cfg] of Object.entries(SEEDS)) {
  const docs = [];
  for (const q of cfg.hn) docs.push(...(await hn(q)).map(d => ({ ...d, src: 'hn' })));
  for (const tag of cfg.tags) docs.push(...(await mastodon(tag)).map(d => ({ ...d, src: 'mastodon' })));
  // 같은 글이 여러 검색어에 걸리면 한 번만
  const seen = new Set();
  const uniq = docs.filter(d => (seen.has(d.text) ? false : (seen.add(d.text), true)));

  const uni = new Map(), bi = new Map(), cats = new Map();
  const src = { hn: 0, mastodon: 0 };
  for (const d of uniq) {
    src[d.src]++;
    const { uni: u, bi: b } = tokens(d.text);
    new Set(u).forEach(w => inc(uni, w));
    new Set(b).forEach(w => inc(bi, w));
    const c = categorize(d.text);
    c.forEach(x => { inc(cats, x); inc(allCat, x); });
    const a = ageBand(d.text);
    if (a) { ageCount[a]++; c.forEach(x => inc(ageCat[a], x)); }
  }
  total += uniq.length;
  result.seeds[seed] = {
    ko: cfg.ko, docs: uniq.length, sources: src, queries: cfg.hn, tags: cfg.tags,
    topWords: top(uni, 40), topBigrams: top(bi, 30),
    categories: top(cats, 11).map(([k, v]) => [k, v, +(v / uniq.length * 100).toFixed(1)]),
  };
  console.log(`[${seed}] ${uniq.length}건 (hn ${src.hn}, mastodon ${src.mastodon})`);
}

// 연령대 표본을 늘리기 위한 추가 검색 (어느 seed 에도 속하지 않고 연령대 집계에만 사용)
const AGE_QUERIES = ['20s', '30s', '40s', '50s', 'twenties', 'thirties', 'forties', 'fifties']
  .flatMap(b => [`in my ${b} goal`, `in my ${b} dream`, `in my ${b} want`, `in my ${b} regret`, `in my ${b} purpose`]);
const ageSeen = new Set();
for (const q of AGE_QUERIES) {
  for (const d of await hn(q, 2)) {
    if (ageSeen.has(d.text)) continue;
    ageSeen.add(d.text);
    const a = ageBand(d.text);
    if (!a) continue;
    ageCount[a]++;
    categorize(d.text).forEach(x => inc(ageCat[a], x));
  }
}
console.log(`[age] 연령 추가 검색 ${ageSeen.size}건`);

for (const a of Object.keys(ageCat)) {
  result.byAge[a] = {
    docs: ageCount[a],
    categories: top(ageCat[a], 11).map(([k, v]) => [k, v, ageCount[a] ? +(v / ageCount[a] * 100).toFixed(1) : 0]),
  };
}
result.totals = { docs: total, categories: top(allCat, 11).map(([k, v]) => [k, v, +(v / total * 100).toFixed(1)]) };
result.sources = {
  hn: 'https://hn.algolia.com/api (Hacker News 공개 검색 API, 인증 없음)',
  mastodon: 'https://mastodon.social/api/v1/timelines/tag/<tag> (공개 해시태그 타임라인, 인증 없음)',
};

mkdirSync(new URL('./output/', import.meta.url), { recursive: true });
writeFileSync(new URL('./output/keywords.json', import.meta.url), JSON.stringify(result, null, 2));
console.log(`총 ${total}건 → research/output/keywords.json`);
