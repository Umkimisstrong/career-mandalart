// 웹 전용: 링크로 처음 들어온 사람에게 "홈 화면에 추가" 방법을 안내한다.
// iOS 는 웹사이트가 아이콘을 자동으로 만들 수 없어서 공유 버튼 위치를 짚어주는 방식이 표준이다.
//  - iPhone/iPad Safari·Chrome : 공유 → 홈 화면에 추가 안내 (하단 화살표)
//  - 카카오톡·인스타그램 등 인앱 브라우저 : 홈 화면 추가가 불가능하므로 Safari 로 열도록 안내
//  - Android Chrome : 설치 프롬프트(beforeinstallprompt)가 오면 「앱 설치」 버튼, 오기 전 · 다른 브라우저는 메뉴 안내
//  - Android 카카오톡 · 인앱 브라우저 : 설치가 안 되므로 Chrome 으로 열도록 안내
// 이미 홈 화면 앱으로 실행 중이거나, 닫은 지 7일이 안 됐으면 보이지 않는다.
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const DISMISS_KEY = 'career-mandalart/install-dismissed';
const DISMISS_DAYS = 7;

type Mode = 'ios' | 'inapp-kakao' | 'inapp' | 'android' | 'android-manual' | 'android-kakao' | 'android-inapp' | null;
const PREVIEWS: Mode[] = ['ios', 'inapp-kakao', 'inapp', 'android', 'android-manual', 'android-kakao', 'android-inapp'];

type InstallPromptEvent = Event & { prompt: () => Promise<void> };

function detect(): Mode {
  // PC 에서 안내 화면을 미리 보기: ?install-preview=ios | inapp-kakao | inapp | android-manual | android-kakao | android-inapp
  const preview = new URLSearchParams(window.location.search).get('install-preview') as Mode;
  if (PREVIEWS.includes(preview)) return preview;
  const ua = navigator.userAgent;
  const standalone =
    (navigator as Navigator & { standalone?: boolean }).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;
  if (standalone) return null;
  // iPadOS 는 데스크톱 UA(Macintosh)를 쓰므로 터치 지원으로 구분
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const android = /Android/i.test(ua);
  if (/KAKAOTALK/i.test(ua)) return android ? 'android-kakao' : 'inapp-kakao';
  if (android && /Instagram|FBAN|FBAV|Line\/|NAVER|DaumApps|everytimeApp|; wv\)/i.test(ua)) return 'android-inapp';
  if (android) return 'android-manual';
  if (ios && /Instagram|FBAN|FBAV|Line\/|NAVER|DaumApps|everytimeApp/i.test(ua)) return 'inapp';
  if (ios) return 'ios';
  return null;
}

function dismissedRecently() {
  try {
    const t = Number(localStorage.getItem(DISMISS_KEY));
    return !!t && Date.now() - t < DISMISS_DAYS * 864e5;
  } catch {
    return false;
  }
}

