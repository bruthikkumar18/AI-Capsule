import { useState } from 'react';

function formatDate(value) {
  if (!value) return '';
  // SQLite UTC "YYYY-MM-DD HH:MM:SS"
  const date = new Date(value.replace(' ', 'T') + 'Z');
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function CapsuleCard({ capsule, onEdit, onDelete, busy }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const long = capsule.prompt_text.length > 280;

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(capsule.prompt_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className="capsule-card">
      <header className="card-head">
        <div>
          <p className="card-project">{capsule.project_name}</p>
          <h3 className="card-title">{capsule.prompt_title}</h3>
        </div>
        <div className="card-tags">
          {capsule.prompt_version && <span className="pill pill-version">{capsule.prompt_version}</span>}
          {capsule.category && <span className="pill">{capsule.category}</span>}
          {capsule.usefulness && (
            <span className={`pill ${capsule.usefulness === 'Good' ? 'pill-good' : 'pill-warn'}`}>
              {capsule.usefulness}
            </span>
          )}
        </div>
      </header>

      <pre className={`card-prompt ${long && !expanded ? 'clamped' : ''}`}>{capsule.prompt_text}</pre>
      <div className="card-inline-actions">
        {long && (
          <button className="link-btn" type="button" onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'Show less' : 'Show full prompt'}
          </button>
        )}
        <button className="link-btn" type="button" onClick={copyPrompt}>
          {copied ? 'Copied' : 'Copy prompt'}
        </button>
      </div>

      {capsule.response_summary && (
        <div className="card-block">
          <h4>Response summary</h4>
          <p>{capsule.response_summary}</p>
        </div>
      )}

      {capsule.notes && (
        <div className="card-block">
          <h4>Notes</h4>
          <p>{capsule.notes}</p>
        </div>
      )}

      <dl className="card-meta">
        <div>
          <dt>Reviewed</dt>
          <dd>{capsule.reviewed ? 'Yes' : 'No'}</dd>
        </div>
        <div>
          <dt>Improved</dt>
          <dd>{capsule.improved ? 'Yes' : 'No'}</dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd>{formatDate(capsule.created_at)}</dd>
        </div>
        {capsule.screenshot_url && (
          <div>
            <dt>Screenshot</dt>
            <dd>
              <a href={capsule.screenshot_url} target="_blank" rel="noopener noreferrer">
                Open evidence
              </a>
            </dd>
          </div>
        )}
      </dl>

      <footer className="card-actions">
        <button className="btn btn-small btn-ghost" type="button" onClick={() => onEdit(capsule)} disabled={busy}>
          Edit
        </button>
        <button className="btn btn-small btn-danger" type="button" onClick={() => onDelete(capsule)} disabled={busy}>
          {busy ? 'Deleting…' : 'Delete'}
        </button>
      </footer>
    </article>
  );
}
