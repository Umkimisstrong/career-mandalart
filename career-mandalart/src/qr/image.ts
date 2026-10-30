// iOS/Android 네이티브: QR 은 SVG 로 화면에 그리고(QrShare), 읽기는 카메라 화면(QrScan)을 쓴다.
// 웹 전용 기능은 image.web.ts 에 있고, 여기서는 같은 이름으로 빈 구현만 제공한다.

export async function makeQrPng(_text: string, _title: string): Promise<string> {
  throw new Error('웹에서만 지원합니다.');
}

export async function saveQrPng(_dataUrl: string, _fileName: string): Promise<void> {
  throw new Error('웹에서만 지원합니다.');
}

export async function pickQrFromImage(): Promise<string | null> {
  throw new Error('웹에서만 지원합니다.');
}