export default function InstallBanner() {
  const [mode, setMode] = useState<Mode>(null);
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    const previewing = window.location.search.includes('install-preview');
    if (!previewing && dismissedRecently()) return;
    setMode(detect());
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPromptEvent);
      setMode('android');
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (!mode) return null;

  const close = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* 저장 못 해도 이번엔 닫힘 */ }
    setMode(null);
  };

  const openInSafari = () => {
    // 카카오톡 인앱 브라우저 전용 스킴: 기본 브라우저(iPhone 은 Safari, Android 는 보통 Chrome)로 현재 주소를 연다
    window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(window.location.href)}`;
  };

  const install = async () => {
    await prompt?.prompt();
    setMode(null);
  };

  const isIPhone = /iPhone|iPod/.test(navigator.userAgent) || window.location.search.includes('install-preview=ios');

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.appIcon}><Text style={styles.appIconText}>🎯</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{mode.startsWith('android') ? '구도 앱 설치하기' : '홈 화면에 앱으로 추가하기'}</Text>
            <Text style={styles.sub}>
              {mode.startsWith('android') ? '앱 서랍 · 홈 화면에 아이콘이 생기고, 주소창 없이 열려요' : '아이콘을 누르면 주소창 없이 앱처럼 열려요'}
            </Text>
          </View>
          <Pressable onPress={close} hitSlop={12} accessibilityLabel="닫기">
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>

        {mode === 'ios' && (
          <View style={styles.steps}>
            <Text style={styles.step}>
              <Text style={styles.num}>1 </Text>
              {isIPhone ? '아래' : '위쪽'} <ShareGlyph /> 공유 버튼을 누르고
            </Text>
            <Text style={styles.step}>
              <Text style={styles.num}>2 </Text>
              「<Text style={styles.bold}>홈 화면에 추가</Text>」를 선택하세요
            </Text>
            <Text style={styles.hint}>목록에 없으면 공유 메뉴를 위로 올려 찾아보세요</Text>
          </View>
        )}

        {mode === 'inapp-kakao' && (
          <View style={styles.steps}>
            <Text style={styles.step}>카카오톡 안에서는 홈 화면에 추가할 수 없어요. Safari 로 열어주세요.</Text>
            <Pressable style={styles.btn} onPress={openInSafari}>
              <Text style={styles.btnText}>Safari로 열기</Text>
            </Pressable>
          </View>
        )}

        {mode === 'inapp' && (
          <View style={styles.steps}>
            <Text style={styles.step}>
              이 앱 안의 브라우저에서는 홈 화면에 추가할 수 없어요. 오른쪽 위 「⋯」 메뉴에서
              「<Text style={styles.bold}>Safari로 열기</Text>」를 눌러주세요.
            </Text>
          </View>
        )}

        {mode === 'android-manual' && (
          <View style={styles.steps}>
            <Text style={styles.step}>
              <Text style={styles.num}>1 </Text>
              오른쪽 위 <Text style={styles.bold}>⋮</Text> 메뉴를 누르고
            </Text>
            <Text style={styles.step}>
              <Text style={styles.num}>2 </Text>
              「<Text style={styles.bold}>앱 설치</Text>」 또는 「<Text style={styles.bold}>홈 화면에 추가</Text>」를 선택하세요
            </Text>
            <Text style={styles.hint}>삼성 인터넷: 아래 ≡ 메뉴 → 현재 페이지 추가 → 홈 화면</Text>
          </View>
        )}

        {mode === 'android-kakao' && (
          <View style={styles.steps}>
            <Text style={styles.step}>카카오톡 안에서는 앱을 설치할 수 없어요. Chrome 으로 열어주세요.</Text>
            <Pressable style={styles.btn} onPress={openInSafari}>
              <Text style={styles.btnText}>Chrome으로 열기</Text>
            </Pressable>
          </View>
        )}

        {mode === 'android-inapp' && (
          <View style={styles.steps}>
            <Text style={styles.step}>
              이 앱 안의 브라우저에서는 설치할 수 없어요. 오른쪽 위 「⋮」 메뉴에서
              「<Text style={styles.bold}>다른 브라우저로 열기</Text>」(Chrome)를 눌러주세요.
            </Text>
          </View>
        )}

        {mode === 'android' && (
          <Pressable style={styles.btn} onPress={install}>
            <Text style={styles.btnText}>앱 설치</Text>
          </Pressable>
        )}
      </View>
      {mode === 'ios' && isIPhone && <Text style={styles.arrow}>▼</Text>}
    </View>
  );
}

// iOS 공유 아이콘(네모 + 위 화살표) 모양
function ShareGlyph() {
  return (
    <Text style={styles.glyph}>
      {' '}⬆︎{' '}
    </Text>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 12, paddingBottom: 6, alignItems: 'center' },
  card: {
    width: '100%', maxWidth: 520, backgroundColor: '#111827', borderRadius: 16, padding: 14, gap: 10,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  appIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  appIconText: { fontSize: 22 },
  title: { color: '#fff', fontSize: 15, fontWeight: '700' },
  sub: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
  close: { color: '#9CA3AF', fontSize: 16, paddingHorizontal: 4 },
  steps: { gap: 6, paddingLeft: 2 },
  step: { color: '#E5E7EB', fontSize: 14, lineHeight: 22 },
  num: { color: '#60A5FA', fontWeight: '800' },
  bold: { color: '#fff', fontWeight: '700' },
  hint: { color: '#9CA3AF', fontSize: 12 },
  glyph: {
    color: '#60A5FA', fontWeight: '800', borderWidth: 1.5, borderColor: '#60A5FA', borderRadius: 4,
  },
  btn: { backgroundColor: '#fff', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  btnText: { color: '#111827', fontWeight: '700', fontSize: 15 },
  arrow: { color: '#111827', fontSize: 18, marginTop: -4 },
});
