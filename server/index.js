const config = require('./config');
const fs = require('fs');
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const db = require('./db');
const { requireAuth, verifyToken } = require('./middleware/requireAuth');
const capsulesRouter = require('./routes/capsules');
const authRouter = require('./routes/auth');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1); // behind cloud proxy

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

// basic security headers
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// public health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// current user (protected)
app.get('/api/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// protected CRUD
app.use('/api/capsules', capsulesRouter);

// OAuth routes
app.use('/auth', authRouter);

// unknown API -> JSON 404
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// serve React build
const distDir = path.join(__dirname, '..', 'client', 'dist');
const indexHtml = path.join(distDir, 'index.html');

if (fs.existsSync(indexHtml)) {
  // server-side dashboard guard
  app.get('/dashboard', (req, res, next) => {
    if (!verifyToken(req.cookies.token)) return res.redirect('/login');
    return next();
  });

  app.use(
    express.static(distDir, {
      index: false,
      setHeaders: (res, filePath) => {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.set('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    })
  );

  // SPA fallback
  app.get('*', (req, res) => {
    res.set('Cache-Control', 'no-cache');
    res.sendFile(indexHtml);
  });
} else {
  app.get('/', (req, res) => {
    res
      .type('text')
      .send('API running. Build the client with "npm run build" or run "npm run dev:client".');
  });
}

// error handler
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body too large' });
  }
  console.error(err);
  return res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`AI Capsule listening on port ${config.port}`);
    console.log(`Database: ${db.dbPath}`);
  });
}

module.exports = app;
