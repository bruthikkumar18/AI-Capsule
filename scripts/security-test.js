// Usage: node scripts/security-test.js https://YOUR-APP.onrender.com
const base = (process.argv[2] || process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

const checks = [
  { name: 'GET /api/health is public', method: 'GET', path: '/api/health', expect: 200 },
  { name: 'Test 1: GET /api/capsules, no token', method: 'GET', path: '/api/capsules', expect: 401 },
  {
    name: 'Test 2: GET /api/capsules, fake token',
    method: 'GET',
    path: '/api/capsules',
    cookie: 'token=fake-token-123',
    expect: 401,
  },
  { name: 'POST /api/capsules, no token', method: 'POST', path: '/api/capsules', body: {}, expect: 401 },
  { name: 'PUT /api/capsules/1, no token', method: 'PUT', path: '/api/capsules/1', body: {}, expect: 401 },
  { name: 'DELETE /api/capsules/1, no token', method: 'DELETE', path: '/api/capsules/1', expect: 401 },
  {
    name: 'DELETE /api/capsules/1, fake token',
    method: 'DELETE',
    path: '/api/capsules/1',
    cookie: 'token=fake-token-123',
    expect: 401,
  },
];

(async () => {
  console.log(`Testing ${base}\n`);
  let failed = 0;
  for (const c of checks) {
    const headers = { 'Content-Type': 'application/json' };
    if (c.cookie) headers.Cookie = c.cookie;
    try {
      const res = await fetch(base + c.path, {
        method: c.method,
        headers,
        body: c.body ? JSON.stringify(c.body) : undefined,
      });
      const text = await res.text();
      const ok = res.status === c.expect;
      if (!ok) failed++;
      console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.name}  ->  ${res.status}  ${text}`);
    } catch (err) {
      failed++;
      console.log(`FAIL  ${c.name}  ->  ${err.message}`);
    }
  }
  console.log(`\n${failed === 0 ? 'All checks passed' : `${failed} check(s) failed`}`);
  process.exit(failed ? 1 : 0);
})();
