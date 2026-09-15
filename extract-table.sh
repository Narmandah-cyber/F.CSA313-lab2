#!/usr/bin/env bash
# results/*.txt файлуудаас README-гийн хүснэгтийн тоог шууд задалж хэвлэнэ.
# Хүснэгт болон гаралтын файлууд таарч байгааг шалгахад ашиглана: ./extract-table.sh
printf "| %-6s | %-10s | %-10s | %-22s | %-18s |\n" "VU" "p90" "p95" "Throughput (http_reqs)" "Error rate"
printf "|--------|------------|------------|------------------------|--------------------|\n"
for v in 05 30 100; do
  f="results/run-${v}vu.txt"
  p90=$(grep -m1 'http_req_duration\.' "$f" | sed -E 's/.*p\(90\)=([^ ]+).*/\1/')
  p95=$(grep -m1 'http_req_duration\.' "$f" | sed -E 's/.*p\(95\)=([^ ]+).*/\1/')
  reqs=$(grep -m1 'http_reqs\.' "$f" | awk '{print $2" ("$3")"}')
  err=$(grep -m1 'http_req_failed\.' "$f" | awk '{print $2" ("$3" "$4" "$5" "$6")"}')
  printf "| %-6s | %-10s | %-10s | %-22s | %-18s |\n" "$((10#$v))" "$p90" "$p95" "$reqs" "$err"
done
