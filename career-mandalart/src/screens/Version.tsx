// 버전 · 업데이트 — 이 기기의 앱 버전과 업데이트 상태, Windows 앱 받기, 버전 기록(GitHub 릴리스).
// 화면(웹)은 열 때마다 최신이 들어오고, Windows 앱 껍데기는 GitHub 릴리스로 스스로 업데이트한다 (desktop/updater.cjs).
import { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { desktop, DesktopInfo } from '../desktop';
import { useTheme } from '../theme';

const REPO = 'Umkimisstrong/career-mandalart';
export const DOWNLOAD_URL = `https://github.com/${REPO}/releases/latest/download/GUDO-Setup.exe`;

type Release = { tag: string; date: string; notes: string[]; url: string };

// 화면 빌드 — 웹 빌드 때 index.html 에 심은 <meta name="gudo-build" content="커밋 시각">
function webBuild(): { sha: string; at: string } | null {
  if (Platform.OS !== 'web') return null;
  const c = document.querySelector('meta[name="gudo-build"]')?.getAttribute('content');
  if (!c) return null;
  const [sha, at] = c.split(' ');
  return { sha, at };
}

const day = (iso: string) => new Date(iso).toLocaleDateString();
const time = (ms: number) => new Date(ms).toLocaleString();

export default function Version({ onBack }: { onBack: () => void }) {
  const { t, ui } = useTheme();
  const [info, setInfo] = useState<DesktopInfo | null>(null);
  const [releases, setReleases] = useState<Release[] | null>(null);
  const [failed, setFailed] = useState(false);
  const build = webBuild();
  const isDesktop = !!desktop;
  const card = { backgroundColor: t.surface, borderColor: t.border };

  useEffect(() => {
    desktop?.info?.().then(setInfo).catch(() => {});
    desktop?.onUpdate?.(setInfo);
    // 버전 기록 — 데스크톱 앱 릴리스(desktop-v*)만
    fetch(`https://api.github.com/repos/${REPO}/releases?per_page=20`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then((list: { tag_name: string; published_at: string; body: string; html_url: string; draft: boolean }[]) => setReleases(
        list.filter(r => !r.draft && r.tag_name.startsWith('desktop-v')).map(r => ({
          tag: r.tag_name.replace('desktop-v', ''), date: r.published_at, url: r.html_url,
          notes: (r.body ?? '').split('\n').map(l => l.trim()).filter(l => l.startsWith('- ')).map(l => l.slice(2)),
        })),
      ))
      .catch(() => setFailed(true));
  }, []);

  const latest = releases?.[0]?.tag;

  return (
    <View style={{ flex: 1 }}>
      <View style={ui.header}>
        <Pressable onPress={onBack}><Text style={ui.back}>‹ 소개</Text></Pressable>
        <Text style={ui.headerTitle}>버전 · 업데이트</Text>
      </View>
      <ScrollView contentContainerStyle={styles.wrap}>
        {/* 이 기기 */}
        <View style={[styles.card, card]}>
          <Text style={[styles.h, { color: t.text }]}>이 기기</Text>
          {isDesktop ? (
            info ? (
              <>
                <Line k="Windows 앱" v={`v${info.version}${latest && latest === info.version ? ' · 최신' : ''}`} />
                <Line k="업데이트" v={info.state} />
                {!!info.checkedAt && <Line k="마지막 확인" v={time(info.checkedAt)} />}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                  <Pressable style={[ui.btn, { flex: 1 }]} onPress={() => desktop?.checkUpdate?.()}>
                    <Text style={ui.btnText}>업데이트 확인</Text>
                  </Pressable>
                  {!!info.ready && (
                    <Pressable style={[ui.btnPrimary, { flex: 1 }]} onPress={() => desktop?.installUpdate?.()}>
                      <Text style={ui.btnPrimaryText}>v{info.ready} 지금 적용</Text>
                    </Pressable>
                  )}
                </View>
              </>
            ) : (
              <Text style={[ui.sub, { lineHeight: 19 }]}>
                Windows 앱 1.2.0 이하예요. 1.2.0 은 스스로 새 버전을 받아 다시 시작할 때 적용하고, 1.1.x 는 아래 「Windows 앱 받기」로 한 번 다시 설치해 주세요.
              </Text>
            )
          ) : (
            <Line k="앱" v={Platform.OS === 'web' ? '웹 앱 — 열 때마다 최신 화면' : '모바일 앱'} />
          )}
          {build && <Line k="화면 빌드" v={`${build.sha} · ${day(build.at)}`} />}
          <Text style={[ui.sub, { fontSize: 12, lineHeight: 18 }]}>
            화면(목표 · 만들기 · 팀 등)은 열 때마다 최신이 들어와요. Windows 앱 업데이트는 작은 창 · 트레이 같은 앱 바깥 틀만 바꿔요.
          </Text>
        </View>

        {/* Windows 앱 받기 */}
        <View style={[styles.card, card]}>
          <Text style={[styles.h, { color: t.text }]}>Windows 앱 받기</Text>
          <Text style={[ui.sub, { lineHeight: 19 }]}>
            처음 설치 · 예전 버전 덮어 설치 모두 이 링크 하나예요. 목표는 그대로 남아요. 「Windows의 PC 보호」가 뜨면 추가 정보 → 실행.
          </Text>
          <Pressable style={ui.btnPrimary} onPress={() => Linking.openURL(DOWNLOAD_URL)}>
            <Text style={ui.btnPrimaryText}>최신 설치 파일 받기{latest ? ` (v${latest})` : ''}</Text>
          </Pressable>
          <Text selectable style={{ color: t.sub, fontSize: 11 }}>{DOWNLOAD_URL}</Text>
        </View>

        {/* 버전 기록 */}
        <Text style={[styles.h, { color: t.text, marginTop: 6 }]}>Windows 앱 버전 기록</Text>
        {failed && <Text style={ui.sub}>버전 기록을 불러오지 못했어요 (인터넷 연결 확인).</Text>}
        {!releases && !failed && <Text style={ui.sub}>불러오는 중…</Text>}
        {releases?.map((r, i) => (
          <Pressable key={r.tag} onPress={() => Linking.openURL(r.url)} style={[styles.card, card]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.ver, { color: t.text }]}>v{r.tag}</Text>
              {i === 0 && <Text style={[styles.tag, { backgroundColor: t.primary, color: t.onPrimary }]}>최신</Text>}
              {info?.version === r.tag && <Text style={[styles.tag, { borderColor: t.border, borderWidth: 1, color: t.sub }]}>이 기기</Text>}
              <Text style={{ marginLeft: 'auto', color: t.sub, fontSize: 12 }}>{day(r.date)}</Text>
            </View>
            {r.notes.filter(n => !n.startsWith('설치') && !n.startsWith('서명')).map((n, j) => (
              <Text key={j} style={[ui.sub, { fontSize: 13, lineHeight: 19 }]}>· {n}</Text>
            ))}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  const { t } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <Text style={{ color: t.sub, fontSize: 13, width: 78 }}>{k}</Text>
      <Text style={{ color: t.text, fontSize: 13, fontWeight: '700', flex: 1 }}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 12, maxWidth: 560, width: '100%', alignSelf: 'center' },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 8 },
  h: { fontSize: 15, fontWeight: '800' },
  ver: { fontSize: 15, fontWeight: '800' },
  tag: { fontSize: 11, fontWeight: '800', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, overflow: 'hidden' },
});
