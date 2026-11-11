// 테마 두 겹 — 같은 가족 표에서 만든다.
//  앱 테마(Store.theme → Theme, useTheme)   판을 뺀 모든 화면: 바탕 · 글자 · 버튼 · 칩 · 글꼴
//  블록 테마(BlockTheme → Board, useBoard)  판의 칸: 블록 색 · 받침 · 그림 · 완료 색. 목표마다 고를 수 있고(Plan.blockTheme),
//    없으면 블록 기본 테마(Store.blockTheme), 그것도 없으면 앱 테마와 같은 모양 — 예전 사용자의 판은 그대로다
//  색상 가족 — default 파스텔 · northstar 북극성 · mono 흑백 · signature 만다라트 시그니처 · custom 2~4색 섞기
//  그림 가족 — 우드 · 음식 · 계절 (하위 테마 표는 src/pictures.ts). 그림은 「블록마다 그림」 또는 「퍼즐 그림」
import { createContext, useContext, useMemo } from 'react';
import { ImageSourcePropType, Platform, TextStyle, ViewStyle } from 'react-native';
import { CENTER } from './model';
import { isPictureId, PictureFamily, PictureId, PICTURES, picturesOf } from './pictures';

export type ThemeId = 'default' | 'northstar' | 'mono' | 'signature' | 'custom';
export type Family = 'color' | PictureFamily;
export type ArtMode = 'motif' | 'puzzle';
// 앱 테마 (저장 형식). family 가 없으면 색상 가족 (예전에 저장한 { id, colors } 그대로). 그림 가족을 골라도 id · colors 는 남겨
// 색상으로 돌아오면 섞던 색이 그대로 있다. art 는 판 그림 방식을 여기 담던 때의 값 — 블록 기본 테마를 고르기 전까지 판이 따른다
export type ThemeSetting = { id: ThemeId; colors?: string[]; family?: Family; variant?: string; art?: ArtMode };

// 블록 테마. variant = 색상 가족이면 ThemeId, 그림 가족이면 PictureId. colors 는 나만의 색 섞기 (다른 가족을 골라도 남긴다)
// reveal = 「완료할수록 그림 완성」 — 퍼즐 그림에서 아직 못 한 칸은 흐리게, 끝낸 칸은 또렷하게
export type BlockTheme = { family: Family; variant: string; colors?: string[]; art?: ArtMode; reveal?: boolean };

type Palette = {
  // 고른 모양 하나의 이름 — 바뀌면 판의 칸들이 다시 차례로 나타난다
  key: string;
  family: Family;
  // 가족 안에서 고른 하위 테마 — 색상은 ThemeId, 그림은 PictureId
  variant: string;
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
  // 판 받침 — 칸 사이 틈으로 보이는 색
  mat: string;
  // 그림 가족만: 블록마다 그림(motif) 9개 · 퍼즐 그림 한 장
  art?: { mode: ArtMode; motifs: string[]; scene: ImageSourcePropType };
  radius: typeof RADIUS;
  font: typeof FONT;
  // 배경색 위에 올릴 글자색 (밝기에 따라 흰색/진한색 자동)
  on: (color: string) => string;
};

// 앱 테마 — 판을 뺀 화면
export type Theme = Omit<Palette, 'blocks' | 'mat' | 'art'>;

// 판 하나의 색 · 그림. 바탕 · 글자색은 이미지 카드가 판과 같은 색으로 그리려고 함께 둔다
export type Board = Omit<Palette, 'family' | 'variant' | 'primary' | 'onPrimary' | 'accent' | 'radius' | 'font'> & {
  // 퍼즐 그림 조각을 흐리게 하는 정도 0~1 (0 = 또렷)
  fade: number;
  // true = 끝낸 조각은 또렷하게 (완료할수록 그림 완성) · false = 모든 조각을 fade 만큼 (이미지 카드의 배경 흐리게)
  reveal: boolean;
};

