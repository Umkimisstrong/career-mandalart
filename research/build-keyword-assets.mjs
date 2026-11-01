#!/usr/bin/env node
// 수집 결과(research/output/keywords.json) → 키워드 자산(keyword-assets/v1) + 앱용 가중치 파일.
//
//   node research/build-keyword-assets.mjs
//
// 1) 카테고리마다 "그 카테고리에서 유독 많이 나온" 단어를 고른다
//    점수 = (카테고리 글 중 등장 비율) × log(12 / 그 단어가 상위에 든 카테고리 수)
//    → 모든 카테고리에 다 나오는 일반어(work, world …)는 자연히 밀려난다
// 2) keyword-assets/dictionary.ko.json 에 번역이 있는 단어만 자산에 넣는다 (사람이 검수한 단어만)
// 3) 번역이 없는 상위 단어는 untranslated.json 으로 남겨 다음 검수 때 사전에 추가한다
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const raw = JSON.parse(readFileSync(new URL('research/output/keywords.json', root), 'utf8'));
const dict = JSON.parse(readFileSync(new URL('keyword-assets/dictionary.ko.json', root), 'utf8'));
delete dict._설명;
// 사전 값: "한국어" 또는 { ko, cats } (cats 에 있는 카테고리에서만 사용)
const ko = (en, cat) => {
  const v = dict[en];
  if (!v) return null;
  if (typeof v === 'string') return v;
  return !cat || v.cats.includes(cat) ? v.ko : null;
};

const VERSION = 'v1';
const cats = Object.entries(raw.byCategory);

// 단어가 몇 개 카테고리의 상위 목록에 들었는지
const df = new Map();
for (const [, v] of cats) for (const [w] of [...v.topWords, ...v.topBigrams]) df.set(w, (df.get(w) ?? 0) + 1);

const untranslated = new Map();
function pick(entries, docs, limit, cat) {
  const scored = entries
    .map(([w, n]) => ({ en: w, count: n, share: +(n / docs * 100).toFixed(1), score: (n / docs) * Math.log(12 / (df.get(w) ?? 1)) }))
    .filter(k => k.score > 0)
    .sort((a, b) => b.score - a.score);
  const out = [];
  for (const k of scored) {
    const word = ko(k.en, cat);
    if (word) out.push({ en: k.en, ko: word, count: k.count, share: k.share, score: +k.score.toFixed(4) });
    else if (!dict[k.en] && out.length < limit) untranslated.set(k.en, (untranslated.get(k.en) ?? 0) + k.count);
    if (out.length >= limit) break;
  }
  return out;
}

const share = list => Object.fromEntries(list.map(([k, , pct]) => [k, pct]));

const categories = Object.fromEntries(cats.map(([id, v]) => [id, {
  docs: v.docs,
  share: share(raw.totals.categories)[id] ?? 0,
  byAge: Object.fromEntries(Object.entries(raw.byAge).map(([a, x]) => [a, share(x.categories)[id] ?? 0])),
  keywords: pick([...v.topWords, ...v.topBigrams], v.docs, 12, id),
}]));

const seeds = Object.fromEntries(Object.entries(raw.seeds).map(([id, v]) => [id, {
  ko: v.ko,
  docs: v.docs,
  queries: v.queries,
  tags: v.tags,
  categoryShare: share(v.categories),
  keywords: [...v.topWords, ...v.topBigrams].filter(([w]) => ko(w)).slice(0, 15)
    .map(([w, n]) => ({ en: w, ko: ko(w), count: n, share: +(n / v.docs * 100).toFixed(1) })),
}]));

const asset = {
  version: VERSION,
  builtAt: new Date().toISOString(),
  collectedAt: raw.generatedAt,
  sources: raw.sources,
  totals: { docs: raw.totals.docs, ageDocs: Object.fromEntries(Object.entries(raw.byAge).map(([a, x]) => [a, x.docs])) },
  method: '공개 API 글을 11개 카테고리 키워드 사전으로 분류 → 카테고리별 특징 단어(비율 × 희소성) 추출 → 검수된 한국어 사전에 있는 단어만 채택. 원문 미저장.',
  seeds,
  categories,
};

mkdirSync(new URL(`keyword-assets/${VERSION}/`, root), { recursive: true });
writeFileSync(new URL(`keyword-assets/${VERSION}/keywords.json`, root), JSON.stringify(asset, null, 2));
writeFileSync(
  new URL(`keyword-assets/${VERSION}/untranslated.json`, root),
  JSON.stringify(Object.fromEntries([...untranslated].sort((a, b) => b[1] - a[1])), null, 2),
);

// 앱에 싣는 최소 데이터: 연령대별 카테고리 비율 + 카테고리별 한국어 키워드
const app = {
  version: VERSION,
  total: Object.fromEntries(Object.entries(categories).map(([k, v]) => [k, v.share])),
  byAge: Object.fromEntries(Object.keys(raw.byAge).map(a => [a, Object.fromEntries(Object.entries(categories).map(([k, v]) => [k, v.byAge[a]]))])),
  keywords: Object.fromEntries(Object.entries(categories).map(([k, v]) => [k, [...new Set(v.keywords.map(x => x.ko))].slice(0, 6)])),
};
writeFileSync(new URL('career-mandalart/src/categories/keywordWeights.json', root), JSON.stringify(app, null, 2));

console.log(`[assets] ${VERSION}: 카테고리 ${cats.length}개, 시드 ${Object.keys(seeds).length}개, 미번역 후보 ${untranslated.size}개`);
for (const [k, v] of Object.entries(app.keywords)) console.log(`  ${k}: ${v.join(', ')}`);
