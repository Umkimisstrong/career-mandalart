// iOS · Android 앱: 폴더 고르기는 아직 없다 (1단계 파일 보내기를 쓴다). 웹 · Windows 는 folder.web.ts
import type { AiDoc } from './export';

export type Folder = { name: string };
export type WriteResult = { written: string[]; kept: string[] };

export const folderSupported = () => false;
export async function pickFolder(): Promise<Folder | null> { return null; }
export async function rememberFolder(_planId: string, _dir: Folder): Promise<void> {}
export async function forgetFolder(_planId: string): Promise<void> {}
export async function savedFolder(_planId: string): Promise<Folder | null> { return null; }
export async function canWrite(_dir: Folder): Promise<boolean> { return false; }
export async function writeWorkspace(_dir: Folder, _doc: AiDoc): Promise<WriteResult> {
  throw new Error('이 기기에서는 폴더를 고를 수 없어요. 파일 받기를 써 주세요.');
}
