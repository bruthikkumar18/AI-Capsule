// thin fetch wrapper, cookie sent automatically (same origin)
export class UnauthorizedError extends Error {}

async function request(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (res.status === 401) {
    throw new UnauthorizedError('Your session has ended. Sign in again to continue.');
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message =
      (data && data.details && data.details.join(' ')) ||
      (data && data.error) ||
      `Request failed with status ${res.status}.`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  me: () => request('/api/me'),
  listCapsules: () => request('/api/capsules'),
  createCapsule: (capsule) =>
    request('/api/capsules', { method: 'POST', body: JSON.stringify(capsule) }),
  updateCapsule: (id, capsule) =>
    request(`/api/capsules/${id}`, { method: 'PUT', body: JSON.stringify(capsule) }),
  deleteCapsule: (id) => request(`/api/capsules/${id}`, { method: 'DELETE' }),
  logout: () => request('/auth/logout', { method: 'POST' }),
};
