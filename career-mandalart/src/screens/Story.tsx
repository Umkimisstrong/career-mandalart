// 이 앱이 시작된 이야기 — 오타니 쇼헤이가 16살에 쓴 81칸.
// 사실은 공개 보도 · 위키백과로 확인한 내용만 담고, 문장은 직접 요약했다.
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';

type Props = { onBack: () => void; onStart: () => void };

const CORE = '8구단\n드래프트\n1순위';
// 3×3 위치 순서 (가운데 = 핵심 목표)
const GOALS = ['몸 만들기', '제구', '구위', '멘탈', CORE, '160km/h', '인간성', '운', '변화구'];

const TIMELINE: [string, string][] = [
  ['2010', '이와테현 하나마키히가시고 입학. 사사키 히로시 감독의 지도로 81칸 목표 달성표를 작성'],
  ['2012', '고교 3학년 여름, 일본 고교 야구 최초로 160km/h — 표에 적었던 숫자를 현실로'],
  ['2012', '닛폰햄 파이터스 드래프트 1순위 지명. 투수와 타자를 함께하는 "이도류"로 프로 입단'],
  ['2016', '165km/h 일본 프로야구 최고 구속 · 퍼시픽리그 MVP · 일본시리즈 우승'],
  ['2018', 'LA 에인절스로 메이저리그 데뷔, 아메리칸리그 신인왕'],
  ['2021', '만장일치 아메리칸리그 MVP — 투타겸업으로 리그를 지배'],
  ['2023', 'WBC 일본 우승 · 대회 MVP, 두 번째 만장일치 MVP. 시즌 후 LA 다저스와 10년 7억 달러 계약'],
  ['2024', '메이저리그 최초 한 시즌 50홈런 · 50도루, 내셔널리그 MVP, 첫 월드시리즈 우승'],
  ['2025', '투수 복귀, 구단 신기록 55홈런, 2년 연속 만장일치 MVP, 월드시리즈 2연패'],
];

const LESSONS: [string, string, string][] = [
  ['★', '중심에는 "왜"를', '"8구단 1순위"는 막연한 꿈이 아니라 모두가 인정할 만큼 잘하겠다는 분명한 기준이었습니다.'],
  ['✦', '기술 밖의 칸', '야구 기술만 적지 않았습니다. 운 · 인간성 · 멘탈처럼 눈에 보이지 않는 것도 목표로 삼았습니다.'],
  ['✧', '매일의 작은 행동', '운과 인간성 칸에는 감사 · 배려 · 예의 · 인사하기 · 휴지 줍기 같은 일상의 실천이 들어갔다고 전해집니다.'],
];

const SOURCES: [string, string][] = [
  ['Wikipedia — Shohei Ohtani', 'https://en.wikipedia.org/wiki/Shohei_Ohtani'],
  ['주간경향 — 오타니 쇼헤이의 꿈과 목표 현실이 되다', 'https://weekly.khan.co.kr/article/201804161445561'],
  ['東洋経済オンライン — 大谷翔平のマンダラチャート', 'https://toyokeizai.net/articles/-/445400?display=b'],
];

