// 테마: 사용자가 고른 설정(ThemeSetting)으로 색 토큰(Theme)과 공통 스타일(ui)을 만든다.
//  - default   기본 파스텔
//  - mono      흑 / 백
//  - signature 만다라트 시그니처 (흰색 · 파란색 · 붉은색)
//  - northstar 북극성 — 밤하늘 남색 위의 금빛 별
//  - custom    사용자가 고른 2~4가지 색 섞기
import { createContext, useContext, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { CENTER } from './model';

export type ThemeId = 'default' | 'northstar' | 'mono' | 'signature' | 'custom';
export type ThemeSetting = { id: ThemeId; colors?: string[] };

export type Theme = {
  id: ThemeId;
  bg: string;
  surface: string;
  text: string;
  sub: string;
  border: string;
  primary: string;
  onPrimary: string;
  accent: string;
  done: string;
  doneBorder: string;
  doneText: string;
  // 9개 블록 색. [4] 는 핵심 목표, 나머지는 같은 번호의 세부 목표 색
  blocks: string[];
  // 배경색 위에 올릴 글자색 (밝기에 따라 흰색/진한색 자동)
  on: (color: string) => string;
};

export const THEME_LABELS: Record<ThemeId, { label: string; desc: string }> = {
  default: { label: '기본', desc: '부드러운 파스텔' },
  northstar: { label: '북극성', desc: '밤하늘 남색 · 금빛 별' },
  mono: { label: '흑 / 백', desc: '군더더기 없는 모노톤' },
  signature: { label: '만다라트 시그니처', desc: '흰색 · 파란색 · 붉은색' },
  custom: { label: '나만의 색 섞기', desc: '2~4가지 색을 골라 조합' },
};

// 나만의 색 섞기에서 고를 수 있는 색
export const SWATCHES = [
  '#E11D48', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#10B981', '#14B8A6', '#06B6D4',
  '#0EA5E9', '#2563EB', '#4F46E5', '#7C3AED', '#C026D3', '#DB2777', '#78716C', '#111827',
];
export const DEFAULT_CUSTOM = ['#2563EB', '#F59E0B', '#10B981'];

// ---- 색 계산 ----
function rgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');

// a 와 b 를 ratio(0~1, b 의 비율)만큼 섞는다
export function mix(a: string, b: string, ratio: number) {
  const [r1, g1, b1] = rgb(a);
  const [r2, g2, b2] = rgb(b);
  return `#${toHex(r1 + (r2 - r1) * ratio)}${toHex(g1 + (g2 - g1) * ratio)}${toHex(b1 + (b2 - b1) * ratio)}`;
}

export function luminance(hex: string) {
  const [r, g, b] = rgb(hex).map(v => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const onColor = (dark: string) => (color: string) => (luminance(color) > 0.4 ? dark : '#FFFFFF');

// 어두운 배경 테마인지 (상태 표시줄 색 등에 사용)
export const isDark = (t: Theme) => luminance(t.bg) < 0.2;

// ---- 테마 정의 ----
function base(id: ThemeId, t: Omit<Theme, 'id' | 'on'>): Theme {
  // 밝은 칸 위 글자는 진한색 — 어두운 테마라도 본문 글자색(밝은색)을 쓰면 안 보이므로 고정 남색 사용
  return { id, ...t, on: onColor(luminance(t.text) < 0.2 ? t.text : '#0B1026') };
}

function custom(colors: string[]): Theme {
  const cs = colors.length >= 2 ? colors.slice(0, 4) : DEFAULT_CUSTOM;
  const main = cs[0];
  const rest = cs.slice(1);
  // 세부 목표 8칸에 나머지 색을 번갈아 쓰되, 한 바퀴마다 조금씩 밝게 해서 단조롭지 않게
  const blocks = Array.from({ length: 9 }, (_, i) => {
    if (i === CENTER) return main;
    const n = i < CENTER ? i : i - 1;
    const c = rest[n % rest.length];
    const round = Math.floor(n / rest.length);
    return mix(c, '#FFFFFF', [0.35, 0.6, 0.15, 0.75][round % 4]);
  });
  const last = cs[cs.length - 1];
  return base('custom', {
    bg: mix(main, '#FFFFFF', 0.94),
    surface: '#FFFFFF',
    text: '#111827',
    sub: '#6B7280',
    border: mix(main, '#FFFFFF', 0.75),
    primary: main,
    onPrimary: onColor('#111827')(main),
    accent: luminance(main) > 0.4 ? '#111827' : main,
    done: mix(last, '#FFFFFF', 0.82),
    doneBorder: last,
    doneText: luminance(last) > 0.4 ? '#111827' : last,
    blocks,
  });
}

export function buildTheme(setting?: ThemeSetting): Theme {
  switch (setting?.id) {
    case 'northstar': {
      const gold = '#F5C451';
      const deep = '#24386E';
      const mid = '#34508F';
      return base('northstar', {
        bg: '#0B1026',
        surface: '#141B36',
        text: '#EEF1FA',
        sub: '#9AA3C2',
        border: '#2A335A',
        primary: gold,
        onPrimary: '#0B1026',
        accent: gold,
        done: '#1F2B52',
        doneBorder: gold,
        doneText: gold,
        // 가운데 금빛 북극성, 둘레는 별자리처럼 짙고 옅은 남색이 번갈아
        blocks: [deep, mid, deep, mid, gold, mid, deep, mid, deep],
      });
    }
    case 'mono':
      return base('mono', {
        bg: '#FFFFFF',
        surface: '#FFFFFF',
        text: '#000000',
        sub: '#5C5C5C',
        border: '#000000',
        primary: '#000000',
        onPrimary: '#FFFFFF',
        accent: '#000000',
        done: '#EDEDED',
        doneBorder: '#000000',
        doneText: '#000000',
        blocks: ['#E6E6E6', '#E6E6E6', '#E6E6E6', '#E6E6E6', '#000000', '#E6E6E6', '#E6E6E6', '#E6E6E6', '#E6E6E6'],
      });
    case 'signature': {
      const blue = '#005A9C';
      const red = '#EF3E42';
      const sky = '#D6E6F5';
      return base('signature', {
        bg: '#F4F7FB',
        surface: '#FFFFFF',
        text: '#0B1F3A',
        sub: '#5B6B82',
        border: '#D5DEEA',
        primary: blue,
        onPrimary: '#FFFFFF',
        accent: blue,
        done: '#E6F0FA',
        doneBorder: blue,
        doneText: blue,
        // 모서리는 붉은색, 변은 옅은 파랑, 중심은 파랑 — 야구 유니폼 같은 대비
        blocks: [red, sky, red, sky, blue, sky, red, sky, red],
      });
    }
    case 'custom':
      return custom(setting.colors ?? DEFAULT_CUSTOM);
    default:
      return base('default', {
        bg: '#F3F4F6',
        surface: '#FFFFFF',
        text: '#111827',
        sub: '#6B7280',
        border: '#E5E7EB',
        primary: '#111827',
        onPrimary: '#FFFFFF',
        accent: '#2563EB',
        done: '#D1FAE5',
        doneBorder: '#10B981',
        doneText: '#047857',
        blocks: ['#F28B82', '#FBBC04', '#FFF475', '#CCFF90', '#1F2937', '#A7FFEB', '#AECBFA', '#D7AEFB', '#FDCFE8'],
      });
  }
}

export function makeUi(t: Theme) {
  return StyleSheet.create({
    h1: { fontSize: 26, fontWeight: '800', color: t.text },
    sub: { fontSize: 13, color: t.sub },
    input: {
      borderWidth: 1, borderColor: t.border, borderRadius: 10, paddingHorizontal: 12,
      paddingVertical: 10, fontSize: 15, backgroundColor: t.surface, color: t.text,
    },
    btn: {
      paddingHorizontal: 14, paddingVertical: 11, borderRadius: 10, alignItems: 'center',
      borderWidth: 1, borderColor: t.border, backgroundColor: t.surface,
    },
    btnText: { fontSize: 15, color: t.text, fontWeight: '600' },
    btnPrimary: {
      paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10, alignItems: 'center',
      backgroundColor: t.primary,
    },
    btnPrimaryText: { fontSize: 15, color: t.onPrimary, fontWeight: '700' },
    bar: { height: 6, borderRadius: 3, backgroundColor: mix(t.border, '#FFFFFF', 0.3), overflow: 'hidden' },
    barFill: { height: 6, backgroundColor: t.doneBorder },
    header: {
      flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10,
      borderBottomWidth: 1, borderBottomColor: t.border, backgroundColor: t.surface,
    },
    back: { fontSize: 15, color: t.accent, paddingRight: 8 },
    headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: t.text },
  });
}

export type Ui = ReturnType<typeof makeUi>;

const ThemeContext = createContext<Theme>(buildTheme());
export const ThemeProvider = ThemeContext.Provider;

export function useTheme(): { t: Theme; ui: Ui } {
  const t = useContext(ThemeContext);
  const ui = useMemo(() => makeUi(t), [t]);
  return { t, ui };
}
