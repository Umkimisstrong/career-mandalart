// iOS/Android 네이티브: 이미지 카드는 웹 캔버스로만 만든다. 실제 구현은 render.web.ts.
import type { CardModel } from './card';

export async function renderCard(_m: CardModel): Promise<string> {
  throw new Error('웹에서만 지원합니다.');
}
