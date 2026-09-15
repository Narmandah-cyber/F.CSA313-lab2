# Лаб 2: Гүйцэтгэлийн хэмжүүрийг k6-аар хэмжих

F.CSA313 — Программ хангамжийн чанарын баталгаа ба тест (2026)

## 1. Орчин ба хэрэгсэл

`k6 version` командын гаралт ([results/k6-version.txt](results/k6-version.txt)):

```
k6 v1.2.3 (commit/e4a5a88f7c, go1.24.6, linux/amd64)
```

| Зүйл | Утга |
|---|---|
| Үйлдлийн систем | Ubuntu 24.04.4 LTS (x86_64) |
| CPU / RAM | 2 vCPU / 7 GB |
| Бай (target) сервер | Өөрийн бичсэн локал Node.js сервер — [`server/server.js`](server/server.js), `http://localhost:3000` (Node v22) |
| Load тест хэрэгсэл | Grafana k6 v1.2.3 (AGPL v3) |

### Ёс зүй — тестийн бай

Бүх тестийг **зөвхөн өөрийн машин дээр ажиллуулсан локал сервер** (`http://localhost:3000`) рүү хийсэн. Энэ нь зааврын зөвшөөрөгдсөн 2-р бай бөгөөд гадаад сүлжээний хэлбэлзэл (TLS handshake, интернэтийн latency) хэмжилтэд оролцохгүй тул үр дүн тогтвортой. Сургууль болон бусад бодит вебсайт руу ямар ч тест хийгээгүй. Бүх скриптэд URL нь `BASE_URL` орчны хувьсагчаар (default: `http://localhost:3000`) тохируулагдана.

### Локал сервер

| Endpoint | Тайлбар |
|---|---|
| `GET /` | Бүтээгдэхүүний жагсаалт бүхий JSON "хуудас" бэлтгэнэ — хуудас render хийхтэй төстэй **CPU ажил (~12 мс)**. Node.js нэг thread-тэй тул зэрэгцээ хүсэлт олшрох тусам хүсэлтүүд дараалалд зогсоно. |
| `GET /slow` | Хариуг `setTimeout`-оор **100 мс удаашруулдаг** endpoint (Алхам 5). CPU ашиглахгүй. |
| `GET /health` | Хамгийн хөнгөн endpoint |

### Ажиллуулах заавар

```bash
node server/server.js                  # 1-р терминал: сервер асаах
mkdir -p results                       # 2-р терминал:
k6 run script.js 2>&1 | tee results/step2-baseline-05vu-30s.txt          # Алхам 2
k6 run --vus 5   --duration 1m script.js > results/run-05vu.txt           # Алхам 3
k6 run --vus 30  --duration 1m script.js > results/run-30vu.txt
k6 run --vus 100 --duration 1m script.js > results/run-100vu.txt
k6 run script-stages.js 2>&1 | tee results/run-stages.txt
k6 run script-thresholds.js      > results/thresholds-pass.txt; echo "exit code: $?" | tee -a results/thresholds-pass.txt   # Алхам 4
k6 run script-thresholds-fail.js > results/thresholds-fail.txt; echo "exit code: $?" | tee -a results/thresholds-fail.txt
k6 run --vus 30  --duration 1m script-slow.js > results/slow-30vu.txt     # Алхам 5
k6 run --vus 100 --duration 1m script-slow.js > results/slow-100vu.txt
./extract-table.sh                     # хүснэгтийн тоог гаралтын файлаас шууд задлах
```

## 2. Файлын бүтэц

| Файл | Зориулалт |
|---|---|
| [`script.js`](script.js) | Алхам 2 — анхны тест (stages-гүй), Алхам 3-ын 5/30/100 VU тусдаа ажиллуулалт |
| [`script-stages.js`](script-stages.js) | Алхам 3 — stages (5 → 30 → 100 → 0 VU) |
| [`script-thresholds.js`](script-thresholds.js) | Алхам 4 — baseline-д үндэслэсэн SLO (PASS) |
| [`script-thresholds-fail.js`](script-thresholds-fail.js) | Алхам 4 — санаатай хатуу threshold (FAIL) |
| [`script-slow.js`](script-slow.js) | Алхам 5 — `/slow` endpoint |
| [`server/server.js`](server/server.js) | Локал тест сервер |
| [`extract-table.sh`](extract-table.sh) | `results/run-*vu.txt`-ээс хүснэгтийн тоог задалдаг скрипт |
| [`results/`](results/) | k6-ийн **бүтэн текст гаралтууд** |
| [`screenshots/`](screenshots/) | k6 summary гаралтын дэлгэцийн зургууд |

