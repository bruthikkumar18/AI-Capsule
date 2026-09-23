import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../api.js';

// client guard, server also guards
export default function ProtectedRoute({ children }) {
  const [state, setState] = useState({ status: 'loading', user: null });

  useEffect(() => {
    let active = true;
    api
      .me()
      .then((data) => active && setState({ status: 'ok', user: data.user }))
      .catch(() => active && setState({ status: 'denied', user: null }));
    return () => {
      active = false;
    };
  }, []);

  if (state.status === 'loading') {
    return (
      <main className="page narrow">
        <p className="muted" role="status">
          Checking your session…
        </p>
      </main>
    );
  }
  if (state.status === 'denied') return <Navigate to="/login" replace />;
  return children(state.user);
}