export default function Story({ onBack, onStart }: Props) {
  const { t, ui } = useTheme();
  const card = { backgroundColor: t.surface, borderColor: t.border };

  return (
    <View style={{ flex: 1 }}>
      <View style={ui.header}>
        <Pressable onPress={onBack}><Text style={ui.back}>‹ 목록</Text></Pressable>
        <Text style={ui.headerTitle}>시작된 이야기</Text>
      </View>
      <ScrollView contentContainerStyle={styles.wrap}>
        <View style={styles.hero}>
          <Text style={[styles.star, { color: t.primary }]}>★</Text>
          <Text style={[styles.kicker, { color: t.sub }]}>이 앱이 시작된 이야기</Text>
          <Text style={[styles.title, { color: t.text }]}>16살 고교생이{'\n'}81칸에 적은 꿈</Text>
          <Text style={[styles.lead, { color: t.sub }]}>
            오타니 쇼헤이는 고등학교 1학년 때 종이 한 장에 9×9 칸을 그렸습니다. 한가운데 하나의 목표를 적고,
            그 둘레에 목표를 이루기 위한 8가지 요소를, 다시 각 요소마다 8가지 행동을 적었습니다.
          </Text>
        </View>

        {/* 그가 적은 중심 3×3 */}
        <View style={[styles.grid, { borderColor: t.border }]}>
          {GOALS.map((g, i) => {
            const core = i === 4;
            const bg = core ? t.blocks[4] : t.blocks[i];
            return (
              <View key={i} style={[styles.cell, { backgroundColor: bg }]}>
                <Text style={[styles.cellText, { color: t.on(bg) }, core && styles.coreText]}>{g}</Text>
              </View>
            );
          })}
        </View>
        <Text style={[styles.caption, { color: t.sub }]}>
          중심 목표와 8가지 요소. 바깥 64칸에는 요소마다 구체적인 행동을 적었습니다.
        </Text>

        <View style={[styles.box, card]}>
          <Text style={[styles.h2, { color: t.text }]}>표가 가르쳐 주는 것</Text>
          {LESSONS.map(([icon, head, body]) => (
            <View key={head} style={styles.lesson}>
              <Text style={[styles.lessonIcon, { color: t.primary }]}>{icon}</Text>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.lessonHead, { color: t.text }]}>{head}</Text>
                <Text style={[styles.body, { color: t.sub }]}>{body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.box, card]}>
          <Text style={[styles.h2, { color: t.text }]}>그 후의 길</Text>
          {TIMELINE.map(([year, text], i) => (
            <View key={i} style={styles.row}>
              <View style={styles.rail}>
                <View style={[styles.dot, { backgroundColor: t.primary }]} />
                {i < TIMELINE.length - 1 && <View style={[styles.line, { backgroundColor: t.border }]} />}
              </View>
              <View style={{ flex: 1, paddingBottom: 14 }}>
                <Text style={[styles.year, { color: t.accent }]}>{year}</Text>
                <Text style={[styles.body, { color: t.text }]}>{text}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.box, card, { alignItems: 'center' }]}>
          <Text style={[styles.h2, { color: t.text, textAlign: 'center' }]}>당신의 북극성은 무엇인가요?</Text>
          <Text style={[styles.body, { color: t.sub, textAlign: 'center' }]}>
            그의 표를 펼쳐 구조를 살펴보고, 빈 칸을 내 방식으로 채워 보세요.
          </Text>
          <Pressable style={[ui.btnPrimary, { alignSelf: 'stretch' }]} onPress={onStart}>
            <Text style={ui.btnPrimaryText}>★ 오타니의 81칸 펼쳐보기</Text>
          </Pressable>
        </View>

        <View style={{ gap: 6 }}>
          <Text style={[styles.caption, { color: t.sub, textAlign: 'left' }]}>출처</Text>
          {SOURCES.map(([label, url]) => (
            <Pressable key={url} onPress={() => Linking.openURL(url)}>
              <Text style={[styles.source, { color: t.accent }]}>{label}</Text>
            </Pressable>
          ))}
          <Text style={[styles.caption, { color: t.sub, textAlign: 'left' }]}>
            이 앱은 오타니 쇼헤이 선수 및 소속 구단과 관련이 없는 개인 프로젝트입니다.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20, gap: 18, maxWidth: 560, width: '100%', alignSelf: 'center' },
  hero: { alignItems: 'center', gap: 8, paddingTop: 8 },
  star: { fontSize: 40 },
  kicker: { fontSize: 13, fontWeight: '600', letterSpacing: 1 },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center', lineHeight: 36 },
  lead: { fontSize: 15, lineHeight: 24, textAlign: 'center' },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignSelf: 'center', width: 300, padding: 6,
    borderWidth: 1, borderRadius: 16,
  },
  cell: { width: 90, height: 90, borderRadius: 12, alignItems: 'center', justifyContent: 'center', padding: 6 },
  cellText: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  coreText: { fontSize: 13, fontWeight: '800', lineHeight: 18 },
  caption: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  box: { borderWidth: 1, borderRadius: 16, padding: 18, gap: 12 },
  h2: { fontSize: 18, fontWeight: '800' },
  lesson: { flexDirection: 'row', gap: 12 },
  lessonIcon: { fontSize: 20, width: 22, textAlign: 'center' },
  lessonHead: { fontSize: 15, fontWeight: '700' },
  body: { fontSize: 14, lineHeight: 22 },
  row: { flexDirection: 'row', gap: 12 },
  rail: { width: 12, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  line: { width: 2, flex: 1, marginTop: 4 },
  year: { fontSize: 13, fontWeight: '800' },
  source: { fontSize: 13, textDecorationLine: 'underline' },
});