## 3. Алхам 2 — Анхны тест ба BASELINE

`script.js` (5 VU, 30s) → [results/step2-baseline-05vu-30s.txt](results/step2-baseline-05vu-30s.txt)

```
http_req_duration..............: avg=13.89ms min=8.42ms med=12.46ms max=59.03ms p(90)=18.86ms p(95)=22.92ms
http_req_failed................: 0.00%  0 out of 150
http_reqs......................: 150    4.922668/s
```

| Хэмжүүр | Утга | Тайлбар |
|---|---|---|
| http_req_duration avg | 13.89 мс | дундаж latency |
| http_req_duration p90 | 18.86 мс | хүсэлтийн 90% үүнээс хурдан |
| http_req_duration p95 | **22.92 мс** | **BASELINE** |
| http_reqs (нийт) | 150 | |
| http_reqs (секундэд) | 4.92 req/s | throughput |
| http_req_failed | 0.00% (0 / 150) | error rate — POFOD-ийн аналог |

![Алхам 2 baseline](screenshots/01-step2-baseline-05vu.png)

## 4. Алхам 3 — Ачааллыг шатлан өсгөх

### 4.1 Гурван түвшний хэмжилтийн хүснэгт (тус бүр 1 минут, тусдаа ажиллуулалт)

| VU | p90 | p95 | Throughput (http_reqs) | Error rate (http_req_failed) | Гаралтын файл |
|---|---|---|---|---|---|
| 5 | 15.61ms | 17.91ms | 300 (4.929018/s) | 0.00% (0 out of 300) | [results/run-05vu.txt](results/run-05vu.txt) |
| 30 | 22.14ms | 31.63ms | 1773 (29.159929/s) | 0.00% (0 out of 1773) | [results/run-30vu.txt](results/run-30vu.txt) |
| 100 | 163.74ms | 192.68ms | 5468 (89.421658/s) | 0.00% (0 out of 5468) | [results/run-100vu.txt](results/run-100vu.txt) |

Нэмэлт тооцоо (дээрх тооноос):

| VU | Нэг VU-д ногдох throughput | p95-ийн өсөлт (5 VU-тэй харьцуулахад) | Хамгийн удаан хүсэлт (max) |
|---|---|---|---|
| 5 | 4.929 / 5 = 0.986 req/s | ×1.0 | 76.92ms |
| 30 | 29.160 / 30 = 0.972 req/s | ×1.8 | 316.88ms |
| 100 | 89.422 / 100 = 0.894 req/s | ×10.8 | 1.76s |

![5 VU](screenshots/02-run-05vu.png)
![30 VU](screenshots/03-run-30vu.png)
![100 VU](screenshots/04-run-100vu.png)

### 4.2 "Нэгж хэрэглэгчийн туршлага" хаанаас муудсан бэ?

* **5 → 30 VU:** ачаалал 6 дахин өсөхөд throughput бараг шугаман өссөн (4.93 → 29.16 req/s), p95 17.91 → 31.63 мс болж ердөө ~14 мс нэмэгдсэн. Хэрэглэгч ялгааг бараг мэдрэхгүй.
* **30 → 100 VU:** ачаалал 3.3 дахин өсөхөд throughput зөвхөн 3.07 дахин өссөн (29.16 → 89.42 req/s, хүлээгдэж буй ~98 req/s-д хүрээгүй), харин p95 **6 дахин** (31.63 → 192.68 мс), max latency 1.76 с болсон.
* **Муудах цэг — 30-аас 100 VU-ийн хооронд.** `/` хүсэлт бүр ~12 мс CPU ашигладаг тул нэг thread-тэй Node сервер онолын хувьд секундэд ойролцоогоор 80–90 хүсэлт л боловсруулна. 100 VU нь секундэд ~100 хүсэлт илгээх гэж оролдсон тул сервер **ханасан (saturation)**, хүсэлтүүд дараалалд хүлээж эхэлсэн — throughput нэмэгдсээр байхад нэг хэрэглэгчийн хүлээх хугацаа огцом өссөн. Энэ бол лекцийн "10 хэрэглэгчтэй үед 2 с, 100 хэрэглэгчтэй үед 4 с" гэсэн **throughput ба latency-ийн зөрчил**.

