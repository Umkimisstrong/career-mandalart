// 그림 테마 표 — 우드 · 음식 · 계절 가족의 하위 테마. 테마 하나 = 색 씨앗 몇 개 + 블록마다 그림 9개 + 퍼즐 그림 한 장.
// 테두리 · 보조 글자 · 버튼 · 완료 색은 theme.ts 가 씨앗(bg · ink · accent)에서 글자 대비 4.5:1 을 맞춰 만든다.
import type { ImageSourcePropType } from 'react-native';

export type PictureFamily = 'wood' | 'food' | 'season';
export type PictureId = 'forest' | 'toytown' | 'cake' | 'ramen' | 'pizza' | 'spring' | 'summer' | 'autumn' | 'winter';

export type Picture = {
  family: PictureFamily;
  name: string;
  desc: string;
  bg: string;
  ink: string;
  accent: string;
  // 판 받침 — 퍼즐 조각 사이 틈으로 보이는 색 (우드는 나무 쟁반)
  mat: string;
  // 블록 색 9개 · 블록마다 그림 9개 — [4] 는 핵심 목표
  blocks: string[];
  motifs: string[];
  // 퍼즐 그림 한 장 (900×900) — 판 전체에 펼쳐 칸마다 제자리 조각을 보인다
  scene: ImageSourcePropType;
};

export const PICTURES: Record<PictureId, Picture> = {
  forest: {
    family: 'wood', name: '숲속', desc: '나무 카드 · 숲 속 친구들',
    bg: '#EEF1E2', ink: '#3E4A26', accent: '#8EA866', mat: '#C9A274',
    blocks: ['#D6EAC4', '#F8D5CF', '#DDF0D0', '#EBDCC8', '#B9D39A', '#F1DCC2', '#CFE3C9', '#F6DDB8', '#FBF1BC'],
    motifs: ['🌳', '🍄', '🌿', '🦔', '★', '🐿️', '🌲', '🍂', '🌼'],
    scene: require('../assets/scenes/forest.png'),
  },
  toytown: {
    family: 'wood', name: '나무 마을', desc: '나무 장난감 마을',
    bg: '#F6EBDA', ink: '#5A3B1E', accent: '#C88F57', mat: '#B98A55',
    blocks: ['#EED9BF', '#E8CDB0', '#FBE3A8', '#E9DCC6', '#E3B98A', '#F2D3B5', '#F6C9C0', '#CFE3EE', '#FBEAA0'],
    motifs: ['🪵', '🌰', '🍯', '🪺', '★', '🧸', '🎨', '🪁', '🌻'],
    scene: require('../assets/scenes/toytown.png'),
  },
  cake: {
    family: 'food', name: '케이크', desc: '딸기 생크림 한 조각',
    bg: '#FFF4F1', ink: '#5A3440', accent: '#F4A6B8', mat: '#FFFFFF',
    blocks: ['#FFF0D9', '#FFE0E6', '#F9D3E3', '#E9DDF7', '#F7B9C8', '#FFD3D3', '#F1DFC8', '#FFEBC2', '#FCDDEB'],
    motifs: ['🍦', '🍰', '🍩', '🧁', '★', '🍓', '🍪', '🍮', '🎂'],
    scene: require('../assets/scenes/cake.png'),
  },
  ramen: {
    family: 'food', name: '라면', desc: '김 나는 라면 한 그릇',
    bg: '#FFF6E8', ink: '#5A3A14', accent: '#F2A65A', mat: '#FFFFFF',
    blocks: ['#FFE8C7', '#FFF3BF', '#F7DDC3', '#FFD9C7', '#F6C177', '#EEF2E6', '#FFD6CC', '#FFEDB0', '#F4E9DC'],
    motifs: ['🍜', '🍳', '🍔', '🍕', '★', '🍙', '🌭', '🍟', '🥟'],
    scene: require('../assets/scenes/ramen.png'),
  },
  pizza: {
    family: 'food', name: '피자', desc: '치즈 듬뿍 피자 한 판',
    bg: '#FFF4EE', ink: '#5A2E20', accent: '#E8836B', mat: '#FFFFFF',
    blocks: ['#FFE3C2', '#FFF1B3', '#FFD2C9', '#DDE8C9', '#F2A98F', '#D8EDCF', '#EFE1D2', '#F9D0C6', '#FFCFC4'],
    motifs: ['🍕', '🧀', '🍅', '🫒', '★', '🌿', '🍄', '🥓', '🌶️'],
    scene: require('../assets/scenes/pizza.png'),
  },
  spring: {
    family: 'season', name: '봄', desc: '개나리 · 벚꽃',
    bg: '#FBF8E8', ink: '#4A5A22', accent: '#F5D547', mat: '#FFFFFF',
    blocks: ['#FFF4B8', '#FFDDE6', '#DDF2C8', '#FFEBB0', '#F7DE6B', '#FFD6E0', '#DCE6FF', '#FFD3D0', '#D3EEC6'],
    motifs: ['🌼', '🌸', '🌱', '🐝', '★', '🌷', '🦋', '🍓', '🌿'],
    scene: require('../assets/scenes/spring.png'),
  },
  summer: {
    family: 'season', name: '여름', desc: '파란 바다 · 수박',
    bg: '#EAF7FB', ink: '#1F4A5C', accent: '#5CC2E0', mat: '#FFFFFF',
    blocks: ['#C9EDF7', '#FFF0B5', '#FBE0D2', '#FFD6D6', '#8FD3EA', '#FFE6C4', '#CFE8F7', '#DCDDF7', '#DDF5F5'],
    motifs: ['🌊', '☀️', '🐚', '🍉', '★', '⛱️', '🐬', '☔', '🧊'],
    scene: require('../assets/scenes/summer.png'),
  },
  autumn: {
    family: 'season', name: '가을', desc: '단풍 · 군고구마',
    bg: '#FBF0E4', ink: '#5C2E14', accent: '#E08A4A', mat: '#FFFFFF',
    blocks: ['#F9CDB8', '#F6DDB4', '#E3DCEE', '#EED8C4', '#E8A877', '#F7D2C9', '#EBD1DD', '#E6DAC6', '#F3E6B9'],
    motifs: ['🍁', '🍂', '📚', '🌰', '★', '🍄', '🍠', '🦔', '🌾'],
    scene: require('../assets/scenes/autumn.png'),
  },
  winter: {
    family: 'season', name: '겨울', desc: '눈사람 · 따뜻한 코코아',
    bg: '#F1F5FB', ink: '#28405E', accent: '#9DB8DE', mat: '#FFFFFF',
    blocks: ['#E8EFF8', '#DCEBFA', '#E3E5EE', '#F6D6DA', '#B9CDEA', '#DDE6F2', '#EADCCF', '#E1E7EF', '#D3EBDD'],
    motifs: ['⛄', '❄️', '🐺', '🧣', '★', '🏔️', '☕', '🦭', '🎄'],
    scene: require('../assets/scenes/winter.png'),
  },
};

export const isPictureId = (v: unknown): v is PictureId => typeof v === 'string' && v in PICTURES;

// 가족의 하위 테마 id (표에 적은 순서)
export const picturesOf = (family: PictureFamily) =>
  (Object.keys(PICTURES) as PictureId[]).filter(id => PICTURES[id].family === family);
