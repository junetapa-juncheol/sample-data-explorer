import './style.css';
import './theme.css';
import { countrySamples, countryUrl, fetchJson, weatherSample, weatherUrl } from './data.js';

document.querySelector('#app').innerHTML = `
<div class="shell">
  <header><a href="./" class="brand"><span class="brand-mark" aria-hidden="true">m</span>모래별 관광 안내소</a><nav aria-label="주요 메뉴"><a href="#explore">여행 탐색</a><a href="#sources" class="wide">데이터 안내 ↗</a></nav></header>
  <main id="main">
    <section class="hero"><div><span class="eyebrow">MORAEBYEOL · TRAVEL DESK</span><h1>다음 여행의 힌트를<br>데이터에서 찾아보세요.</h1><p class="lede">날씨를 살피고, 나라를 알아보고, 나만의 조건으로 여행 코스를 골라보세요.</p></div><span class="badge"><span class="dot"></span>브라우저에서 직접 탐색</span></section>
    <div class="metrics"><div class="metric"><span class="metric-label">서울 · 현재 기온</span><strong class="metric-value" id="temperature">— °C</strong><small id="weather-source">날씨 확인 중</small></div><div class="metric"><span class="metric-label">모래별 여행 장소</span><strong class="metric-value">08 <span class="tiny">곳</span></strong><small>가상 지역의 추천 코스</small></div><div class="metric"><span class="metric-label">탐색 방식</span><strong class="metric-value">3 <span class="tiny">가지</span></strong><small>날씨 · 국가 · 코스 질의</small></div></div>
    <div class="grid" id="explore">
      <section class="panel"><div class="section-head"><div><span class="section-label">01 / 나만의 여행 코스</span><h2>원하는 조건으로 골라보기</h2></div><span class="pill">SQL</span></div><p class="muted">8개 장소가 담긴 <code>stops</code> 표를 조회합니다. 장소명(name), 분류(category), 지역(region), 소요 시간(minutes), 비용(cost).</p><label for="preset">추천 조건</label><select id="preset"><option value="all">가볍게 둘러볼 곳</option><option value="free">비용 없이 즐기는 코스</option><option value="culture">문화 공간만 모아보기</option></select><label for="query" class="space-top">SQL 조회문</label><textarea id="query" rows="4" spellcheck="false">SELECT name AS 장소, category AS 분류,
       minutes AS 소요분, cost AS 비용
FROM stops ORDER BY minutes LIMIT 6;</textarea><div class="actions space-top"><button class="primary" id="run">조회 실행 <span aria-hidden="true">↗</span></button><span class="tiny">Ctrl / ⌘ + Enter</span></div><p id="query-status" class="status" role="status" aria-live="polite">여행 코스를 준비하고 있습니다.</p><div id="results" class="table-wrap" tabindex="0" aria-label="SQL 조회 결과"></div><p class="tiny">기기 안의 SQLite · 최대 200행 · 첫 조회문만 실행 · 3초 시간 제한</p></section>
      <div class="stack"><section class="panel"><div class="section-head"><div><span class="section-label">02 / 떠나기 전 알아두기</span><h2>나라 정보 한눈에</h2></div><span class="pill">GraphQL</span></div><label for="country">궁금한 나라</label><select id="country"><option value="KR">대한민국</option><option value="JP">일본</option><option value="FR">프랑스</option></select><div class="country-title" id="country-name">대한민국</div><dl class="country-facts"><div><dt>수도</dt><dd id="capital">Seoul</dd></div><div><dt>통화</dt><dd id="currency">KRW</dd></div><div><dt>대륙</dt><dd id="continent">Asia</dd></div></dl><p class="status" id="country-source" role="status">저장 표본 · 국가 정보 확인 중</p></section><section class="panel" id="sources"><span class="section-label">DATA NOTES</span><h2>데이터는 어디서 오나요?</h2><ul class="source-list"><li><a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a> · 서울 날씨 · CC BY 4.0</li><li><a href="https://countries.trevorblades.com/" target="_blank" rel="noreferrer">Countries GraphQL</a> · 국가 기본 정보</li><li>여행 장소 8곳 · 체험용 가상 데이터</li></ul><div class="note">공개 데이터 연결이 어려우면 저장 표본을 표시합니다. 표본은 현재 값과 다를 수 있습니다.</div><button id="refresh" class="space-top">공개 데이터 새로고침</button></section></div>
    </div>
  </main><footer><span>모래별 관광 안내소 · 가상 서비스 체험</span><span>기기 안에서 실행되는 여행 데이터 탐색기 · <a href="./license.txt">MIT License</a></span></footer>
</div>`;

