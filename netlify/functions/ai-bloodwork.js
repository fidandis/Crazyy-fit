/**
 * ai-bloodwork — Narrative interpretation of a bloodwork panel.
 * Takes raw values + the rule-based flag list, returns plain-English context.
 *
 * POST /api/ai-bloodwork
 * Body: { values: { [markerId]: number }, flags: [{name,value,unit,direction,severity}] }
 *
 * Required env vars:
 *   ANTHROPIC_API_KEY
 *   APP_URL (optional CORS origin)
 *
 * Returns:
 *   { ok: true, interpretation: string }
 *   { ok: false, error: string }
 */

const CLAUDE_API = 'https://api.anthropic.com/v1/messages';

const SYSTEM_PROMPT = `You are an expert sports endocrinology consultant interpreting a bloodwork panel for a coach reviewing a client's performance-enhancement protocol. The client is an adult male athlete; assume context that includes potential AAS / SARM / peptide use.

You will receive:
1. A map of raw marker values
2. A list of markers already flagged out of range by a deterministic rule engine

Write a focused interpretation. Cover:
- The TOP 2-4 most clinically important findings (not all of them — focus on what actually matters)
- How values INTERACT (e.g. high hematocrit + low HDL = compounded CV risk; low SHBG + high free T = sides amplification; high E2 + high prolactin = 19-nor signal)
- Concrete next steps (donate blood, drop AI dose, recheck X in N weeks, see physician, etc.)
- If everything looks reasonable, say so plainly

STRICT RULES:
- Write ONLY plain text — no markdown headings, no bullet lists, no code fences
- Use short paragraphs separated by blank lines
- 150-250 words total
- Speak to the coach, not the client ("Your client's hematocrit of 56..." not "Your hematocrit...")
- Never give specific drug dosing — refer to physician for prescriptions
- Always include the line "Not medical advice — confirm with the client's physician." at the end`;

exports.handler = async (event) => {
  const appUrl = process.env.APP_URL || '';
  const headers = {
    'Access-Control-Allow-Origin': appUrl || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST')    return { statusCode: 405, headers, body: 'Method Not Allowed' };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: false, error: 'ANTHROPIC_API_KEY not configured.' }) };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers, body: 'Bad JSON' }; }

  const values = body.values && typeof body.values === 'object' ? body.values : null;
  const flags  = Array.isArray(body.flags) ? body.flags : [];
  if (!values || !Object.keys(values).length) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Missing values' }) };
  }

  const userMessage =
    `Raw bloodwork values:\n${JSON.stringify(values, null, 2)}\n\n` +
    `Flagged out of range (by rule engine):\n${flags.length ? JSON.stringify(flags, null, 2) : '(none)'}\n\n` +
    `Write the interpretation as instructed.`;

  try {
    const res = await fetch(CLAUDE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Claude API error:', res.status, errText);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: false, error: `Claude API returned ${res.status}` }) };
    }

    const data = await res.json();
    const raw  = (data.content || []).map(x => x.text || '').join('').trim();
    if (!raw) {
      return { statusCode: 200, headers, body: JSON.stringify({ ok: false, error: 'Empty AI response' }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, interpretation: raw }) };
  } catch (err) {
    console.error('ai-bloodwork error:', err.message);
    return { statusCode: 200, headers, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
