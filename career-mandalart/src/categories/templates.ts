// 연령대별 81칸 템플릿 — 처음 쓰는 사람이 빈 81칸 앞에서 막히지 않도록 미리 채운 청사진.
//
// 설계 근거 (docs/templates.md)
//  - 연령대별 주제: Erikson 심리사회적 발달 단계 + Pew 삶의 의미 조사(연령대별 언급 영역)
//    + 키워드 자산 v1 연령대별 카테고리 비율(20~50대) + WHO 건강한 노화(60대 이상)
//  - 세부 목표 8개 = 그 연령대에서 비중이 큰 1레벨 카테고리
//  - 실행 과제 64개 = 2레벨 세부 카테고리(tree.ts) 의 3레벨 행동 + 단위
//
// 실행 과제 표기 (한 줄 = 한 칸)
//   "세부카테고리:행동 @언제 ~얼마나 #수량단위 ^언제까지 &어디서 =어디로"
//   - 세부카테고리는 블록 카테고리의 것. 다른 카테고리 것이면 "카테고리/세부카테고리:"
//   - #은 여러 번 쓸 수 있다 (예: #3회 #5km)
import type { AgeBand } from './data';
import { composeText } from './units';
import { ActionSpec, CENTER, newPlan, Plan, setCell } from '../model';

export type Template = {
  age: AgeBand;
  theme: string; // 이 연령대의 큰 주제 (발달 과업)
  basis: string; // 근거 한 줄
  core: string;
  goals: { cat: string; text: string; actions: string[] }[]; // 8개, 바깥 블록 0,1,2,3,5,6,7,8 순서
};

