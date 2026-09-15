// Алхам 4: Thresholds — SLO-г кодоор шалгуулах (PASS хувилбар)
// Baseline (Алхам 2, 5 VU, MacBook Air): p95 = 17.11 мс  (results/step2-baseline-05vu-30s.txt)
// SLO: p95 < 26 мс  ≈ baseline × 1.5 (17.11 × 1.5 = 25.67), error rate < 1%.
// stages-ийг зориуд устгасан — эс тэгвэл vus/duration чимээгүй үл тоогдоно.
import http from 'k6/http';
import { sleep, check } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  vus: 30, duration: "1m",
  thresholds: {
    http_req_duration: ['p(95)<26'],   // SLO: p95 < 26ms (baseline 17.11ms × 1.5)
    http_req_failed:   ['rate<0.01'],  // SLO: error rate < 1%
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/`);
  check(res, { 'status 200 байна': (r) => r.status === 200 });
  sleep(1);
}
