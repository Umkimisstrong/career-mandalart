// 움직임 공용 부품 — 게임처럼 손에 붙는 느낌.
//  Tap    누르는 것: 마우스를 올리면 살짝 떠오르고(웹), 누르면 찌그러졌다가 튕기며 돌아온다
//  Appear 나타나는 것: 아래에서 통통 튀어 오르며 나타난다. delay 로 차례차례
//  useEase 값 하나를 천천히 바꾸기 (투명도 등)
// 기기에서 「동작 줄이기」를 켰으면 움직이지 않고 바로 보인다.
import { ReactNode, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

// 웹에는 네이티브 애니메이션 모듈이 없다
const NATIVE = Platform.OS !== 'web';

let reduced = false;
AccessibilityInfo.isReduceMotionEnabled().then(v => { reduced = v; }).catch(() => {});
AccessibilityInfo.addEventListener('reduceMotionChanged', v => { reduced = v; });

// 나타나는 방식 — y: 아래에서 올라오는 거리, scale: 시작 크기, 스프링 탄력
const ENTER = {
  pop: { y: 10, scale: 0.4, friction: 6, tension: 120 }, // 판의 칸 · 작은 조각
  rise: { y: 14, scale: 0.97, friction: 9, tension: 90 }, // 카드 · 목록
  screen: { y: 18, scale: 1, friction: 11, tension: 80 }, // 화면 전환
  sheet: { y: 90, scale: 1, friction: 9, tension: 70 }, // 아래에서 올라오는 편집 시트
  modal: { y: 40, scale: 0.9, friction: 7, tension: 90 }, // 가운데 팝업
} as const;
export type Enter = keyof typeof ENTER;

type AppearProps = { delay?: number; kind?: Enter; style?: StyleProp<ViewStyle>; children: ReactNode; pointerEvents?: 'box-none' | 'none' | 'auto' };

export function Appear({ delay = 0, kind = 'rise', style, children, pointerEvents }: AppearProps) {
  const e = ENTER[kind];
  const v = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) return v.setValue(1);
    const a = Animated.spring(v, { toValue: 1, delay, friction: e.friction, tension: e.tension, useNativeDriver: NATIVE });
    a.start();
    return () => a.stop();
  }, [v, delay, e]);
  const motion = {
    opacity: v.interpolate({ inputRange: [0, 0.6], outputRange: [0, 1], extrapolate: 'clamp' }),
    transform: [
      { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [e.y, 0] }) },
      { scale: v.interpolate({ inputRange: [0, 1], outputRange: [e.scale, 1] }) },
    ],
  };
  return <Animated.View pointerEvents={pointerEvents} style={[style, motion]}>{children}</Animated.View>;
}

// 숫자 하나를 바뀐 값 쪽으로 천천히 옮긴다 (처음 값은 그대로) — 퍼즐 조각이 또렷해지는 것처럼
export function useEase(value: number, duration = 600) {
  const v = useRef(new Animated.Value(value)).current;
  useEffect(() => {
    if (reduced) return v.setValue(value);
    const a = Animated.timing(v, { toValue: value, duration, useNativeDriver: NATIVE });
    a.start();
    return () => a.stop();
  }, [v, value, duration]);
  return v;
}

// 떠오르기 · 누르기 스프링. raised = 마우스가 올라와 있거나 누르는 중 (그림자 · 앞으로 꺼내기에 쓴다)
function usePress(hover = 1.04, press = 0.93) {
  const scale = useRef(new Animated.Value(1)).current;
  const lift = useRef(new Animated.Value(0)).current;
  const over = useRef(false);
  const [raised, setRaised] = useState(false);
  const go = (s: number, y: number) => {
    if (reduced) return;
    Animated.parallel([
      Animated.spring(scale, { toValue: s, friction: 5, tension: 220, useNativeDriver: NATIVE }),
      Animated.spring(lift, { toValue: y, friction: 6, tension: 180, useNativeDriver: NATIVE }),
    ]).start();
  };
  const rest = () => (over.current ? go(hover, -3) : go(1, 0));
  return {
    raised,
    style: { transform: [{ translateY: lift }, { scale }] },
    onHoverIn: () => { over.current = true; setRaised(true); go(hover, -3); },
    onHoverOut: () => { over.current = false; setRaised(false); go(1, 0); },
    onPressIn: () => { setRaised(true); go(press, 0); },
    onPressOut: () => { setRaised(over.current); rest(); },
  };
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
// 떠오른 것은 이웃보다 앞으로 꺼내고 부드러운 그림자를 단다
const RAISED: ViewStyle = { zIndex: 2 };
const LIFT_SHADOW: ViewStyle = { boxShadow: '0 10px 22px rgba(60, 40, 90, 0.18)' };

type TapProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  hover?: number; // 마우스를 올렸을 때 크기
  press?: number; // 눌렀을 때 크기
  shadow?: boolean;
};

export function Tap({ style, hover, press, shadow = true, onHoverIn, onHoverOut, onPressIn, onPressOut, disabled, ...rest }: TapProps) {
  const m = usePress(hover, press);
  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onHoverIn={e => { if (!disabled) m.onHoverIn(); onHoverIn?.(e); }}
      onHoverOut={e => { m.onHoverOut(); onHoverOut?.(e); }}
      onPressIn={e => { m.onPressIn(); onPressIn?.(e); }}
      onPressOut={e => { m.onPressOut(); onPressOut?.(e); }}
      style={[style, m.style, m.raised && !disabled && RAISED, shadow && m.raised && !disabled && LIFT_SHADOW]}
    />
  );
}