### 4.3 Stages хувилбар

`script-stages.js` (30s → 5, 1m → 30, 30s → 100, 30s → 0) → [results/run-stages.txt](results/run-stages.txt)

```
http_req_duration..............: avg=19.25ms min=5.95ms med=12.79ms max=291.35ms p(90)=38.86ms p(95)=64.78ms
http_req_failed................: 0.00%  0 out of 4503
http_reqs......................: 4503   29.900891/s
```

Ажиглалт: ачаалал нэмэгдэж оргил (100 VU) руу ойртох үед latency өсөж, буултын үед хэвийн болсон. Гэхдээ нэгтгэсэн ганц summary нь бүх үеийг хольж өгдөг тул p95 = 64.78 мс гэж "дундажласан" дүр зураг харуулсан — оргил үеийн жинхэнэ p95 (100 VU-д 192.68 мс) нуугдсан. Иймээс хүснэгтийн тоог тусдаа ажиллуулалтаас авсан.

![Stages](screenshots/05-run-stages.png)

## 5. Алхам 4 — Thresholds (SLO)

### 5.1 SLO ба түүний үндэслэл

| SLO | Threshold | Үндэслэл |
|---|---|---|
| Latency | `http_req_duration: ['p(95)<45']` | Алхам 2-ын baseline p95 = **22.92 мс**. Тест 30 VU буюу baseline-аас 6 дахин их ачаалалтай тул latency baseline-ийн **2 дахин** (22.92 × 2 ≈ 45 мс) хүртэл өсөхийг зөвшөөрсөн; ×1.5 (≈34 мс) нь 30 VU-ийн хэмжилт (31.63 мс)-д хэт ойр байсан тул хэвийн хэлбэлзлээс болж худал FAIL гарах эрсдэлтэй. |
| Error rate | `http_req_failed: ['rate<0.01']` | Baseline-д алдаа 0% байсан; 1%-иас бага алдааг хүлээн зөвшөөрөх түвшин гэж тогтоосон. |

Скрипт: [`script-thresholds.js`](script-thresholds.js) (`vus: 30, duration: "1m"`, stages-ийг устгасан).

### 5.2 PASS гаралт — [results/thresholds-pass.txt](results/thresholds-pass.txt)

```
█ THRESHOLDS
  http_req_duration
  ✓ 'p(95)<45' p(95)=29.59ms
  http_req_failed
  ✓ 'rate<0.01' rate=0.00%
exit code: 0
```

![Thresholds PASS](screenshots/06-thresholds-PASS.png)

### 5.3 FAIL гаралт (санаатай хатуу `p(95)<10`) — [results/thresholds-fail.txt](results/thresholds-fail.txt)

```
█ THRESHOLDS
  http_req_duration
  ✗ 'p(95)<10' p(95)=29.77ms
  http_req_failed
  ✓ 'rate<0.01' rate=0.00%
exit code: 99
```

Terminal дээр мөн `level=error msg="thresholds on metrics 'http_req_duration' have been crossed"` гарсан. k6 threshold зөрчигдвөл **exit code 99** буцаадаг тул CI pipeline (GitHub Actions г.м.) энэ алхмыг автоматаар FAIL болгож, build-ийг зогсооно — quality gate яг ийм зарчмаар ажилладаг.

![Thresholds FAIL](screenshots/07-thresholds-FAIL.png)

## 6. Алхам 5 — Удаашруулдаг endpoint (нэмэлт гүнзгийрэл)

| Endpoint | VU | p90 | p95 | Throughput | Error rate | Файл |
|---|---|---|---|---|---|---|
| `/` (CPU ~12 мс) | 30 | 22.14ms | 31.63ms | 29.159929/s | 0.00% | [run-30vu.txt](results/run-30vu.txt) |
| `/slow` (100 мс хүлээлт) | 30 | 102.4ms | 102.85ms | 27.212976/s | 0.00% | [slow-30vu.txt](results/slow-30vu.txt) |
| `/` (CPU ~12 мс) | 100 | 163.74ms | 192.68ms | 89.421658/s | 0.00% | [run-100vu.txt](results/run-100vu.txt) |
| `/slow` (100 мс хүлээлт) | 100 | 103.18ms | 104.06ms | 90.645395/s | 0.00% | [slow-100vu.txt](results/slow-100vu.txt) |

