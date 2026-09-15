// Алхам 2: Анхны тест (stages-гүй хувилбар)
// Бай (target): зөвхөн өөрийн локал сервер — server/server.js (http://localhost:3000)
import http from 'k6/http';
import { sleep, check } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = { vus: 5, duration: "30s" };

export default function () {
  const res = http.get(`${BASE_URL}/`);
  check(res, { 'status 200 байна': (r) => r.status === 200 });
  sleep(1);
}
