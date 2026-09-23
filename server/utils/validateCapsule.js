const CATEGORIES = ['Coding', 'Writing', 'Research', 'Debugging', 'Study', 'Other'];
const USEFULNESS = ['Good', 'Needs Improvement'];

const LIMITS = {
  project_name: 120,
  prompt_title: 150,
  prompt_version: 20,
  prompt_text: 10000,
  response_summary: 5000,
  category: 30,
  usefulness: 30,
  screenshot_url: 2048,
  notes: 5000,
};

const REQUIRED = ['project_name', 'prompt_title', 'prompt_text'];

const LABELS = {
  project_name: 'Project name',
  prompt_title: 'Prompt title',
  prompt_version: 'Prompt version',
  prompt_text: 'Prompt text',
  response_summary: 'Response summary',
  category: 'Category',
  usefulness: 'Usefulness',
  screenshot_url: 'Screenshot URL',
  notes: 'Notes',
};

function toText(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function toFlag(value) {
  return [true, 1, '1', 'true', 'yes', 'Yes', 'YES'].includes(value) ? 1 : 0;
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// clean + validate body, user_id is never read
function validateCapsule(body) {
  const input = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const errors = [];
  const data = {};

  for (const field of Object.keys(LIMITS)) {
    data[field] = toText(input[field]);
  }

  for (const field of REQUIRED) {
    if (!data[field]) errors.push(`${LABELS[field]} is required.`);
  }

  for (const [field, max] of Object.entries(LIMITS)) {
    if (data[field].length > max) {
      errors.push(`${LABELS[field]} must be ${max} characters or fewer.`);
    }
  }

  if (data.category && !CATEGORIES.includes(data.category)) {
    errors.push(`Category must be one of: ${CATEGORIES.join(', ')}.`);
  }

  if (data.usefulness && !USEFULNESS.includes(data.usefulness)) {
    errors.push(`Usefulness must be one of: ${USEFULNESS.join(', ')}.`);
  }

  if (data.screenshot_url && !isHttpUrl(data.screenshot_url)) {
    errors.push('Screenshot URL must start with http:// or https://.');
  }

  // empty optional -> null
  for (const field of Object.keys(LIMITS)) {
    if (!REQUIRED.includes(field) && data[field] === '') data[field] = null;
  }

  data.reviewed = toFlag(input.reviewed);
  data.improved = toFlag(input.improved);

  return { errors, data };
}

module.exports = { validateCapsule, CATEGORIES, USEFULNESS };
