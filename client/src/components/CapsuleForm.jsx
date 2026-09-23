import { useState } from 'react';

export const CATEGORIES = ['Coding', 'Writing', 'Research', 'Debugging', 'Study', 'Other'];
export const USEFULNESS = ['Good', 'Needs Improvement'];

const EMPTY = {
  project_name: '',
  prompt_title: '',
  prompt_version: 'v1',
  prompt_text: '',
  response_summary: '',
  category: 'Coding',
  usefulness: 'Good',
  reviewed: false,
  improved: false,
  screenshot_url: '',
  notes: '',
};

function toForm(capsule) {
  if (!capsule) return EMPTY;
  const form = { ...EMPTY };
  for (const key of Object.keys(EMPTY)) {
    if (capsule[key] !== null && capsule[key] !== undefined) form[key] = capsule[key];
  }
  return form;
}

export default function CapsuleForm({ capsule, onSave, onCancel }) {
  const [form, setForm] = useState(() => toForm(capsule));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const editing = Boolean(capsule);

  const update = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.project_name.trim() || !form.prompt_title.trim() || !form.prompt_text.trim()) {
      setError('Project name, prompt title and prompt text are required.');
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <form className="capsule-form" onSubmit={handleSubmit} noValidate>
      <h2>{editing ? `Edit "${capsule.prompt_title}"` : 'New capsule'}</h2>

      {error && (
        <p className="alert alert-error" role="alert">
          {error}
        </p>
      )}

      <div className="grid-2">
        <label>
          Project name *
          <input
            value={form.project_name}
            onChange={update('project_name')}
            maxLength={120}
            placeholder="SmartFarm Irrigation"
            required
          />
        </label>
        <label>
          Prompt title *
          <input
            value={form.prompt_title}
            onChange={update('prompt_title')}
            maxLength={150}
            placeholder="Debug cloud deployment"
            required
          />
        </label>
      </div>

      <div className="grid-3">
        <label>
          Version
          <input
            value={form.prompt_version}
            onChange={update('prompt_version')}
            maxLength={20}
            placeholder="v1"
          />
        </label>
        <label>
          Category
          <select value={form.category} onChange={update('category')}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Usefulness
          <select value={form.usefulness} onChange={update('usefulness')}>
            {USEFULNESS.map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </label>
      </div>

      <label>
        Prompt text *
        <textarea
          className="mono"
          rows={5}
          value={form.prompt_text}
          onChange={update('prompt_text')}
          maxLength={10000}
          placeholder="Why does my Node server fail on Render?"
          required
        />
      </label>

      <label>
        Response summary
        <textarea
          rows={3}
          value={form.response_summary}
          onChange={update('response_summary')}
          maxLength={5000}
          placeholder="Check the start command and use process.env.PORT."
        />
      </label>

      <div className="checks">
        <label className="check">
          <input type="checkbox" checked={form.reviewed} onChange={update('reviewed')} />
          Response reviewed
        </label>
        <label className="check">
          <input type="checkbox" checked={form.improved} onChange={update('improved')} />
          Output improved
        </label>
      </div>

      <label>
        Screenshot URL
        <input
          type="url"
          value={form.screenshot_url}
          onChange={update('screenshot_url')}
          maxLength={2048}
          placeholder="https://..."
        />
      </label>

      <label>
        Notes
        <textarea
          rows={2}
          value={form.notes}
          onChange={update('notes')}
          maxLength={5000}
          placeholder="Tested and worked"
        />
      </label>

      <div className="form-actions">
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Save capsule'}
        </button>
        <button className="btn btn-ghost" type="button" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}
