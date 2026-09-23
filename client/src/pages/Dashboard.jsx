import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar.jsx';
import CapsuleForm, { CATEGORIES } from '../components/CapsuleForm.jsx';
import CapsuleCard from '../components/CapsuleCard.jsx';
import { api, UnauthorizedError } from '../api.js';

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const [capsules, setCapsules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [formMode, setFormMode] = useState(null); // null | 'new' | capsule
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const handleError = useCallback(
    (err) => {
      if (err instanceof UnauthorizedError) {
        navigate('/login', { replace: true });
        return;
      }
      setError(err.message);
    },
    [navigate]
  );

  // READ
  useEffect(() => {
    api
      .listCapsules()
      .then(setCapsules)
      .catch(handleError)
      .finally(() => setLoading(false));
  }, [handleError]);

  function flash(message) {
    setNotice(message);
    setTimeout(() => setNotice(''), 3000);
  }

  // CREATE / UPDATE
  async function handleSave(form) {
    setError('');
    try {
      if (formMode === 'new') {
        const created = await api.createCapsule(form);
        setCapsules((list) => [created, ...list]);
        flash('Capsule saved.');
      } else {
        const updated = await api.updateCapsule(formMode.id, form);
        setCapsules((list) => list.map((c) => (c.id === updated.id ? updated : c)));
        flash('Changes saved.');
      }
      setFormMode(null);
    } catch (err) {
      if (err instanceof UnauthorizedError) return handleError(err);
      throw err; // shown in form
    }
  }

  // DELETE
  async function handleDelete(capsule) {
    if (!window.confirm(`Delete "${capsule.prompt_title}"? This cannot be undone.`)) return;
    setError('');
    setDeletingId(capsule.id);
    try {
      await api.deleteCapsule(capsule.id);
      setCapsules((list) => list.filter((c) => c.id !== capsule.id));
      if (formMode && formMode.id === capsule.id) setFormMode(null);
      flash('Capsule deleted.');
    } catch (err) {
      handleError(err);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleLogout() {
    try {
      await api.logout();
    } finally {
      navigate('/', { replace: true });
    }
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return capsules.filter((c) => {
      if (category !== 'All' && c.category !== category) return false;
      if (!q) return true;
      return [c.project_name, c.prompt_title, c.prompt_text, c.notes, c.response_summary]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q));
    });
  }, [capsules, search, category]);

  const stats = useMemo(
    () => ({
      total: capsules.length,
      reviewed: capsules.filter((c) => c.reviewed).length,
      improved: capsules.filter((c) => c.improved).length,
    }),
    [capsules]
  );

  return (
    <>
      <NavBar>
        <span className="user-chip">
          {user.avatar && <img src={user.avatar} alt="" width="28" height="28" />}
          <span>{user.login}</span>
        </span>
        <button className="btn btn-ghost" type="button" onClick={handleLogout}>
          Sign out
        </button>
      </NavBar>

      <main className="page dashboard">
        <div className="dash-head">
          <div>
            <h1>Your capsules</h1>
            <p className="muted">
              {stats.total} saved, {stats.reviewed} reviewed, {stats.improved} improved
            </p>
          </div>
          {!formMode && (
            <button className="btn btn-primary" type="button" onClick={() => setFormMode('new')}>
              New capsule
            </button>
          )}
        </div>

        {notice && (
          <p className="alert alert-ok" role="status">
            {notice}
          </p>
        )}
        {error && (
          <p className="alert alert-error" role="alert">
            {error}
          </p>
        )}

        {formMode && (
          <CapsuleForm
            key={formMode === 'new' ? 'new' : formMode.id}
            capsule={formMode === 'new' ? null : formMode}
            onSave={handleSave}
            onCancel={() => setFormMode(null)}
          />
        )}

        {capsules.length > 0 && (
          <div className="filters">
            <label>
              Search
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Title, project, prompt or notes"
              />
            </label>
            <label>
              Category
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option>All</option>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
        )}

        {loading ? (
          <p className="muted" role="status">
            Loading your capsules…
          </p>
        ) : capsules.length === 0 ? (
          !formMode && (
            <div className="empty">
              <h2>No capsules yet</h2>
              <p>Save the first prompt you want to keep. It will only be visible to you.</p>
              <button className="btn btn-primary" type="button" onClick={() => setFormMode('new')}>
                Save your first capsule
              </button>
            </div>
          )
        ) : visible.length === 0 ? (
          <p className="muted">No capsules match this search. Clear the search or pick another category.</p>
        ) : (
          <section className="capsule-list" aria-label="Saved capsules">
            {visible.map((c) => (
              <CapsuleCard
                key={c.id}
                capsule={c}
                busy={deletingId === c.id}
                onEdit={(cap) => {
                  setFormMode(cap);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onDelete={handleDelete}
              />
            ))}
          </section>
        )}
      </main>
    </>
  );
}
