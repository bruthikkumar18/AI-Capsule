const crypto = require('crypto');
const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('../config');

const router = express.Router();

const STATE_COOKIE = 'oauth_state';

// Secure + HttpOnly cookies
const baseCookie = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/',
};

// step 1: redirect to GitHub
router.get('/github', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  res.cookie(STATE_COOKIE, state, { ...baseCookie, maxAge: 10 * 60 * 1000 });

  const params = new URLSearchParams({
    client_id: config.github.clientId,
    redirect_uri: config.github.callbackUrl,
    scope: 'read:user',
    state,
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

// step 2: GitHub callback
router.get('/github/callback', async (req, res) => {
  const { code, state, error } = req.query;
  const savedState = req.cookies[STATE_COOKIE];
  res.clearCookie(STATE_COOKIE, baseCookie);

  if (error) return res.redirect('/login?error=access_denied');
  if (!code || !state || !savedState || state !== savedState) {
    return res.redirect('/login?error=state');
  }

  try {
    // code -> GitHub access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: config.github.clientId,
        client_secret: config.github.clientSecret,
        code,
        redirect_uri: config.github.callbackUrl,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      throw new Error(tokenData.error_description || 'No access token returned');
    }

    // GitHub profile
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'ai-capsule',
      },
    });
    if (!userRes.ok) throw new Error(`GitHub user request failed (${userRes.status})`);
    const ghUser = await userRes.json();
    if (!ghUser.id) throw new Error('GitHub user id missing');

    // app JWT (not the GitHub token)
    const appToken = jwt.sign(
      {
        sub: String(ghUser.id),
        login: ghUser.login,
        name: ghUser.name || ghUser.login,
        avatar: ghUser.avatar_url,
      },
      config.jwtSecret,
      { algorithm: 'HS256', expiresIn: config.jwtExpiresIn, issuer: config.jwtIssuer }
    );

    res.cookie('token', appToken, { ...baseCookie, maxAge: config.cookieMaxAge });
    return res.redirect('/dashboard');
  } catch (err) {
    console.error('OAuth callback failed:', err.message);
    return res.redirect('/login?error=oauth');
  }
});

// logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', baseCookie);
  res.json({ message: 'Logged out' });
});

module.exports = router;
