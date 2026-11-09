// 팀 화면 — 관리자: 블록마다 담당자 이름 · 초대장(링크 · QR), 모두에게 갱신 보내기, 받은 코드 넣기, 복제 · 삭제.
// 담당자: 내 블록 갱신 보내기, 받은 코드 넣기, 팀에서 나가기. 실시간 동기화 없이 메신저 · 사진으로 코드를 주고받는다.
import { useEffect, useState } from 'react';
import { Alert, Image, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { catInfo } from '../categories/data';
import { blocksOf, CENTER, Plan, progress, sizeOf } from '../model';
import { QR_CAPACITY } from '../qr/codec';
import { makeQrPng, pickQrFromImage, saveQrPng } from '../qr/image';
import { isAdmin, TeamKind, teamCode } from '../team';
import { useTheme } from '../theme';

type Props = {
  plan: Plan;
  onBack: () => void;
  onOwners: (owners: string[]) => void;
  onReceive: (text: string) => string; // 반영 결과 문장 (실패하면 throw)
  onCopy: () => void;
  onDelete: () => void;
};

function confirm(message: string, yes: string, onYes: () => void) {
  if (Platform.OS === 'web') { if (window.confirm(message)) onYes(); return; }
  Alert.alert('확인', message, [{ text: '취소', style: 'cancel' }, { text: yes, style: 'destructive', onPress: onYes }]);
}

// 보낼 코드 — 링크(메신저) · QR 이미지(사진)
type Sending = { kind: TeamKind; to?: number; label: string };

export default function Team({ plan, onBack, onOwners, onReceive, onCopy, onDelete }: Props) {
  const { t, ui } = useTheme();
  const team = plan.team!;
  const admin = isAdmin(plan);
  const size = sizeOf(plan);
  const goals = blocksOf(size).filter(b => b !== CENTER);
  const [sending, setSending] = useState<Sending | null>(null);
  const [paste, setPaste] = useState('');
  const [msg, setMsg] = useState<{ text: string; error?: boolean }>();

  const owner = (b: number) => team.owners[b] || '';
  const setOwner = (b: number, name: string) => onOwners(team.owners.map((o, i) => (i === b ? name : o)));
  const goalText = (b: number) => plan.blocks[CENTER][b].text || `세부 목표 ${goals.indexOf(b) + 1}`;

  const receive = (text: string) => {
    try {
      setMsg({ text: onReceive(text) });
      setPaste('');
    } catch (e) {
      setMsg({ text: (e as Error).message, error: true });
    }
  };
  const scan = async () => {
    try {
      const text = await pickQrFromImage();
      if (text) receive(text);
    } catch (e) {
      setMsg({ text: (e as Error).message, error: true });
    }
  };

  if (sending) return <Send plan={plan} sending={sending} onBack={() => setSending(null)} />;

  return (
    <View style={{ flex: 1 }}>
      <View style={ui.header}>
        <Pressable onPress={onBack}><Text style={ui.back}>‹ 전체</Text></Pressable>
        <Text style={ui.headerTitle} numberOfLines={1}>👥 팀 · {plan.title}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.wrap}>
        <Text style={[ui.sub, { lineHeight: 19 }]}>
          {admin
            ? '블록마다 담당자를 정하고 초대장을 보내세요. 모두 같은 목표를 보고, 담당자는 자기 블록만 고칩니다. 바뀐 내용은 「갱신 보내기」로 메신저 · 사진을 통해 주고받아요.'
            : team.block !== undefined
              ? `${owner(team.block) || '나'} 님은 「${goalText(team.block)}」 블록 담당이에요. 이 블록만 고칠 수 있고, 나머지는 함께 보기만 해요.`
              : '보기 전용으로 받은 팀 목표예요. 관리자에게 초대장을 받으면 블록을 맡을 수 있어요.'}
        </Text>

        {/* 블록 · 담당자 */}
        <Text style={[styles.h2, { color: t.text }]}>블록 담당</Text>
        <View style={[styles.box, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Row color={t.blocks[CENTER]} emoji="★" title={plan.blocks[CENTER][CENTER].text || '핵심 목표'} sub="관리자">
            {admin ? <TextInput value={owner(CENTER)} onChangeText={v => setOwner(CENTER, v)} placeholder="관리자 이름" style={[ui.input, styles.name]} />
              : <Text style={[styles.who, { color: t.text }]}>{owner(CENTER) || '관리자'}</Text>}
          </Row>
          {goals.map(b => {
            const pr = progress(plan, b);
            return (
              <Row key={b} color={t.blocks[b]} emoji={catInfo(plan.blocks[CENTER][b].cat)?.emoji} title={goalText(b)}
                sub={`${pr.done}/${pr.filled} 완료${team.block === b ? ' · 내 블록' : ''}`}>
                {admin ? (
                  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                    <TextInput value={owner(b)} onChangeText={v => setOwner(b, v)} placeholder="담당자" style={[ui.input, styles.name]} />
                    <Pressable onPress={() => setSending({ kind: 'invite', to: b, label: `${owner(b) || goalText(b)} 초대장` })}
                      style={[styles.small, { borderColor: t.primary }]}>
                      <Text style={{ color: t.primary, fontSize: 12, fontWeight: '800' }}>초대장</Text>
                    </Pressable>
                  </View>
                ) : <Text style={[styles.who, { color: t.text }]}>{owner(b) || '—'}</Text>}
              </Row>
            );
          })}
        </View>

        {/* 보내기 */}
        <Text style={[styles.h2, { color: t.text }]}>보내기</Text>
        {(admin || team.block !== undefined) ? (
          <Pressable style={ui.btnPrimary} onPress={() => setSending({ kind: 'update', label: admin ? '모두에게 갱신' : '내 블록 갱신' })}>
            <Text style={ui.btnPrimaryText}>{admin ? '📤 모두에게 갱신 보내기' : '📤 관리자에게 내 블록 보내기'}</Text>
          </Pressable>
        ) : <Text style={ui.sub}>보기 전용이라 보낼 내용이 없어요.</Text>}
        <Text style={[ui.sub, { fontSize: 12 }]}>
          {admin ? '전체 목표가 담긴 코드예요. 팀 단톡방에 한 번 올리면 모두 같은 내용으로 맞춰져요.' : '내 블록 내용만 담겨요. 관리자가 받으면 그 블록만 바뀌어요.'}
        </Text>

        {/* 받기 */}
        <Text style={[styles.h2, { color: t.text }]}>받은 코드 넣기</Text>
        <TextInput value={paste} onChangeText={setPaste} multiline placeholder="받은 링크나 코드를 붙여넣으세요"
          style={[ui.input, { height: 80, fontSize: 12 }]} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable style={[ui.btn, { flex: 1 }]} onPress={() => receive(paste)} disabled={!paste.trim()}>
            <Text style={ui.btnText}>반영하기</Text>
          </Pressable>
          {Platform.OS === 'web' && (
            <Pressable style={[ui.btn, { flex: 1 }]} onPress={scan}><Text style={ui.btnText}>QR 사진에서 읽기</Text></Pressable>
          )}
        </View>
        {!!msg && <Text style={[ui.sub, { color: msg.error ? '#DC2626' : t.primary, fontWeight: '700' }]}>{msg.text}</Text>}
        <Text style={[ui.sub, { fontSize: 12 }]}>
          보낸 사람이 고칠 수 있는 블록(관리자 = 전부, 담당자 = 자기 블록)만, 더 최근에 바뀐 경우에만 반영돼요.
        </Text>

        {/* 관리자만: 복제 · 삭제 / 담당자: 나가기 */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
          {admin && (
            <Pressable style={[ui.btn, { flex: 1 }]} onPress={onCopy}><Text style={ui.btnText}>팀 목표 복제</Text></Pressable>
          )}
          <Pressable style={[ui.btn, { flex: 1, borderColor: '#DC2626' }]}
            onPress={() => confirm(admin ? `팀 목표 「${plan.title}」를 이 기기에서 삭제할까요? 팀원 기기의 사본은 남아요.` : `「${plan.title}」 팀에서 나갈까요? 이 기기에서만 지워져요.`, admin ? '삭제' : '나가기', onDelete)}>
            <Text style={[ui.btnText, { color: '#DC2626' }]}>{admin ? '팀 목표 삭제' : '팀에서 나가기'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function Row({ color, emoji, title, sub, children }: { color: string; emoji?: string; title: string; sub: string; children: React.ReactNode }) {
  const { t } = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: t.border }]}>
      <View style={[styles.dot, { backgroundColor: color }]}><Text style={{ fontSize: 13, color: t.on(color) }}>{emoji ?? ''}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: t.text }]} numberOfLines={1}>{title}</Text>
        <Text style={{ color: t.sub, fontSize: 11 }}>{sub}</Text>
      </View>
      {children}
    </View>
  );
}

