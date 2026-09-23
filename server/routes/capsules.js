const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/requireAuth');
const { validateCapsule } = require('../utils/validateCapsule');

const router = express.Router();

const COLUMNS = `id, project_name, prompt_title, prompt_version, prompt_text,
  response_summary, category, usefulness, reviewed, improved,
  screenshot_url, notes, created_at, updated_at`;

const selectOwned = db.prepare(`SELECT ${COLUMNS} FROM capsules WHERE id = ? AND user_id = ?`);

function toApi(row) {
  return { ...row, reviewed: Boolean(row.reviewed), improved: Boolean(row.improved) };
}

function parseId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// READ own records
router.get('/', requireAuth, (req, res) => {
  const rows = db
    .prepare(`SELECT ${COLUMNS} FROM capsules WHERE user_id = ? ORDER BY id DESC`)
    .all(req.user.id);
  res.json(rows.map(toApi));
});

// CREATE own record
router.post('/', requireAuth, (req, res) => {
  const { errors, data } = validateCapsule(req.body);
  if (errors.length) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  const info = db
    .prepare(
      `INSERT INTO capsules (
        user_id, project_name, prompt_title, prompt_version, prompt_text,
        response_summary, category, usefulness, reviewed, improved,
        screenshot_url, notes
      ) VALUES (
        @user_id, @project_name, @prompt_title, @prompt_version, @prompt_text,
        @response_summary, @category, @usefulness, @reviewed, @improved,
        @screenshot_url, @notes
      )`
    )
    .run({ ...data, user_id: req.user.id });

  const row = selectOwned.get(info.lastInsertRowid, req.user.id);
  return res.status(201).json(toApi(row));
});

// UPDATE own record
router.put('/:id', requireAuth, (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid capsule id' });

  const { errors, data } = validateCapsule(req.body);
  if (errors.length) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  const info = db
    .prepare(
      `UPDATE capsules SET
        project_name = @project_name,
        prompt_title = @prompt_title,
        prompt_version = @prompt_version,
        prompt_text = @prompt_text,
        response_summary = @response_summary,
        category = @category,
        usefulness = @usefulness,
        reviewed = @reviewed,
        improved = @improved,
        screenshot_url = @screenshot_url,
        notes = @notes,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = @id AND user_id = @user_id`
    )
    .run({ ...data, id, user_id: req.user.id });

  // 404 if missing or not owned
  if (info.changes === 0) return res.status(404).json({ error: 'Capsule not found' });

  return res.json(toApi(selectOwned.get(id, req.user.id)));
});

// DELETE own record
router.delete('/:id', requireAuth, (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid capsule id' });

  const info = db
    .prepare('DELETE FROM capsules WHERE id = ? AND user_id = ?')
    .run(id, req.user.id);

  if (info.changes === 0) return res.status(404).json({ error: 'Capsule not found' });

  return res.json({ message: 'Capsule deleted', id });
});

module.exports = router;
