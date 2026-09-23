// Local ownership test. Start the server first, then: npm run test:ownership
// Mints two test JWTs with JWT_SECRET from .env, then cleans up its own records.
require('dotenv').config();
const jwt = require('jsonwebtoken');

const base = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');
const secret = process.env.JWT_SECRET;
if (!secret) {
  console.error('JWT_SECRET missing in .env');
  process.exit(1);
}

const sign = (sub, opts = {}) =>
  jwt.sign({ sub, login: sub, name: sub }, opts.secret || secret, {
    algorithm: 'HS256',
    issuer: 'ai-capsule',
    expiresIn: opts.expiresIn || '10m',
  });

const userA = sign('test-user-A');
const userB = sign('test-user-B');
const wrongSecret = sign('test-user-A', { secret: 'not-the-real-secret-000000000000000' });
const expired = sign('test-user-A', { expiresIn: '-10s' });

async function call(method, path, token, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Cookie = `token=${token}`;
  const res = await fetch(base + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {}
  return { status: res.status, data };
}

let failed = 0;
function check(name, cond, detail = '') {
  if (!cond) failed++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

(async () => {
  console.log(`Ownership tests against ${base}\n`);

  // A creates, tries to spoof user_id
  const created = await call('POST', '/api/capsules', userA, {
    user_id: 'test-user-B',
    project_name: 'Ownership test',
    prompt_title: 'Owned by A',
    prompt_version: 'v1',
    prompt_text: 'Test prompt',
    category: 'Coding',
    usefulness: 'Good',
    reviewed: true,
  });
  check('A can create (201)', created.status === 201, `status ${created.status}`);
  const id = created.data && created.data.id;

  const listA = await call('GET', '/api/capsules', userA);
  check('A sees own record', listA.status === 200 && listA.data.some((c) => c.id === id));

  const listB = await call('GET', '/api/capsules', userB);
  check(
    'B cannot see A record (user_id in body ignored)',
    listB.status === 200 && !listB.data.some((c) => c.id === id)
  );

  const updB = await call('PUT', `/api/capsules/${id}`, userB, {
    project_name: 'Hacked',
    prompt_title: 'Hacked',
    prompt_text: 'Hacked',
  });
  check('B cannot update A record (404)', updB.status === 404, `status ${updB.status}`);

  const delB = await call('DELETE', `/api/capsules/${id}`, userB);
  check('B cannot delete A record (404)', delB.status === 404, `status ${delB.status}`);

  const wrong = await call('GET', '/api/capsules', wrongSecret);
  check('JWT signed with wrong secret rejected (401)', wrong.status === 401);

  const exp = await call('GET', '/api/capsules', expired);
  check('Expired JWT rejected (401)', exp.status === 401);

  const bad = await call('POST', '/api/capsules', userA, { project_name: '' });
  check('Invalid body rejected (400)', bad.status === 400);

  const updA = await call('PUT', `/api/capsules/${id}`, userA, {
    project_name: 'Ownership test',
    prompt_title: 'Owned by A (v2)',
    prompt_version: 'v2',
    prompt_text: 'Improved prompt',
    improved: true,
  });
  check('A can update own record', updA.status === 200 && updA.data.prompt_version === 'v2');

  const delA = await call('DELETE', `/api/capsules/${id}`, userA);
  check('A can delete own record', delA.status === 200);

  const after = await call('GET', '/api/capsules', userA);
  check('Record gone after delete', !after.data.some((c) => c.id === id));

  console.log(`\n${failed === 0 ? 'All ownership checks passed' : `${failed} check(s) failed`}`);
  process.exit(failed ? 1 : 0);
})();