// 코드 보내기 — 링크 복사 · 공유, QR 이미지 저장
function Send({ plan, sending, onBack }: { plan: Plan; sending: Sending; onBack: () => void }) {
  const { t, ui } = useTheme();
  const code = teamCode(plan, sending.kind, sending.to);
  const [png, setPng] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const fitsQr = code.qr.length <= QR_CAPACITY;

  useEffect(() => {
    if (Platform.OS !== 'web' || !fitsQr) return;
    makeQrPng(code.qr, `${plan.title} · ${sending.label}`).then(setPng).catch(() => setPng(null));
  }, [code.qr]);

  const message = sending.kind === 'invite'
    ? `[구도 팀 초대장] 「${plan.title}」 — 링크를 열면 구도 앱에 팀 목표가 들어와요.\n${code.link}`
    : `[구도 팀 갱신] 「${plan.title}」 — 링크를 열거나 팀 화면 「받은 코드 넣기」에 붙여넣으세요.\n${code.link}`;

  const share = async () => {
    try {
      if (Platform.OS === 'web') {
        const nav = navigator as Navigator & { share?: (d: { text: string }) => Promise<void> };
        if (nav.share) { await nav.share({ text: message }); return; }
        await navigator.clipboard.writeText(message);
        setNote('복사했어요 — 메신저에 붙여넣으세요');
      } else {
        await Share.share({ message });
      }
    } catch { /* 공유 창을 닫음 */ }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(message); setNote('복사했어요 — 메신저에 붙여넣으세요'); } catch { setNote('복사하지 못했어요. 아래 링크를 길게 눌러 복사하세요'); }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={ui.header}>
        <Pressable onPress={onBack}><Text style={ui.back}>‹ 팀</Text></Pressable>
        <Text style={ui.headerTitle} numberOfLines={1}>{sending.label}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.wrap}>
        <Text style={[ui.sub, { lineHeight: 19 }]}>
          {sending.kind === 'invite'
            ? '이 링크(또는 QR)를 받은 사람은 팀 목표 전체를 보고, 이 블록만 고칠 수 있어요.'
            : '이 링크(또는 QR)를 받은 사람의 구도에 바뀐 블록이 반영돼요.'}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable style={[ui.btnPrimary, { flex: 1 }]} onPress={share}><Text style={ui.btnPrimaryText}>보내기</Text></Pressable>
          {Platform.OS === 'web' && <Pressable style={[ui.btn, { flex: 1 }]} onPress={copy}><Text style={ui.btnText}>링크 복사</Text></Pressable>}
        </View>
        {!!note && <Text style={[ui.sub, { color: t.primary, fontWeight: '700' }]}>{note}</Text>}
        <TextInput value={code.link} editable={false} multiline style={[ui.input, { height: 70, fontSize: 10 }]} />
        {png ? (
          <>
            <Image source={{ uri: png }} style={{ width: 280, height: 310, alignSelf: 'center', borderRadius: 12 }} resizeMode="contain" />
            <Pressable style={ui.btn} onPress={() => saveQrPng(png, `gudo-team-${sending.label}.png`.replace(/[\\/:*?"<>|\s]+/g, '_'))}>
              <Text style={ui.btnText}>QR 이미지 저장</Text>
            </Pressable>
          </>
        ) : !fitsQr ? <Text style={[ui.sub, { fontSize: 12 }]}>내용이 많아 QR 한 장에 담기 어려워요 — 링크로 보내 주세요.</Text> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 10, maxWidth: 560, width: '100%', alignSelf: 'center' },
  h2: { fontSize: 15, fontWeight: '800', marginTop: 10 },
  box: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  dot: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 13, fontWeight: '700' },
  who: { fontSize: 13, fontWeight: '700' },
  name: { width: 84, paddingVertical: 6, fontSize: 13 },
  small: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 },
});
