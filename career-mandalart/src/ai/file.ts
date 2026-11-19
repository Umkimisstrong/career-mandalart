// iOS · Android: 파일 저장 대신 공유 시트로 글을 보낸다 (메모 · 파일 앱 · AI 앱으로). 웹은 file.web.ts
import { Share } from 'react-native';

export async function saveText(name: string, text: string, _type?: string): Promise<void> {
  await Share.share({ message: text, title: name });
}

export async function copyText(text: string): Promise<boolean> {
  try { await Share.share({ message: text }); return true; } catch { return false; }
}
