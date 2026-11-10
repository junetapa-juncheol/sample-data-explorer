export const stops = [
  ['바람숲 산책길', '산책', '모래별 북쪽', 45, 0],
  ['작은 파도 전망대', '풍경', '모래별 해안', 30, 0],
  ['모래정원 전시관', '문화', '모래별 중심', 60, 5000],
  ['달빛 책방 거리', '문화', '모래별 중심', 40, 0],
  ['오후의 차 정원', '휴식', '모래별 남쪽', 50, 7000],
  ['노을 자전거 길', '산책', '모래별 해안', 90, 3000],
  ['여울 생태 공원', '풍경', '모래별 북쪽', 75, 0],
  ['돌담 공예 체험소', '문화', '모래별 남쪽', 80, 12000],
];

export const countrySamples = {
  KR: { name: 'South Korea', capital: 'Seoul', currency: 'KRW', continent: { name: 'Asia' } },
  JP: { name: 'Japan', capital: 'Tokyo', currency: 'JPY', continent: { name: 'Asia' } },
  FR: { name: 'France', capital: 'Paris', currency: 'EUR', continent: { name: 'Europe' } },
};

export const weatherSample = { temperature_2m: 4.6, weather_code: 0, time: '2026-11-10T09:45' };
export const weatherUrl = 'https://api.open-meteo.com/v1/forecast?latitude=37.5665&longitude=126.9780&current=temperature_2m,weather_code&timezone=Asia%2FSeoul';
export const countryUrl = 'https://countries.trevorblades.com/';

export async function fetchJson(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(7000) });
  if (!response.ok) throw new Error('연결 응답을 확인할 수 없습니다.');
  return response.json();
}

export function validateQuery(sql) {
  const plain = sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--[^\n]*/g, '').trim();
  if (!/^(SELECT|WITH)\b/i.test(plain)) throw new Error('SELECT 또는 WITH로 시작하는 조회문을 입력해 주세요.');
  return plain;
}
