/**
 * get-instagram — Returns the latest post/reel from @FidCrazyy via Instagram Graph API.
 *
 * GET /api/get-instagram
 *
 * Required env vars (set in Netlify → Site Settings → Environment Variables):
 *   INSTAGRAM_TOKEN  — Long-lived Instagram Graph API access token
 *
 * How to get a token:
 *   1. Go to https://developers.facebook.com/ and create a Facebook App
 *   2. Add the "Instagram Basic Display" product
 *   3. Generate a User Token for the @FidCrazyy Instagram account
 *   4. Exchange it for a long-lived token (valid 60 days, auto-refreshed here)
 *   5. Add it as INSTAGRAM_TOKEN in Netlify env vars
 *
 * If INSTAGRAM_TOKEN is not set, returns { ok: false, reason: 'token_missing' }
 * and the app will show a "Follow on Instagram" link instead.
 *
 * In-memory cache: 30 minutes (resets on cold start)
 */

let _cache     = null;
let _cacheTime = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=1800',
    'Access-Control-Allow-Origin': '*',
  };

  const token = process.env.INSTAGRAM_TOKEN;
  if (!token) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: false, reason: 'token_missing' }),
    };
  }

  // Serve from in-memory cache
  if (_cache && Date.now() - _cacheTime < CACHE_TTL) {
    return { statusCode: 200, headers, body: JSON.stringify(_cache) };
  }

  try {
    const fields = 'id,media_type,thumbnail_url,media_url,permalink,caption,timestamp';
    const url    = `https://graph.instagram.com/me/media?fields=${fields}&limit=1&access_token=${token}`;
    const res    = await fetch(url);

    if (!res.ok) {
      const errBody = await res.text();
      console.error('Instagram API error', res.status, errBody);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: false, reason: `api_error_${res.status}` }),
      };
    }

    const data = await res.json();
    if (data.error) {
      console.error('Instagram API error:', data.error);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: false, reason: data.error.message }) };
    }

    const post = data.data?.[0];
    if (!post) {
      return { statusCode: 200, headers, body: JSON.stringify({ ok: false, reason: 'no_posts' }) };
    }

    const result = { ok: true, post };
    _cache     = result;
    _cacheTime = Date.now();

    return { statusCode: 200, headers, body: JSON.stringify(result) };
  } catch (err) {
    console.error('get-instagram error:', err.message);
    return { statusCode: 200, headers, body: JSON.stringify({ ok: false, reason: err.message }) };
  }
};