const $ = (id) => document.getElementById(id);
let worker;
let timer;
let countryRequest = 0;

function renderTable({ columns, rows }) {
  const table = document.createElement('table');
  const caption = document.createElement('caption');
  caption.textContent = '여행 코스 조회 결과';
  caption.className = 'sr-only';
  table.append(caption);
  const header = table.createTHead().insertRow();
  for (const column of columns) {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = column;
    header.append(th);
  }
  const body = table.createTBody();
  for (const row of rows) {
    const tr = body.insertRow();
    for (const value of row) tr.insertCell().textContent = value ?? '—';
  }
  $('results').replaceChildren(table);
}

function finishQuery(message, error = false) {
  clearTimeout(timer);
  $('run').disabled = false;
  $('query-status').textContent = message;
  $('query-status').classList.toggle('error', error);
}

function runQuery() {
  $('run').disabled = true;
  $('query-status').textContent = '기기 안에서 조회하고 있습니다…';
  if (!worker) {
    worker = new Worker(new URL('./query-worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }) => {
      if (data.error) {
        $('results').replaceChildren();
        finishQuery(`조회문을 확인해 주세요: ${data.error}`, true);
        return;
      }
      renderTable(data);
      finishQuery(`${data.rows.length}개 결과 · SQLite WebAssembly에서 실행${data.limited ? ' · 최대 표시 수에 도달했습니다.' : ''}`);
    };
    worker.onerror = () => { worker.terminate(); worker = null; finishQuery('조회 도구를 불러오지 못했습니다. 다시 실행해 주세요.', true); };
  }
  timer = setTimeout(() => { worker.terminate(); worker = null; $('results').replaceChildren(); finishQuery('3초를 초과한 조회를 중단했습니다. 조건을 줄여 다시 실행해 주세요.', true); }, 3000);
  worker.postMessage({ sql: $('query').value, wasmUrl: new URL(`${import.meta.env.BASE_URL}wasm/sql-wasm.wasm`, location.origin).href });
}

async function loadWeather() {
  $('weather-source').textContent = '날씨 확인 중';
  let weather = weatherSample;
  let live = false;
  try {
    const result = await fetchJson(weatherUrl);
    if (!Number.isFinite(result.current?.temperature_2m) || !result.current?.time) throw new Error('날씨 형식 오류');
    weather = result.current;
    live = true;
  } catch { /* 저장 표본으로 계속 표시 */ }
  $('temperature').textContent = `${weather.temperature_2m.toFixed(1)} °C`;
  $('weather-source').textContent = `${live ? '공개 API' : '저장 표본'} · ${weather.time.replace('T', ' ')} KST`;
}

async function loadCountry() {
  const request = ++countryRequest;
  const code = $('country').value;
  let country = countrySamples[code];
  let live = false;
  $('country-source').textContent = '국가 정보 확인 중';
  try {
    const result = await fetchJson(countryUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: 'query Place($code: ID!) { country(code: $code) { name capital currency continent { name } } }', variables: { code } }) });
    if (result.errors || !result.data?.country?.name || !result.data.country.continent?.name) throw new Error('국가 형식 오류');
    country = result.data.country;
    live = true;
  } catch { /* 국가별 저장 표본을 사용 */ }
  if (request !== countryRequest) return;
  $('country-name').textContent = country.name;
  $('capital').textContent = country.capital || '정보 없음';
  $('currency').textContent = country.currency || '정보 없음';
  $('continent').textContent = country.continent.name;
  $('country-source').textContent = live ? '공개 GraphQL · 방금 확인' : '저장 표본 · 2026-11-10 · 연결 시 갱신';
}

$('run').addEventListener('click', runQuery);
$('query').addEventListener('keydown', (event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && !$('run').disabled) runQuery(); });
$('country').addEventListener('change', loadCountry);
$('preset').addEventListener('change', () => {
  const queries = { all: 'SELECT name AS 장소, category AS 분류, minutes AS 소요분, cost AS 비용 FROM stops ORDER BY minutes LIMIT 6;', free: 'SELECT name AS 장소, region AS 지역, cost AS 비용 FROM stops WHERE cost = 0 ORDER BY minutes;', culture: "SELECT name AS 장소, minutes AS 소요분 FROM stops WHERE category = '문화' ORDER BY minutes;" };
  $('query').value = queries[$('preset').value];
  runQuery();
});
$('refresh').addEventListener('click', async () => { $('refresh').disabled = true; await Promise.allSettled([loadWeather(), loadCountry()]); $('refresh').disabled = false; });
runQuery();
void loadWeather();
void loadCountry();