Ажиглалт: `/slow` endpoint 100 мс-ээр удаан ч latency нь ачааллаас бараг хамаарахгүй (30 VU-д p95 102.85 мс, 100 VU-д 104.06 мс), учир нь `setTimeout` нь CPU-г блоклохгүй, Node-ийн event loop хүлээж буй олон хүсэлтийг зэрэг барьж чадна. Харин `/` endpoint 30 VU-д `/slow`-оос 3 дахин хурдан байсан ч 100 VU-д CPU ханаж, p95 нь `/slow`-оос ч удаан (192.68 мс) болсон. Эндээс харахад гүйцэтгэлийг зөвхөн нэг хүсэлтийн хурдаар биш, **ачаалал дор** хэмжих ёстой.

![slow 30 VU](screenshots/08-slow-30vu.png)
![slow 100 VU](screenshots/09-slow-100vu.png)

## 7. Дүгнэлт

1. Ачааллыг 5 → 30 → 100 VU болгон өсгөхөд throughput 4.93 → 29.16 → 89.42 req/s болж өссөн боловч 100 VU-д шугаман өсөлт зогсож, нэг VU-д ногдох throughput 0.986-аас 0.894 req/s болж буурсан.
2. Үүний зэрэгцээ p95 latency 17.91 → 31.63 → 192.68 мс болж, 30-аас 100 VU руу шилжихэд 6 дахин огцом өссөн тул "нэгж хэрэглэгчийн туршлага" 30–100 VU-ийн хооронд муудаж эхэлсэн.
3. Энэ нь лекцийн **throughput ба latency-ийн зөрчил**-ийг баталсан: систем нийтдээ илүү олон хүсэлт боловсруулж байхад хэрэглэгч бүр илүү удаан хүлээсэн.
4. Шалтгаан нь нэг thread-тэй серверийн CPU ханасан (saturation) явдал бөгөөд ханалтын цэгт хүрмэгц хүсэлтүүд дараалалд зогсож latency шугаман бусаар өсдөг болохыг харлаа.
5. 100 VU-д дундаж latency 106.11 мс байхад max нь 1.76 с байсан нь зөвхөн дунджийг харах нь хангалтгүй, **p95/p99 зэрэг percentile** хэмжүүр чухал гэсэн лекцийн ойлголтыг баталсан.
6. Бүх түвшинд http_req_failed 0.00% байсан тул error rate (POFOD-ийн аналог) болон availability хангагдсан ч гүйцэтгэл муудсан — "алдаагүй" гэдэг нь "хангалттай хурдан" гэсэн үг биш юм.
7. Stages-тэй нэг ажиллуулалт нэгтгэсэн summary-д p95-ийг 64.78 мс гэж харуулж оргил үеийн жинхэнэ утгыг нуусан тул түвшин бүрийг тусад нь хэмжих шаардлагатай болохыг ойлгосон.
8. Миний SLO нь baseline p95 (22.92 мс)-ийн 2 дахин буюу 30 VU-д **p95 < 45 мс** ба **error rate < 1%** байсан бөгөөд хэмжилтээр p95 = 29.59 мс, алдаа 0.00% гарч **SLO хангагдсан (PASS, exit code 0)**.
9. Харин threshold-ыг санаатай `p(95)<10` болгоход k6 FAIL болж exit code 99 буцаасан нь SLO-г кодоор тодорхойлж CI дээр quality gate болгож болдгийг харуулсан.
10. Хэрэв ижил SLO-г 100 VU-д хэрэглэвэл p95 = 192.68 мс тул зөрчигдөх байсан — өөрөөр хэлбэл энэ сервер одоогийн байдлаар ~30 зэрэгцээ хэрэглэгчийн SLO-г л баталгаатай хангана.

## 8. Commit түүх

Ажлын явцад алхам бүрийг дуусгах бүрт commit хийсэн (`git log --oneline`-оор харна).
