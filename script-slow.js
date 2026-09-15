// Алхам 5: Хариу удаашруулдаг endpoint (/slow — 100 мс setTimeout)-ыг хэмжих
// Ажиллуулах: k6 run --vus 30 --duration 1m script-slow.js
import http from 'k6/http';
import { sleep, check } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = { vus: 30, duration: "1m" };

export default function () {
  const res = http.get(`${BASE_URL}/slow`);
  check(res, { 'status 200 байна': (r) => r.status === 200 });
  sleep(1);
}