// 「완료할수록 그림 완성」에서 아직 못 한 조각을 흐리게 하는 정도
export const REVEAL = 0.7;

export const RADIUS = { card: 22, button: 16, input: 14, chip: 999 };
// 웹만: 제목은 Jua, 본문은 Gowun Dodum (scripts/pwa.mjs 가 index.html 에 글꼴과 본문 규칙을 넣는다). 앱은 시스템 글꼴
export const FONT = { title: Platform.OS === 'web' ? "Jua, 'Gowun Dodum', system-ui, sans-serif" : undefined };

export const FAMILIES: { id: Family; label: string; desc: string }[] = [
  { id: 'color', label: '색상', desc: '그림 없이 색으로' },
  { id: 'wood', label: '우드', desc: '나무 카드 · 숲' },
  { id: 'food', label: '음식', desc: '케이크 · 라면 · 피자' },
  { id: 'season', label: '계절 · 기후', desc: '봄 · 여름 · 가을 · 겨울' },
];

export const ART_LABELS: Record<ArtMode, { label: string; desc: string }> = {
  motif: { label: '블록마다 그림', desc: '블록마다 그림 하나 · 파스텔 색' },
  puzzle: { label: '퍼즐 그림', desc: '판 전체가 그림 한 장, 칸은 조각' },
};

