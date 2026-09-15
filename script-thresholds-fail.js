// Алхам 4: Threshold-ыг САНААТАЙГААР хатуу болгож FAIL гаргах хувилбар
// p95 < 10 мс нь baseline p95 (17.11 мс)-аас ч бага тул биелэх боломжгүй → k6 exit code 99 буцаана.
// CI pipeline дээр quality gate яг ийм зарчмаар build-ийг зогсооно.
import http from 'k6/http';
import { sleep, check } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  vus: 30, duration: "1m",
  thresholds: {
    http_req_duration: ['p(95)<10'],   // санаатай хатуу — FAIL болно
    http_req_failed:   ['rate<0.01'],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/`);
  check(res, { 'status 200 байна': (r) => r.status === 200 });
  sleep(1);
}