export const TEMPLATES: Template[] = [
  {
    age: '10s',
    theme: '정체성 — 나는 누구이고 무엇을 좋아하는가',
    basis: 'Erikson 정체성 단계 · Pew: 젊은 층일수록 배움 · 친구를 삶의 의미로 더 자주 언급',
    core: '나다운 꿈을 찾는 10대',
    goals: [
      { cat: 'growth', text: '공부 습관', actions: [
        'school:교과 복습하기 @매일 ~1시간', 'school:오답 노트 쓰기 @주 3회 #10개', 'school:모의고사 풀기 @매월 1회',
        'school:수업 질문하기 @매주 #3회', 'reading:책 읽기 @매달 #2권', 'language:단어 외우기 @매일 #30개',
        'coding:코딩 연습하기 @주말 ~2시간', 'course:온라인 강의 듣기 @방학마다 #10강',
      ] },
      { cat: 'career', text: '진로 찾기', actions: [
        'path:관심 직업 조사하기 #10개 ^올해 안에', 'direction:현직자 인터뷰하기 #3명 ^올해 안에', 'path:진로 체험하기 @방학마다',
        'path:전공 정보 찾아보기 #5개 ^이번 학기 안에', 'direction:적성 검사 받기 ^이번 달까지', 'network/mentor:멘토 찾기 #1명 ^올해 안에',
        'cert:자격증 하나 따기 ^1년 안에', 'startup:작은 프로젝트 만들기 #1개 ^방학 안에',
      ] },
      { cat: 'health', text: '체력 · 생활', actions: [
        'exercise:달리기 @주 3회 #3km', 'sleep:7시간 이상 자기 @매일', 'sleep:자기 전 화면 끄기 @매일',
        'diet:아침 먹기 @매일', 'exercise:요가 · 스트레칭 @매일 ~10분', 'diet:물 마시기 @매일 #6잔',
        'exercise:운동 동아리 하기 @매주', 'mental:고민 털어놓기 @힘들 때',
      ] },
      { cat: 'relationship', text: '친구 · 가족', actions: [
        'friends:친구와 시간 보내기 @주말', 'parents:부모님과 대화하기 @매일 ~10분', 'family:가족 식사하기 @주 3회',
        'friends:친구 생일 챙기기', 'friends:고마운 친구에게 편지 쓰기 ^올해 안에', 'family:형제 · 자매와 놀기 @주말',
        'parents:집안일 돕기 @주 2회', 'family:가족 여행 가기 #1회 ^올해 안에',
      ] },
      { cat: 'experience', text: '도전 · 취미', actions: [
        'music:악기 연습하기 @주 3회 ~30분', 'outdoor:등산하기 @한 달에 1회', 'culture:공연 보기 @분기마다',
        'create:그림 그리기 @주말', 'travel:친구와 여행 가기 ^방학 안에', 'adventure:서핑 배우기 ^여름 방학 안에',
        'cooking:새 요리 해보기 #5개 ^방학 안에', 'create:사진 찍기 @매일 #1장',
      ] },
      { cat: 'mindset', text: '나를 알기', actions: [
        'journal:일기 쓰기 @매일 ~10분', 'values:버킷리스트 정리하기 #20개', 'journal:주간 회고하기 @일요일 저녁',
        'detox:폰 없이 지내기 @매일 ~1시간', 'meditation:명상하기 @자기 전 ~5분', 'journal:감사한 일 쓰기 @매일 #3개',
        'values:좋아하는 것 적어보기 #30개', 'failure:실패 노트 쓰기 @시험 끝나고',
      ] },
      { cat: 'money', text: '용돈 관리', actions: [
        'pocket:용돈 기록하기 @매일', 'pocket:용돈 저축하기 @매달 #3만원', 'saving:무지출 데이 지키기 @매주 #2일',
        'invest:경제 뉴스 읽기 @주 1회', 'pocket:갖고 싶은 것 위해 모으기 #20만원 ^올해 안에', 'side:중고 거래 해보기 #1회',
        'saving:내 통장 만들기 ^이번 달까지', 'income:아르바이트 경험하기 ^방학 안에',
      ] },
      { cat: 'recognition', text: '나의 기록', actions: [
        'portfolio:작업물 정리하기 #10개', 'writing:블로그 쓰기 @매주 #1편', 'award:공모전 출품하기 #2회 ^올해 안에',
        'sns:영상 올리기 #5편', 'portfolio:활동 기록 정리하기 @학기마다', 'speaking:발표 자원하기 #3회',
        'award:수상 · 자격 하나 얻기 ^졸업 전', 'image:나만의 스타일 찾기',
      ] },
    ],
  },
  {
    age: '20s',
    theme: '자립과 친밀감 — 첫 커리어 · 첫 자산 · 깊은 관계',
    basis: 'Erikson 친밀감 단계 · 키워드 자산: 20대 글에서 재무 비중 최고 · Pew: 18~29세 "많은 돈" 중시 35%',
    core: '나만의 길 위에 서는 20대',
    goals: [
      { cat: 'career', text: '첫 커리어', actions: [
        'direction:현직자 인터뷰하기 #5명 ^3개월 안에', 'move:이력서 업데이트하기 @분기마다', 'move:지원하기 #20회 ^6개월 안에',
        'move:면접 준비하기 @주 2회 ~1시간', 'cert:자격증 공부하기 @평일 ~1시간 ^6개월 안에', 'expertise:업무 사례 정리하기 @매월 #2개',
        'startup:사이드 프로젝트 출시하기 #1개 ^올해 안에', 'global:영어 면접 준비하기 @주 1회 ~1시간',
      ] },
      { cat: 'money', text: '돈 관리 시작', actions: [
        'saving:비상금 모으기 #300만원 ^1년 안에', 'saving:자동이체로 저축하기 @매월 1일 #50만원', 'saving:지출 기록하기 @매일',
        'debt:학자금 갚기 @매월 #20만원', 'invest:투자 공부하기 @주말 ~2시간', 'invest:적립식 투자하기 @매월 #20만원',
        'retire:연금 계좌 납입하기 @매월 #10만원', 'income:연봉 협상하기 #1회 ^올해 안에',
      ] },
      { cat: 'growth', text: '배움', actions: [
        'language:단어 외우기 @매일 #30개', 'language:회화 수업 듣기 @주 2회', 'reading:책 읽기 @매달 #2권',
        'coding:AI 도구 써보기 @매주 #1개', 'course:온라인 강의 듣기 #20강 ^3개월 안에', 'write:글쓰기 @매일 ~15분',
        'degree:대학원 알아보기 ^올해 안에', 'skill:새 기술 배우기 @주말 ~3시간',
      ] },
      { cat: 'health', text: '체력', actions: [
        'exercise:근력 운동하기 @주 3회 ~1시간 &헬스장', 'exercise:달리기 @주말 #5km', 'exercise:마라톤 완주하기 #1회 ^올해 안에',
        'sleep:7시간 이상 자기 @매일', 'diet:집밥 해먹기 @주 4회', 'quit:술자리 줄이기 @주 1회 이하로',
        'mental:온전히 쉬는 날 지키기 @매주 #1일', 'checkup:건강검진 받기 @매년',
      ] },
      { cat: 'relationship', text: '관계', actions: [
        'friends:친구 모임 갖기 @매월', 'partner:새로운 사람 만나기 @한 달에 2회', 'partner:데이트하기 @매주',
        'parents:부모님 찾아뵙기 @한 달에 1회', 'parents:안부 전화하기 @매주', 'friends:먼저 연락하기 @매주 #1명',
        'friends:친구 생일 챙기기', 'family:가족 식사하기 @한 달에 2회',
      ] },
      { cat: 'network', text: '사람 · 인맥', actions: [
        'events:밋업 참여하기 @한 달에 1회', 'events:컨퍼런스 참석하기 #2회 ^올해 안에', 'mentor:멘토 찾기 #1명 ^3개월 안에',
        'mentor:커피챗 요청하기 @매월 #1명', 'profile:링크드인 정리하기 ^이번 달까지', 'profile:경험 글 공유하기 @매월 #1편',
        'study:스터디 참여하기 @주 1회', 'comm:스피치 연습하기 @주 1회 ~30분',
      ] },
      { cat: 'experience', text: '경험', actions: [
        'travel:혼자 여행하기 #1회 ^올해 안에', 'travel:한 달 살기 =해외 #30일 ^3년 안에', 'adventure:스카이다이빙 하기 ^30살 전',
        'music:악기 연습하기 @주 2회 ~30분', 'outdoor:캠핑 가기 @분기마다', 'culture:전시 보기 @한 달에 1회',
        'create:사진 찍기 @매주 #10장', 'cooking:새 요리 해보기 @매월 #2개',
      ] },
      { cat: 'mindset', text: '마음', actions: [
        'journal:일기 쓰기 @자기 전 ~10분', 'journal:주간 회고하기 @일요일 저녁', 'values:인생 원칙 쓰기 #10개 ^올해 안에',
        'values:버킷리스트 정리하기 #50개', 'meditation:명상하기 @매일 아침 ~10분', 'detox:폰 없이 지내기 @주말 ~3시간',
        'failure:실패 노트 쓰기 @매월', 'journal:감사한 일 쓰기 @매일 #3개',
      ] },
    ],
  },
  {
    age: '30s',
    theme: '기반 — 일 · 가정 · 자산을 함께 세우기',
    basis: '키워드 자산: 30대 글의 관계 53% · 커리어 · 안정 비중 높음 · Pew: 30~49세 일과 가족이 삶의 의미 상위',
    core: '일 · 가정 · 자산의 기반을 다지는 30대',
    goals: [
      { cat: 'career', text: '전문성 · 리더십', actions: [
        'expertise:전문 분야 공부하기 @평일 아침 ~1시간', 'expertise:기술 글 쓰기 @매월 #2편', 'promotion:성과 기록하기 @매주 금요일',
        'promotion:1:1 면담하기 @분기마다', 'lead:프로젝트 리딩하기 #2개 ^올해 안에', 'lead:팀원과 1:1 하기 @격주',
        'move:이력서 업데이트하기 @반기마다', 'startup:사이드 프로젝트 출시하기 #1개 ^1년 안에',
      ] },
      { cat: 'money', text: '자산 형성', actions: [
        'saving:6개월치 비상금 모으기 ^1년 안에', 'saving:자동이체로 저축하기 @매월 1일 #100만원', 'invest:적립식 투자하기 @매월 #50만원',
        'invest:포트폴리오 점검하기 @분기마다', 'debt:대출 원금 상환하기 @매월 #50만원', 'income:연봉 협상하기 @매년',
        'side:월 부수입 만들기 #30만원 ^1년 안에', 'retire:연금 계좌 납입하기 @매월 #30만원',
      ] },
      { cat: 'stability', text: '내 집 · 안정', actions: [
        'home:청약 넣기 @공고 날 때마다', 'home:임장 다니기 @한 달에 2회', 'home:주택 자금 모으기 #5000만원 ^3년 안에',
        'insurance:보험 점검하기 @매년', 'tidy:안 쓰는 물건 비우기 @매월 #10개', 'car:차 구입 자금 모으기 #1000만원 ^2년 안에',
        'indep:살고 싶은 도시 답사하기 #3회 ^올해 안에', 'insurance:실손 · 연금 보험 정리하기 ^이번 달까지',
      ] },
      { cat: 'relationship', text: '가족', actions: [
        'partner:배우자와 데이트하기 @주 1회', 'kids:아이와 놀기 @매일 ~1시간', 'kids:책 읽어주기 @자기 전 #1권',
        'family:가족 여행 가기 #2회 ^올해 안에', 'parents:부모님 찾아뵙기 @한 달에 1회', 'parents:안부 전화하기 @주 1회',
        'friends:친구 모임 갖기 @분기마다', 'family:가족 식사하기 @주 3회',
      ] },
      { cat: 'health', text: '건강 관리', actions: [
        'exercise:근력 운동하기 @주 3회 ~50분', 'exercise:걷기 @매일 #8000보', 'checkup:종합 건강검진 받기 @매년',
        'body:체중 기록하기 @매일 아침', 'diet:야식 끊기 @평일', 'sleep:7시간 이상 자기 @매일',
        'mental:번아웃 체크하기 @매월', 'quit:무알코올 데이 지키기 @매주 #4일',
      ] },
      { cat: 'growth', text: '성장', actions: [
        'reading:책 읽기 @매달 #2권', 'language:회화 수업 듣기 @주 2회', 'coding:AI 도구 써보기 @매주 #1개',
        'course:수료증 받기 #2개 ^올해 안에', 'skill:새 기술 배우기 @주말 ~2시간', 'reading:독서 모임 하기 @한 달에 1회',
        'write:글 한 편 완성하기 @매월 #1편', 'degree:대학원 지원하기 ^2년 안에',
      ] },
      { cat: 'network', text: '네트워크', actions: [
        'events:컨퍼런스 참석하기 #2회 ^올해 안에', 'events:만난 사람 연락처 정리하기 @매월', 'community:모임 열기 @분기마다',
        'profile:경험 글 공유하기 @매월 #1편', 'mentor:멘토에게 근황 공유하기 @반기마다', 'comm:피드백 요청하기 @분기마다',
        'study:스터디 참여하기 @주 1회', 'profile:사람과 사람 연결하기 #5명 ^올해 안에',
      ] },
      { cat: 'mindset', text: '균형', actions: [
        'balance:정시 퇴근하기 @주 3회', 'balance:휴가 쓰기 #10일 ^올해 안에', 'balance:쉬는 일정 먼저 잡기 @매월',
        'meditation:명상하기 @매일 ~10분', 'journal:주간 회고하기 @일요일 밤', 'detox:SNS 끊기 @주말',
        'values:사명 선언문 쓰기 ^올해 안에', 'journal:감사한 일 쓰기 @매일 #3개',
      ] },
    ],
  },
  {
    age: '40s',
    theme: '생산성 — 전문가로 서고 다음 세대를 돌보기',
    basis: 'Erikson 생산성 단계 · Pew: 일 · 가족 비중 최고 구간 · 재무 마일스톤: 40세 은퇴자금 연소득 2배',
    core: '전문가로 서고 가족과 노후를 함께 준비하는 40대',
    goals: [
      { cat: 'career', text: '커리어 정점', actions: [
        'lead:팀원과 1:1 하기 @격주', 'lead:리더십 책 읽기 @분기마다 #1권', 'promotion:성과 기록하기 @매주',
        'expertise:업무 사례 정리하기 @매월 #1개', 'second:경력 정리하기 ^올해 안에', 'second:새 분야 배우기 @주말 ~2시간',
        'startup:사업 아이디어 검증하기 #3개 ^1년 안에', 'promotion:연봉 협상하기 @매년',
      ] },
      { cat: 'money', text: '노후 · 교육비', actions: [
        'retire:은퇴 자금 계산하기 ^이번 달까지', 'retire:연금 계좌 납입하기 @매월 #50만원', 'edu:교육비 적립하기 @매월 #30만원',
        'invest:포트폴리오 점검하기 @분기마다', 'debt:대출 원금 상환하기 @매월 #100만원', 'saving:지출 기록하기 @매주',
        'side:월 부수입 만들기 #50만원 ^2년 안에', 'retire:은퇴 후 월 현금흐름 설계하기 ^올해 안에',
      ] },
      { cat: 'health', text: '건강 지키기', actions: [
        'checkup:종합 건강검진 받기 @매년', 'checkup:혈압 · 혈당 재기 @매주', 'exercise:근력 운동하기 @주 3회 ~40분',
        'exercise:걷기 @매일 #8000보', 'body:체지방 줄이기 #5kg ^6개월 안에', 'sleep:같은 시간에 일어나기 @매일',
        'quit:술자리 줄이기 @주 1회 이하로', 'checkup:치과 정기 검진 @반기마다',
      ] },
      { cat: 'relationship', text: '가족', actions: [
        'partner:배우자와 데이트하기 @주 1회', 'kids:아이와 대화하기 @매일 ~20분', 'kids:학교 행사 참여하기 @학기마다',
        'family:가족 여행 가기 #2회 ^올해 안에', 'parents:부모님 찾아뵙기 @한 달에 2회', 'parents:부모님 노후 함께 계획하기 ^올해 안에',
        'friends:오래된 친구에게 연락하기 @매월 #1명', 'family:가족 식사하기 @주 3회',
      ] },
      { cat: 'contribution', text: '후배 · 나눔', actions: [
        'mentoring:후배 멘토링하기 @매월 #2명', 'mentoring:커리어 상담해주기 @분기마다', 'share:노하우 글 쓰기 @매월 #1편',
        'share:무료 강의하기 #2회 ^올해 안에', 'volunteer:봉사 활동하기 @한 달에 1회 ~3시간', 'donation:정기 기부하기 @매월 #3만원',
        'social:캠페인 참여하기 #2회 ^올해 안에', 'climate:텀블러 쓰기 @매일',
      ] },
      { cat: 'growth', text: '새로운 배움', actions: [
        'reading:책 읽기 @매달 #2권', 'coding:AI 도구 써보기 @매주 #1개', 'language:회화 수업 듣기 @주 1회',
        'course:온라인 강의 듣기 @매주 #2강', 'skill:새 기술 배우기 @주말 ~2시간', 'reading:독서 모임 하기 @한 달에 1회',
        'write:글 한 편 완성하기 @매월 #1편', 'degree:전문 과정 알아보기 ^올해 안에',
      ] },
      { cat: 'mindset', text: '의미 · 균형', actions: [
        'values:인생 원칙 쓰기 #10개', 'journal:주간 회고하기 @일요일 밤', 'meditation:명상하기 @매일 ~10분',
        'balance:휴가 쓰기 #15일 ^올해 안에', 'detox:폰 없이 지내기 @저녁 ~2시간', 'values:나의 다음 10년 쓰기 ^올해 안에',
        'journal:감사한 일 쓰기 @매일 #3개', 'balance:정시 퇴근하기 @주 3회',
      ] },
      { cat: 'recognition', text: '평판 · 강연', actions: [
        'speaking:발표 신청하기 #2회 ^올해 안에', 'speaking:세미나 열기 @반기마다', 'writing:뉴스레터 발행하기 @매월',
        'book:목차 짜기 ^6개월 안에', 'book:원고 쓰기 @주말 #10페이지', 'award:인증 취득하기 #1개 ^올해 안에',
        'sns:게시물 올리기 @매주 #1편', 'image:프로필 사진 찍기 ^이번 달까지',
      ] },
    ],
  },
  {
    age: '50s',
    theme: '전환 — 두 번째 커리어와 건강한 노후 설계',
    basis: 'Pew: 50세 이후 물질적 안정 · 건강이 삶의 의미 상위(한국은 물질적 안정 1위) · 키워드 자산: 50대 인정 · 기여 비중 상승',
    core: '두 번째 커리어와 건강한 노후를 설계하는 50대',
    goals: [
      { cat: 'career', text: '두 번째 커리어', actions: [
        'second:경력 정리하기 ^6개월 안에', 'second:자문 · 강의하기 @매월', 'second:새 분야 배우기 @주 2회 ~2시간',
        'cert:자격증 공부하기 @평일 ~1시간 ^1년 안에', 'startup:사업 아이디어 검증하기 #2개 ^1년 안에', 'expertise:업무 사례 정리하기 @매월 #2개',
        'lead:후임 키우기 ^1년 안에', 'move:전직 상담 받기 #2회 ^올해 안에',
      ] },
      { cat: 'money', text: '은퇴 준비', actions: [
        'retire:은퇴 후 월 현금흐름 설계하기 ^올해 안에', 'retire:연금 계좌 납입하기 @매월 #100만원', 'retire:은퇴 자금 계산하기 @매년',
        'invest:포트폴리오 점검하기 @분기마다', 'debt:대출 원금 상환하기 @매월 #100만원', 'side:월 부수입 만들기 #100만원 ^3년 안에',
        'saving:지출 기록하기 @매주', 'retire:국민연금 예상액 확인하기 ^이번 달까지',
      ] },
      { cat: 'health', text: '건강 관리', actions: [
        'checkup:종합 건강검진 받기 @매년', 'checkup:혈압 · 혈당 재기 @매일 아침', 'exercise:걷기 @매일 #10000보',
        'exercise:근력 운동하기 @주 3회 ~40분', 'mobility:균형 운동하기 @매일 ~10분', 'diet:채소 · 단백질 챙기기 @매일',
        'quit:금연 · 절주 지키기 @매일', 'sleep:7시간 이상 자기 @매일',
      ] },
      { cat: 'relationship', text: '가족 · 부부', actions: [
        'partner:배우자와 함께하는 취미 만들기 ^올해 안에', 'partner:배우자와 산책하기 @주 3회', 'kids:자녀와 대화하기 @매주',
        'parents:부모님 찾아뵙기 @매주', 'family:가족 여행 가기 #2회 ^올해 안에', 'friends:친구 모임 갖기 @매월',
        'family:가족 식사하기 @매주 일요일', 'friends:오래된 친구에게 연락하기 @매월 #1명',
      ] },
      { cat: 'contribution', text: '경험 나누기', actions: [
        'mentoring:후배 멘토링하기 @매월 #2명', 'share:무료 강의하기 @분기마다', 'share:노하우 글 쓰기 @매월 #1편',
        'volunteer:재능 기부하기 @한 달에 1회', 'volunteer:봉사 활동하기 @한 달에 2회 ~3시간', 'donation:정기 기부하기 @매월 #5만원',
        'legacy:다음 세대에 남길 것 정리하기 ^3년 안에', 'social:문제 해결 프로젝트 하기 #1개 ^2년 안에',
      ] },
      { cat: 'experience', text: '하고 싶던 것', actions: [
        'travel:여행 가기 =해외 #2회 ^올해 안에', 'outdoor:명산 완등하기 #10곳 ^3년 안에', 'music:악기 연습하기 @주 3회 ~30분',
        'cooking:요리 수업 듣기 @한 달에 2회', 'garden:텃밭 가꾸기 @주말', 'culture:공연 보기 @한 달에 1회',
        'create:그림 그리기 @주 1회 ~2시간', 'travel:한 달 살기 =제주 #30일 ^5년 안에',
      ] },
      { cat: 'mindset', text: '인생 정리', actions: [
        'memoir:회고록 쓰기 @매주 #5페이지', 'memoir:사진 · 기록 정리하기 @매월 #100장', 'values:인생 원칙 쓰기 #10개',
        'values:버킷리스트 정리하기 #30개', 'meditation:명상하기 @매일 아침 ~15분', 'journal:감사한 일 쓰기 @매일 #3개',
        'journal:주간 회고하기 @일요일', 'detox:폰 없이 지내기 @저녁 ~2시간',
      ] },
      { cat: 'network', text: '공동체', actions: [
        'local:지역 모임 참여하기 @한 달에 2회', 'study:동호회 가입하기 ^3개월 안에', 'study:모임 개근하기 #12회 ^올해 안에',
        'community:모임 열기 @분기마다', 'events:만난 사람 연락처 정리하기 @매월', 'local:동네 활동 하기 @매주',
        'comm:경청 연습하기 @매일', 'profile:경험 글 공유하기 @매월 #1편',
      ] },
    ],
  },
  {
    age: '60s',
    theme: '통합의 시작 — 은퇴 후에도 일 · 건강 · 관계가 살아 있는 삶',
    basis: 'Erikson 통합 단계 · WHO 건강한 노화(기능 유지 · 사회 참여) · Pew: 노년층 건강 · 즐거운 일 중시',
    core: '은퇴 후에도 일 · 건강 · 관계가 살아 있는 60대',
    goals: [
      { cat: 'health', text: '건강 · 근력', actions: [
        'exercise:걷기 @매일 #7000보', 'mobility:하체 근력 운동하기 @주 3회 ~30분', 'mobility:균형 운동하기 @매일 ~10분',
        'checkup:종합 건강검진 받기 @매년', 'checkup:혈압 · 혈당 재기 @매일 아침', 'checkup:치과 정기 검진 @반기마다',
        'exercise:수영하기 @주 2회 &수영장', 'sleep:같은 시간에 일어나기 @매일',
      ] },
      { cat: 'money', text: '은퇴 생활비', actions: [
        'retire:은퇴 후 월 현금흐름 설계하기 ^이번 달까지', 'retire:연금 수령 계획 세우기 ^3개월 안에', 'saving:지출 기록하기 @매주',
        'invest:포트폴리오 점검하기 @반기마다', 'side:월 부수입 만들기 #50만원 ^1년 안에', 'retire:의료비 비상금 모으기 #1000만원 ^2년 안에',
        'saving:생활비 예산 지키기 @매월', 'retire:자산 목록 정리하기 ^올해 안에',
      ] },
      { cat: 'relationship', text: '부부 · 가족', actions: [
        'partner:배우자와 산책하기 @매일 ~30분', 'partner:배우자와 여행하기 @분기마다', 'kids:자녀와 통화하기 @매주',
        'family:손주와 시간 보내기 @매주', 'family:가족 식사하기 @한 달에 2회', 'friends:친구 모임 갖기 @매월',
        'friends:오래된 친구에게 연락하기 @매월 #2명', 'parents:부모님 찾아뵙기 @매주',
      ] },
      { cat: 'experience', text: '하고 싶던 일', actions: [
        'travel:여행 가기 =해외 #2회 ^올해 안에', 'travel:한 달 살기 =제주 #30일 ^2년 안에', 'garden:텃밭 가꾸기 @주 3회',
        'music:악기 연습하기 @매일 ~30분', 'outdoor:등산하기 @주 1회', 'create:그림 그리기 @주 2회',
        'cooking:새 요리 해보기 @매월 #2개', 'culture:공연 보기 @한 달에 1회',
      ] },
      { cat: 'contribution', text: '나눔', actions: [
        'volunteer:봉사 활동하기 @주 1회 ~3시간', 'mentoring:후배 멘토링하기 @매월 #2명', 'share:무료 강의하기 @분기마다',
        'volunteer:재능 기부하기 @한 달에 1회', 'donation:정기 기부하기 @매월 #5만원', 'legacy:다음 세대에 남길 것 정리하기 ^올해 안에',
        'climate:플로깅 하기 @한 달에 1회', 'social:캠페인 참여하기 #2회 ^올해 안에',
      ] },
      { cat: 'growth', text: '배움', actions: [
        'lifelong:평생교육 강좌 등록하기 #2개 ^올해 안에', 'coding:스마트폰 · AI 활용 배우기 @주 1회 ~1시간', 'language:회화 수업 듣기 @주 2회',
        'reading:책 읽기 @매달 #2권', 'reading:독서 모임 하기 @한 달에 1회', 'write:글쓰기 @매일 ~20분',
        'lifelong:배우고 싶은 분야 정하기 ^이번 달까지', 'skill:새 기술 배우기 @주말 ~2시간',
      ] },
      { cat: 'network', text: '이웃 · 모임', actions: [
        'local:지역 모임 참여하기 @한 달에 2회', 'local:동네 활동 하기 @매주', 'study:동호회 가입하기 ^3개월 안에',
        'community:모임 열기 @분기마다', 'study:모임 개근하기 #12회 ^올해 안에', 'comm:경청 연습하기 @매일',
        'events:동창 모임 나가기 @반기마다', 'profile:경험 글 공유하기 @매월 #1편',
      ] },
      { cat: 'mindset', text: '인생 정리', actions: [
        'memoir:회고록 쓰기 @매주 #5페이지', 'memoir:사진 · 기록 정리하기 @매월 #100장', 'meditation:명상하기 @매일 아침 ~15분',
        'journal:일기 쓰기 @매일 ~10분', 'values:버킷리스트 정리하기 #30개', 'journal:감사한 일 쓰기 @매일 #3개',
        'values:인생 원칙 쓰기 #10개', 'detox:폰 없이 지내기 @저녁 ~1시간',
      ] },
    ],
  },
  {
    age: '70s',
    theme: '활동적 노년 — 스스로 움직이고 배우며 나누기',
    basis: 'WHO 건강한 노화: 이동 능력 · 사회적 연결 · 배움 지속 · Erikson 통합 단계',
    core: '스스로 움직이고 즐겁게 배우며 나누는 70대',
    goals: [
      { cat: 'health', text: '근력 · 균형', actions: [
        'mobility:하체 근력 운동하기 @주 3회 ~20분', 'mobility:균형 운동하기 @매일 ~10분', 'mobility:실내 걷기 @매일 #5000보',
        'checkup:혈압 · 혈당 재기 @매일 아침', 'checkup:종합 건강검진 받기 @매년', 'checkup:영양제 챙기기 @매일',
        'diet:물 마시기 @매일 #6잔', 'sleep:같은 시간에 일어나기 @매일',
      ] },
      { cat: 'stability', text: '안전한 집', actions: [
        'care:집 안전 손잡이 설치하기 ^3개월 안에', 'care:가까운 병원 정리하기 #3곳', 'care:요양 · 돌봄 정보 알아보기 ^올해 안에',
        'tidy:안 쓰는 물건 비우기 @매월 #10개', 'legacy:유언장 쓰기 ^올해 안에', 'legacy:가족 자산 목록 정리하기 ^6개월 안에',
        'insurance:보험 점검하기 @매년', 'care:비상 연락망 만들기 ^이번 달까지',
      ] },
      { cat: 'relationship', text: '가족', actions: [
        'family:손주와 시간 보내기 @매주', 'kids:자녀와 통화하기 @주 2회', 'partner:배우자와 산책하기 @매일 ~30분',
        'family:가족 식사하기 @한 달에 2회', 'family:가족 여행 가기 #1회 ^올해 안에', 'friends:친구 모임 갖기 @매월',
        'friends:먼저 연락하기 @매주 #1명', 'family:가족 사진 찍기 @명절마다',
      ] },
      { cat: 'network', text: '이웃 · 친구', actions: [
        'local:복지관 프로그램 참여하기 @주 2회', 'study:동호회 가입하기 ^3개월 안에', 'local:지역 모임 참여하기 @한 달에 2회',
        'local:이웃과 인사하기 @매일', 'community:모임 열기 @분기마다', 'comm:경청 연습하기 @매일',
        'study:노래 교실 다니기 @주 1회', 'events:동창 모임 나가기 @반기마다',
      ] },
      { cat: 'experience', text: '즐거움', actions: [
        'garden:텃밭 가꾸기 @주 3회', 'travel:여행 가기 =국내 #3회 ^올해 안에', 'music:노래 · 악기 즐기기 @주 2회 ~30분',
        'create:그림 그리기 @주 2회', 'culture:공연 보기 @한 달에 1회', 'outdoor:둘레길 걷기 @주 1회',
        'cooking:가족에게 요리 해주기 @주말', 'create:사진 찍기 @매주 #10장',
      ] },
      { cat: 'growth', text: '배움', actions: [
        'lifelong:평생교육 강좌 등록하기 #1개 ^올해 안에', 'coding:스마트폰 활용 배우기 @주 1회 ~1시간', 'reading:책 읽기 @매달 #1권',
        'reading:신문 읽기 @매일 아침 ~20분', 'write:글쓰기 @매일 ~15분', 'language:한자 · 외국어 공부하기 @매일 ~20분',
        'skill:새 취미 기술 배우기 @주 1회', 'reading:독서 모임 하기 @한 달에 1회',
      ] },
      { cat: 'contribution', text: '나눔', actions: [
        'volunteer:봉사 활동하기 @주 1회 ~2시간', 'mentoring:경험 이야기해주기 @매월', 'legacy:다음 세대에 남길 것 정리하기 ^올해 안에',
        'donation:정기 기부하기 @매월 #3만원', 'volunteer:재능 기부하기 @한 달에 1회', 'climate:대중교통 타기 @매일',
        'share:노하우 글 쓰기 @매월 #1편', 'legacy:장학금 만들기 ^3년 안에',
      ] },
      { cat: 'mindset', text: '인생 기록', actions: [
        'memoir:회고록 쓰기 @매주 #3페이지', 'memoir:사진 · 기록 정리하기 @매월 #50장', 'journal:감사한 일 쓰기 @매일 #3개',
        'meditation:명상하기 @매일 ~10분', 'values:버킷리스트 정리하기 #20개', 'journal:일기 쓰기 @매일 ~10분',
        'values:가족에게 편지 쓰기 @명절마다', 'meditation:호흡 연습하기 @자기 전 ~5분',
      ] },
    ],
  },
  {
    age: '80s',
    theme: '자립과 연결 — 내 힘으로 하루를 살고 사랑하는 이들과 함께',
    basis: 'WHO 건강한 노화: 일상 기능 유지 · 낙상 예방 · 외로움 줄이기 · Erikson 통합(삶을 받아들이기)',
    core: '내 힘으로 하루를 살고 사랑하는 이들과 함께하는 80대',
    goals: [
      { cat: 'health', text: '몸 지키기', actions: [
        'mobility:하체 근력 운동하기 @매일 ~15분', 'mobility:균형 운동하기 @매일 ~10분', 'mobility:실내 걷기 @매일 #3000보',
        'checkup:혈압 · 혈당 재기 @매일 아침', 'checkup:약 챙겨 먹기 @매일', 'diet:물 마시기 @매일 #6잔',
        'diet:세 끼 챙겨 먹기 @매일', 'sleep:같은 시간에 일어나기 @매일',
      ] },
      { cat: 'stability', text: '안전 · 돌봄', actions: [
        'care:집 안전 손잡이 설치하기 ^이번 달까지', 'care:비상 연락망 만들기 ^이번 달까지', 'care:요양 · 돌봄 정보 알아보기 ^3개월 안에',
        'care:가까운 병원 정리하기 #2곳', 'tidy:안 쓰는 물건 비우기 @매월 #5개', 'legacy:유언장 쓰기 ^6개월 안에',
        'legacy:가족 자산 목록 정리하기 ^3개월 안에', 'care:미끄럼 방지 매트 깔기 ^이번 주까지',
      ] },
      { cat: 'relationship', text: '가족', actions: [
        'kids:자녀와 통화하기 @매일', 'family:손주와 시간 보내기 @매주', 'family:가족 식사하기 @매주',
        'partner:배우자와 산책하기 @매일 ~20분', 'friends:친구에게 안부 전화하기 @매주 #2명', 'family:가족 사진 찍기 @명절마다',
        'family:생일 · 기념일 챙기기', 'kids:고맙다고 말하기 @매일',
      ] },
      { cat: 'network', text: '이웃 · 말벗', actions: [
        'local:복지관 프로그램 참여하기 @주 2회', 'local:이웃과 인사하기 @매일', 'study:노래 교실 다니기 @주 1회',
        'local:말벗 모임 참여하기 @주 1회', 'comm:경청 연습하기 @매일', 'local:종교 · 지역 모임 나가기 @매주',
        'community:차 마시는 모임 열기 @한 달에 1회', 'events:동창 모임 나가기 @반기마다',
      ] },
      { cat: 'experience', text: '즐거움', actions: [
        'garden:화분 가꾸기 @매일', 'music:좋아하는 노래 듣기 @매일 ~30분', 'culture:공연 보기 @분기마다',
        'create:그림 그리기 @주 2회', 'travel:가족과 여행 가기 =국내 #1회 ^올해 안에', 'outdoor:공원 산책하기 @매일 ~20분',
        'create:사진 찍기 @매주 #5장', 'cooking:추억의 요리 해보기 @매월 #1개',
      ] },
      { cat: 'mindset', text: '마음 평안', actions: [
        'meditation:호흡 연습하기 @자기 전 ~5분', 'journal:감사한 일 쓰기 @매일 #3개', 'journal:일기 쓰기 @매일 ~10분',
        'meditation:명상하기 @아침 ~10분', 'values:하고 싶은 말 정리하기 #10개', 'memoir:사진 · 기록 정리하기 @매월 #30장',
        'values:버킷리스트 정리하기 #10개', 'meditation:기도 · 묵상하기 @매일',
      ] },
      { cat: 'contribution', text: '이야기 남기기', actions: [
        'legacy:다음 세대에 남길 것 정리하기 ^올해 안에', 'mentoring:경험 이야기해주기 @매월', 'legacy:손주에게 편지 쓰기 @생일마다',
        'mindset/memoir:살아온 이야기 녹음하기 @매주', 'donation:정기 기부하기 @매월 #2만원', 'volunteer:재능 기부하기 @분기마다',
        'legacy:가족 레시피 남기기 #10개', 'legacy:가족사 정리하기 ^올해 안에',
      ] },
      { cat: 'growth', text: '머리 쓰기', actions: [
        'reading:책 읽기 @매달 #1권', 'reading:신문 읽기 @매일 아침', 'coding:영상통화 배우기 ^이번 달까지',
        'write:글쓰기 @매일 ~10분', 'lifelong:평생교육 강좌 등록하기 #1개 ^올해 안에', 'language:한자 공부하기 @매일 ~15분',
        'skill:두뇌 퍼즐 풀기 @매일 ~15분', 'reading:낭독하기 @매일 ~10분',
      ] },
    ],
  },
  {
    age: '90s',
    theme: '감사와 연결 — 오늘을 누리고 이야기를 남기기',
    basis: 'WHO 건강한 노화: 돌봄 속에서도 존엄 · 선택 유지 · Erikson 통합 · 초고령기 연구: 관계와 감사가 삶의 만족 핵심',
    core: '오늘을 감사하며 사랑하는 이들 곁에서 보내는 90대',
    goals: [
      { cat: 'health', text: '몸 돌보기', actions: [
        'mobility:앉아서 하는 체조 @매일 ~10분', 'mobility:실내 걷기 @매일 #1000보', 'checkup:약 챙겨 먹기 @매일',
        'checkup:혈압 재기 @매일 아침', 'diet:물 마시기 @매일 #5잔', 'diet:세 끼 챙겨 먹기 @매일',
        'sleep:낮잠 30분 이내로 자기 @매일', 'checkup:정기 진료 받기 @매월',
      ] },
      { cat: 'stability', text: '돌봄 · 안전', actions: [
        'care:돌봄 서비스 신청하기 ^이번 달까지', 'care:비상 호출기 갖추기 ^이번 주까지', 'care:집 안전 손잡이 설치하기 ^이번 달까지',
        'care:가까운 병원 정리하기 #2곳', 'legacy:유언장 쓰기 ^3개월 안에', 'legacy:사전연명의료의향서 쓰기 ^3개월 안에',
        'tidy:추억 물건 정리하기 @매월 #5개', 'legacy:가족 자산 목록 정리하기 ^3개월 안에',
      ] },
      { cat: 'relationship', text: '가족', actions: [
        'kids:자녀와 통화하기 @매일', 'family:손주와 영상통화하기 @매주', 'family:가족 식사하기 @매주',
        'family:생일 · 기념일 챙기기', 'kids:고맙다고 말하기 @매일', 'family:가족 사진 찍기 @명절마다',
        'friends:친구에게 안부 전화하기 @매주 #1명', 'family:가족에게 옛이야기 들려주기 @매주',
      ] },
      { cat: 'network', text: '말벗', actions: [
        'local:말벗 모임 참여하기 @주 1회', 'local:이웃과 인사하기 @매일', 'local:복지관 프로그램 참여하기 @주 2회',
        'comm:찾아온 사람 반겨 맞기 @매일', 'local:종교 · 지역 모임 나가기 @매주', 'community:차 마시는 모임 열기 @한 달에 1회',
        'local:돌봄 선생님과 대화하기 @매일', 'study:노래 교실 다니기 @주 1회',
      ] },
      { cat: 'mindset', text: '평안', actions: [
        'journal:감사한 일 말하기 @매일 #3개', 'meditation:호흡 연습하기 @자기 전 ~5분', 'meditation:기도 · 묵상하기 @매일',
        'values:하고 싶은 말 정리하기 #10개', 'memoir:사진 · 기록 정리하기 @매월 #20장', 'journal:하루 한 줄 쓰기 @매일',
        'meditation:좋아하는 음악 듣기 @매일 ~30분', 'values:감사 인사 전하기 #10명 ^올해 안에',
      ] },
      { cat: 'experience', text: '작은 즐거움', actions: [
        'garden:화분 가꾸기 @매일', 'outdoor:볕 쬐며 산책하기 @매일 ~15분', 'music:좋아하는 노래 부르기 @매일',
        'culture:가족과 영화 보기 @매월', 'create:색칠하기 @주 2회', 'cooking:좋아하는 음식 먹으러 가기 @매월',
        'travel:고향 다녀오기 #1회 ^올해 안에', 'create:옛 사진 보며 이야기하기 @매주',
      ] },
      { cat: 'contribution', text: '이야기 남기기', actions: [
        'mentoring:손주에게 옛이야기 들려주기 @매주', 'legacy:가족 레시피 남기기 #5개', 'legacy:손주에게 편지 쓰기 @생일마다',
        'legacy:가족사 정리하기 ^올해 안에', 'mindset/memoir:살아온 이야기 녹음하기 @매주', 'donation:기부하기 #1회 ^올해 안에',
        'legacy:물건 나눠줄 사람 정하기 ^6개월 안에', 'volunteer:이웃에게 덕담 건네기 @매일',
      ] },
      { cat: 'growth', text: '머리 쓰기', actions: [
        'reading:신문 읽기 @매일 아침', 'reading:책 읽기 @매달 #1권', 'skill:두뇌 퍼즐 풀기 @매일 ~10분',
        'reading:낭독하기 @매일 ~10분', 'coding:영상통화 하기 @매주', 'write:가족에게 쓰는 글 @매주',
        'language:한자 쓰기 @매일 ~10분', 'lifelong:노래 가사 외우기 @매주 #1곡',
      ] },
    ],
  },
];

