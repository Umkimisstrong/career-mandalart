import { StyleSheet } from 'react-native';
import { BLOCK_COLORS, CENTER } from './model';

export const blockColor = (b: number) => BLOCK_COLORS[b];
export const blockTextColor = (b: number) => (b === CENTER ? '#fff' : '#111827');

export const ui = StyleSheet.create({
  h1: { fontSize: 26, fontWeight: '800', color: '#111827' },
  sub: { fontSize: 13, color: '#6B7280' },
  input: {
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 12,
    paddingVertical: 10, fontSize: 15, backgroundColor: '#fff', color: '#111827',
  },
  btn: {
    paddingHorizontal: 14, paddingVertical: 11, borderRadius: 10, alignItems: 'center',
    borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#fff',
  },
  btnText: { fontSize: 15, color: '#111827', fontWeight: '600' },
  btnPrimary: {
    paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10, alignItems: 'center',
    backgroundColor: '#111827',
  },
  btnPrimaryText: { fontSize: 15, color: '#fff', fontWeight: '700' },
  bar: { height: 6, borderRadius: 3, backgroundColor: '#E5E7EB', overflow: 'hidden' },
  barFill: { height: 6, backgroundColor: '#10B981' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#fff',
  },
  back: { fontSize: 15, color: '#2563EB', paddingRight: 8 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#111827' },
});
