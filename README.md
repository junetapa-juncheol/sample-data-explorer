# 모래별 여행 데이터 탐색기

가상 지역 모래별의 여행 장소를 조건에 맞게 찾아보는 정적 웹 체험입니다.
서울 날씨와 국가 기본 정보를 공개 데이터로 확인합니다.
여행 코스는 브라우저 안의 SQLite에서 직접 조회합니다.

## 쓴 기술

| 기술 | 사용한 곳 | 화면 |
| --- | --- | --- |
| REST API | [src/data.js](src/data.js), [src/main.js](src/main.js) · Open-Meteo GET | 서울 현재 기온, 확인 시각 |
| GraphQL | [src/main.js](src/main.js) · Countries에 국가 코드 변수로 POST | 나라 선택, 수도·통화·대륙 |
| SQL | [src/query-worker.js](src/query-worker.js) · 실제 SQLite 질의 | SQL 입력칸, 추천 조건, 결과 표 |
| WebAssembly | [public/wasm/sql-wasm.wasm](public/wasm/sql-wasm.wasm) · sql.js 1.13.0 | 조회 결과의 실행 상태 |
| Web Worker | [src/query-worker.js](src/query-worker.js) | 무거운 조회를 3초 후 중단 |
| Vite | [vite.config.js](vite.config.js) · 저장소 하위 경로 설정 | `/sample-data-explorer/` |

## 실행 방법

Node.js 24 이상에서 실행합니다.

```sh
npm ci
npm run dev
npm test
npm run lint
npm run build
npm run preview
```

실행기가 출력하는 주소 뒤에 `/sample-data-explorer/`를 붙입니다.
`docs/`에 완성된 정적 파일이 포함되어 있어 게시할 때 빌드할 필요가 없습니다.
GitHub 웹에서 이 폴더의 내용을 저장소 루트에 올리고 Settings → Pages → Deploy from a branch → main /docs를 선택합니다.
`index.html`을 파일 탐색기에서 직접 여는 방식 대신 HTTP 서버를 사용합니다.

## 보는 주소

https://junetapa-juncheol.github.io/sample-data-explorer/

이 주소는 GitHub Pages를 설정한 뒤 열립니다.

## 데이터와 동작

- [Open-Meteo](https://open-meteo.com/)의 키 없는 날씨 API를 사용하며 [CC BY 4.0](https://open-meteo.com/en/terms) 출처를 화면에 표시합니다. 현재 값은 응답의 관측 시각을 함께 표시합니다.
- [Countries GraphQL](https://countries.trevorblades.com/)에 국가 코드와 필요한 필드만 요청합니다. 마지막 선택의 응답만 화면에 반영합니다.
- API 오류·시간 초과·잘못된 응답 때 `src/data.js`의 날짜가 명시된 표본으로 대체합니다. 실시간 값처럼 표시하지 않습니다.
- 여행 장소 8곳은 가상 데이터입니다. 날씨와 국가 정보는 SQL 표와 별개의 공개 데이터입니다.
- SQL은 조회 전용 연결에서 첫 SELECT/WITH 문장만 실행합니다. 최대 200행을 표시하며 3초를 넘으면 작업자를 종료합니다. 오류가 나면 고쳐서 다시 실행할 수 있습니다.
- 키·계정·서버가 필요하지 않으며 조회 내용을 저장하지 않습니다.

## 라이선스

직접 작성한 코드는 [MIT License](LICENSE), 저작권자는 junetapa입니다.
sql.js는 MIT, SQLite는 퍼블릭 도메인입니다. 배포 고지는 [public/third-party.txt](public/third-party.txt)에 포함됩니다.
