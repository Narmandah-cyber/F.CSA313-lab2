// Алхам 4: Thresholds — SLO-г кодоор шалгуулах (PASS хувилбар)
// Baseline (Алхам 2, 5 VU): p95 = 22.92 мс  (results/step2-baseline-05vu-30s.txt)
// SLO: p95 < 45 мс  ≈ baseline × 2  (ачаалал 5 → 30 VU буюу 6 дахин өсөхөд latency 2 дахин хүртэл
//      өсөхийг зөвшөөрнө), error rate < 1%.
// stages-ийг зориуд устгасан — эс тэгвэл vus/duration чимээгүй үл тоогдоно.
import http from 'k6/http';
import { sleep, check } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  vus: 30, duration: "1m",
  thresholds: {
    http_req_duration: ['p(95)<45'],   // SLO: p95 < 45ms (baseline 22.92ms × ~2)
    http_req_failed:   ['rate<0.01'],  // SLO: error rate < 1%
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/`);
  check(res, { 'status 200 байна': (r) => r.status === 200 });
  sleep(1);
}