export const THEME_LABELS: Record<ThemeId, { label: string; desc: string }> = {
  default: { label: '파스텔', desc: '부드러운 파스텔' },
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

export function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// color 를 toward 쪽으로 조금씩 섞어 against 위에서 글자 대비 4.5:1 이 되는 첫 색
function deepen(color: string, toward: string, against: string) {
  for (let r = 0; r <= 1; r += 0.05) {
    const c = mix(color, toward, r);
    if (contrast(c, against) >= 4.5) return c;
  }
  return toward;
}

const onColor = (dark: string) => (color: string) => (luminance(color) > 0.4 ? dark : '#FFFFFF');

// 어두운 배경 테마인지 (상태 표시줄 색 등에 사용)
export const isDark = (t: { bg: string }) => luminance(t.bg) < 0.2;

// ---- 테마 정의 ----
type Tokens = Omit<Palette, 'key' | 'family' | 'variant' | 'on' | 'radius' | 'font'>;
type Id = Pick<Palette, 'key' | 'family' | 'variant'>;

function base(id: Id, t: Tokens): Palette {
  // 밝은 칸 위 글자는 진한색 — 어두운 테마라도 본문 글자색(밝은색)을 쓰면 안 보이므로 고정 남색 사용
  return {
    ...id, ...t, radius: RADIUS, font: FONT,
    on: onColor(luminance(t.text) < 0.2 ? t.text : '#0B1026'),
  };
}

function custom(colors: string[]): Palette {
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
  return base({ key: `color:custom:${cs.join(',')}`, family: 'color', variant: 'custom' }, {
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
    mat: mix(main, '#FFFFFF', 0.86),
  });
}

function colorTheme(id: string, colors?: string[]): Palette {
  switch (id) {
    case 'northstar': {
      const gold = '#F5C451';
      const deep = '#24386E';
      const mid = '#34508F';
      return base({ key: 'color:northstar', family: 'color', variant: 'northstar' }, {
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
        mat: '#1A2244',
      });
    }
    case 'mono':
      return base({ key: 'color:mono', family: 'color', variant: 'mono' }, {
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
        mat: '#F0F0F0',
      });
    case 'signature': {
      const blue = '#005A9C';
      const red = '#EF3E42';
      const sky = '#D6E6F5';
      return base({ key: 'color:signature', family: 'color', variant: 'signature' }, {
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
        mat: '#E8EEF6',
      });
    }
    case 'custom':
      return custom(colors ?? DEFAULT_CUSTOM);
    default:
      return base({ key: 'color:default', family: 'color', variant: 'default' }, {
        bg: '#F7F4FB',
        surface: '#FFFFFF',
        text: '#2F2A3A',
        sub: '#6B6478',
        border: '#E7E2EF',
        primary: '#3B3346',
        onPrimary: '#FFFFFF',
        accent: '#5B4FC4',
        done: '#D9F3E4',
        doneBorder: '#3FA672',
        doneText: '#1D6B45',
        blocks: ['#FFD6D6', '#FFE7C2', '#FFF4B8', '#D9F5C8', '#C9B6F2', '#C8EEF2', '#CFE0FF', '#E5D6FF', '#FFD9EC'],
        mat: '#EEE9F6',
      });
  }
}

function pictureTheme(id: PictureId, mode: ArtMode): Palette {
  const p = PICTURES[id];
  // 강조색을 글자색 쪽으로 진하게 — 바탕 위 링크 글자로도, 흰 글자를 얹는 버튼으로도 4.5:1
  const deep = deepen(p.accent, p.ink, p.bg);
  const done = mix(p.accent, '#FFFFFF', 0.7);
  return base({ key: `${p.family}:${id}:${mode}`, family: p.family, variant: id }, {
    bg: p.bg,
    surface: '#FFFFFF',
    text: p.ink,
    sub: deepen(mix(p.ink, p.bg, 0.5), p.ink, p.bg),
    border: mix(p.ink, p.bg, 0.84),
    primary: deep,
    onPrimary: '#FFFFFF',
    accent: deep,
    done,
    doneBorder: deep,
    doneText: deepen(deep, p.ink, done),
    blocks: p.blocks,
    mat: p.mat,
    art: { mode, motifs: p.motifs, scene: p.scene },
  });
}

// 저장된 값은 바깥에서 온 것 (백업 · QR) — 모르는 가족 · 하위 테마면 그 가족의 첫 그림, 그래도 없으면 색상으로
function palette(bt: BlockTheme): Palette {
  const { family } = bt;
  if (family !== 'color' && FAMILIES.some(f => f.id === family)) {
    const id = isPictureId(bt.variant) && PICTURES[bt.variant].family === family ? bt.variant : picturesOf(family)[0];
    return pictureTheme(id, bt.art === 'puzzle' ? 'puzzle' : 'motif');
  }
  return colorTheme(bt.variant, bt.colors);
}

// 앱 테마 설정과 같은 모양의 블록 테마 — 블록 기본 테마를 따로 고르지 않았을 때의 판
export function blockThemeOf(s?: ThemeSetting): BlockTheme {
  if (s?.family && s.family !== 'color' && FAMILIES.some(f => f.id === s.family)) {
    return { family: s.family, variant: s.variant ?? '', colors: s.colors, art: s.art };
  }
  return { family: 'color', variant: s?.id ?? 'default', colors: s?.colors };
}

export const buildTheme = (setting?: ThemeSetting): Theme => palette(blockThemeOf(setting));

const boards = new Map<string, Board>();
// 같은 블록 테마면 같은 객체 — 화면을 다시 그려도 판을 다시 계산하지 않고, 판을 받는 effect 도 다시 돌지 않는다
export function buildBoard(bt: BlockTheme): Board {
  const id = JSON.stringify([bt.family, bt.variant, bt.colors, bt.art, !!bt.reveal]);
  let board = boards.get(id);
  if (!board) {
    const p = palette(bt);
    const reveal = !!bt.reveal && p.art?.mode === 'puzzle';
    board = { ...p, fade: reveal ? REVEAL : 0, reveal };
    boards.set(id, board);
  }
  return board;
}

// 목표의 블록 테마 — 그 목표에서 고른 것 › 블록 기본 테마 › 앱 테마와 같은 모양
export function blockThemeFor(store: { theme?: ThemeSetting; blockTheme?: BlockTheme }, plan?: { blockTheme?: BlockTheme }): BlockTheme {
  return plan?.blockTheme ?? store.blockTheme ?? blockThemeOf(store.theme);
}

// 「음식 · 케이크 · 퍼즐 그림」
export function lookLabel(bt: BlockTheme): string {
  if (bt.family === 'color' || !FAMILIES.some(f => f.id === bt.family)) {
    return `색상 · ${THEME_LABELS[bt.variant as ThemeId]?.label ?? THEME_LABELS.default.label}`;
  }
  const family = bt.family as PictureFamily;
  const id = isPictureId(bt.variant) && PICTURES[bt.variant].family === family ? bt.variant : picturesOf(family)[0];
  return `${FAMILIES.find(f => f.id === family)!.label} · ${PICTURES[id].name} · ${ART_LABELS[bt.art === 'puzzle' ? 'puzzle' : 'motif'].label}`;
}

// 공통 스타일. StyleSheet.create 를 쓰지 않는 까닭: 웹에서는 CSS 클래스가 되어 index.html 의 본문 글꼴 규칙에 밀린다.
// 그대로 넘기면 인라인 스타일이라 제목 글꼴(Jua)이 이긴다
export function makeUi(t: Theme) {
  // Jua 는 굵기가 하나뿐 — 굵게 하면 브라우저가 흉하게 덧칠하므로 보통 굵기로
  const titleFont: TextStyle = t.font.title ? { fontFamily: t.font.title, fontWeight: '400' } : {};
  const ui = {
    titleFont,
    h1: { fontSize: 26, fontWeight: '800', color: t.text, ...titleFont },
    sub: { fontSize: 13, color: t.sub },
    input: {
      borderWidth: 1, borderColor: t.border, borderRadius: t.radius.input, paddingHorizontal: 14,
      paddingVertical: 11, fontSize: 15, backgroundColor: t.surface, color: t.text,
    },
    btn: {
      paddingHorizontal: 14, paddingVertical: 12, borderRadius: t.radius.button, alignItems: 'center',
      borderWidth: 1, borderColor: t.border, backgroundColor: t.surface,
    },
    btnText: { fontSize: 15, color: t.text, fontWeight: '600' },
    btnPrimary: {
      paddingHorizontal: 16, paddingVertical: 12, borderRadius: t.radius.button, alignItems: 'center',
      backgroundColor: t.primary,
    },
    btnPrimaryText: { fontSize: 15, color: t.onPrimary, fontWeight: '700', ...titleFont },
    bar: { height: 8, borderRadius: 4, backgroundColor: mix(t.border, '#FFFFFF', 0.3), overflow: 'hidden' },
    barFill: { height: 8, borderRadius: 4, backgroundColor: t.doneBorder },
    header: {
      flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12,
      borderBottomWidth: 1, borderBottomColor: t.border, backgroundColor: t.surface,
    },
    back: { fontSize: 15, color: t.accent, paddingRight: 8, fontWeight: '600' },
    // minWidth 0 — 웹의 입력칸(목표 이름)은 글자 수만큼 최소 너비가 있어 머리 줄 버튼을 화면 밖으로 민다
    headerTitle: { flex: 1, minWidth: 0, fontSize: 18, fontWeight: '700', color: t.text, ...titleFont },
  } satisfies Record<string, ViewStyle | TextStyle>;
  return ui;
}

export type Ui = ReturnType<typeof makeUi>;

const ThemeContext = createContext<Theme>(buildTheme());
export const ThemeProvider = ThemeContext.Provider;

// App 은 맨 바깥을 블록 기본 테마로(만들기 미리보기 · 소개 · 템플릿), 목표 화면 · 작은 창은 그 목표의 판으로 감싼다
const BoardContext = createContext<Board>(buildBoard(blockThemeOf()));
export const BoardProvider = BoardContext.Provider;
export const useBoard = () => useContext(BoardContext);

export function useTheme(): { t: Theme; ui: Ui } {
  const t = useContext(ThemeContext);
  const ui = useMemo(() => makeUi(t), [t]);
  return { t, ui };
}
