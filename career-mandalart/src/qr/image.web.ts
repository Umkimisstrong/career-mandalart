// 웹(Vercel · iPhone 홈 화면 앱) 전용: QR 이미지 만들기 / 저장 / 사진에서 읽기
import jsQR from 'jsqr';
import QRCode from 'qrcode';

const QR_SIZE = 1024;
const PAD = 48;
const CAPTION = 120;

// QR 아래에 청사진 이름을 적은 PNG. 사진 앱에서 어떤 계획인지 알아보기 쉽게 한다.
export async function makeQrPng(text: string, title: string): Promise<string> {
  const qr = document.createElement('canvas');
  await QRCode.toCanvas(qr, text, { errorCorrectionLevel: 'L', margin: 2, width: QR_SIZE });

  const canvas = document.createElement('canvas');
  canvas.width = QR_SIZE + PAD * 2;
  canvas.height = QR_SIZE + PAD * 2 + CAPTION;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(qr, PAD, PAD);
  ctx.fillStyle = '#111827';
  ctx.textAlign = 'center';
  ctx.font = 'bold 44px -apple-system, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
  ctx.fillText(title, canvas.width / 2, QR_SIZE + PAD + 64, canvas.width - PAD * 2);
  ctx.fillStyle = '#6B7280';
  ctx.font = '28px -apple-system, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
  ctx.fillText('커리어 만다라트 · QR로 불러오기', canvas.width / 2, QR_SIZE + PAD + 108);
  return canvas.toDataURL('image/png');
}

// iPhone: 공유 시트("이미지 저장" → 사진 앱). 공유를 못 쓰는 브라우저는 파일 다운로드.
export async function saveQrPng(dataUrl: string, fileName: string): Promise<void> {
  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], fileName, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
  }
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = fileName;
  a.click();
}

// 사진 보관함에서 QR 이미지를 고르거나(또는 바로 촬영) 그 안의 QR 문자열을 읽는다.
// 취소하면 null.
export function pickQrFromImage(): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return resolve(null);
      try {
        resolve(await decodeImageFile(f));
      } catch (e) {
        reject(e);
      }
    };
    input.click();
  });
}

async function decodeImageFile(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, fail) => {
      const el = new Image();
      el.onload = () => ok(el);
      el.onerror = () => fail(new Error('이미지를 열 수 없습니다.'));
      el.src = url;
    });
    // 촘촘한 QR 도 읽히도록 큰 해상도부터 시도하고, 안 되면 줄여서 다시 시도
    for (const max of [2400, 1600, 1000]) {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0, w, h);
      const found = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'attemptBoth' });
      if (found?.data) return found.data;
    }
    throw new Error('이미지에서 QR 코드를 찾지 못했습니다.');
  } finally {
    URL.revokeObjectURL(url);
  }
}
