// 앱 이름 "구도(GUDO)" 의 세 가지 뜻 — 九道 · 求道 · 構圖. 해외 사용자를 위해 영문 설명을 함께 싣는다.
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { APP_NAME, APP_NAME_EN, APP_TAGLINE_EN, DESCRIPTION, DESCRIPTION_EN, MEANINGS } from '../brand';
import { useTheme } from '../theme';

type Props = { onBack: () => void; onStory: () => void };

export default function About({ onBack, onStory }: Props) {
  const { t, ui } = useTheme();
  const card = { backgroundColor: t.surface, borderColor: t.border };

  return (
    <View style={{ flex: 1 }}>
      <View style={ui.header}>
        <Pressable onPress={onBack}><Text style={ui.back}>‹ 목록</Text></Pressable>
        <Text style={ui.headerTitle}>{APP_NAME}란? · About</Text>
      </View>
      <ScrollView contentContainerStyle={styles.wrap}>
        <View style={styles.hero}>
          <Text style={[styles.star, { color: t.primary }]}>★</Text>
          <Text style={[styles.name, { color: t.text }]}>{APP_NAME}</Text>
          <Text style={[styles.nameEn, { color: t.accent }]}>{APP_NAME_EN} · {APP_TAGLINE_EN}</Text>
          <Text style={[styles.lead, { color: t.sub }]}>{DESCRIPTION}</Text>
          <Text style={[styles.leadEn, { color: t.sub }]}>{DESCRIPTION_EN}</Text>
        </View>

        <Text style={[styles.intro, { color: t.text }]}>
          "구도"라는 한 소리에 세 가지 뜻을 담았습니다.{'\n'}
          <Text style={{ color: t.sub }}>One sound, three meanings in Korean.</Text>
        </Text>

        {MEANINGS.map((m, i) => (
          <View key={m.hanja} style={[styles.box, card]}>
            <View style={styles.head}>
              <View style={[styles.badge, { backgroundColor: t.blocks[4] }]}>
                <Text style={[styles.hanja, { color: t.on(t.blocks[4]) }]}>{m.hanja}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.num, { color: t.accent }]}>{i + 1}</Text>
                <Text style={[styles.title, { color: t.text }]}>{m.title}</Text>
                <Text style={[styles.titleEn, { color: t.sub }]}>{m.titleEn}</Text>
              </View>
            </View>
            <Text style={[styles.gloss, { color: t.sub }]}>{m.ko}  ·  {m.en}</Text>
            <Text style={[styles.body, { color: t.text }]}>{m.body}</Text>
            <Text style={[styles.bodyEn, { color: t.sub }]}>{m.bodyEn}</Text>
          </View>
        ))}

        <View style={[styles.box, card]}>
          <Text style={[styles.title, { color: t.text }]}>만다라트 방식</Text>
          <Text style={[styles.body, { color: t.text }]}>
            81칸 구조는 일본의 "만다라트(Mandal-Art)" 기법에서 왔고, 오타니 쇼헤이가 고교 시절 이 표로 꿈을 설계한 것으로 알려졌습니다.
          </Text>
          <Text style={[styles.bodyEn, { color: t.sub }]}>
            The 81-cell layout comes from the Japanese Mandal-Art method, famously used by Shohei Ohtani in high school to map his dream.
          </Text>
          <Pressable onPress={onStory}>
            <Text style={[styles.link, { color: t.accent }]}>★ 이 앱이 시작된 이야기 보기 · Read the story ›</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20, gap: 16, maxWidth: 560, width: '100%', alignSelf: 'center' },
  hero: { alignItems: 'center', gap: 6, paddingTop: 8 },
  star: { fontSize: 36 },
  name: { fontSize: 40, fontWeight: '800', letterSpacing: 4 },
  nameEn: { fontSize: 15, fontWeight: '700', letterSpacing: 2 },
  lead: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 6 },
  leadEn: { fontSize: 13, lineHeight: 20, textAlign: 'center', fontStyle: 'italic' },
  intro: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
  box: { borderWidth: 1, borderRadius: 16, padding: 18, gap: 10 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  badge: { width: 64, height: 64, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  hanja: { fontSize: 22, fontWeight: '800' },
  num: { fontSize: 12, fontWeight: '800' },
  title: { fontSize: 18, fontWeight: '800' },
  titleEn: { fontSize: 13, fontWeight: '600' },
  gloss: { fontSize: 12 },
  body: { fontSize: 14, lineHeight: 22 },
  bodyEn: { fontSize: 13, lineHeight: 20, fontStyle: 'italic' },
  link: { fontSize: 14, fontWeight: '700', marginTop: 4 },
});