export const templateOf = (age: AgeBand) => TEMPLATES.find(t => t.age === age);

const MARKS: Record<string, keyof ActionSpec> = { '@': 'when', '~': 'howLong', '^': 'until', '&': 'where', '=': 'whereTo' };

// "sub:행동 @언제 ~얼마나 #3회 ^언제까지 &어디서 =어디로" → ActionSpec
export function parseAction(line: string, blockCat: string): ActionSpec {
  const [head, ...rest] = line.split(/\s(?=[@~#^&=])/);
  const i = head.indexOf(':');
  const ref = head.slice(0, i);
  const [cat, sub] = ref.includes('/') ? ref.split('/') : [blockCat, ref];
  const spec: ActionSpec = { cat, sub, act: head.slice(i + 1).trim() };
  for (const seg of rest) {
    const mark = seg[0];
    const value = seg.slice(1).trim();
    if (mark === '#') {
      const m = value.match(/^(\d+)(.+)$/);
      if (m) spec.qty = [...(spec.qty ?? []), { n: m[1], unit: m[2] }];
    } else if (MARKS[mark]) {
      (spec as Record<string, string>)[MARKS[mark]] = value;
    }
  }
  return spec;
}

const OUTER = [0, 1, 2, 3, 5, 6, 7, 8];

// 템플릿으로 81칸을 채운 새 청사진
export function planFromTemplate(tpl: Template, label: string): Plan {
  let p = newPlan(`${label} 청사진 — ${tpl.core}`);
  p = setCell(p, CENTER, CENTER, { text: tpl.core });
  tpl.goals.forEach((g, gi) => {
    const b = OUTER[gi];
    p = setCell(p, CENTER, b, { text: g.text, cat: g.cat });
    g.actions.forEach((line, ai) => {
      const spec = parseAction(line, g.cat);
      p = setCell(p, b, OUTER[ai], { text: composeText(spec), spec });
    });
  });
  return p;
}
