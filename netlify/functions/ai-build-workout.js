/**
 * ai-build-workout — Generates a single-session workout from a free-text
 * description, biased toward exercises the client has already logged before
 * so the movements are familiar. AI may include up to ~25% new exercises
 * (marked with isNew=true) when the request requires them.
 *
 * POST /api/ai-build-workout
 * Body: {
 *   description: string,                      // user prompt
 *   clientName: string,
 *   goal: string,
 *   programType: string,
 *   loggedExercises: [                        // dedup'd, recent first
 *     { name, lastWeight, lastReps, timesLogged }
 *   ]
 * }
 *
 * Returns: { ok: true, workout: {...} } | { ok: false, error: string }
 */

const CLAUDE_API = 'https://api.anthropic.com/v1/messages';

const SYSTEM_PROMPT = `You are an expert personal trainer. Generate a single workout session based on the user's request, biased strongly toward exercises they have already logged so they know the movement.

Return ONLY valid JSON — no markdown fences, no extra text — matching exactly:
{
  "title": "<short session title, e.g. 'Upper Push - 45min'>",
  "summary": "<one sentence describing the focus and why this fits the request>",
  "blocks": [
    {
      "label": "<block label, e.g. 'Warm-up' / 'Main Lifts' / 'Accessory' / 'Conditioning'>",
      "exercises": [
        {
          "name": "<exercise name>",
          "sets": "<e.g. '3 sets' or '4 rounds'>",
          "reps": "<e.g. '8-10' or '12' or '30s'>",
          "rest": "<e.g. '90s' or '2min'>",
          "note": "<optional cue, weight target, tempo, etc — keep short>",
          "isNew": false
        }
      ]
    }
  ]
}

Rules:
1. Strongly prefer exercises from the provided "loggedExercises" list — at least 75% of selected exercises must come from that list. The whole point is the client knows how to do them.
2. You MAY include new exercises if (a) the request demands a movement not in their history (e.g. "I want to deadlift" but they've never logged one) or (b) a small accessory is needed to round out the session. Set "isNew": true on any exercise NOT in the logged list.
3. Keep total exercise count reasonable for the requested duration: ~5-7 for 45min, ~7-9 for 60min, ~3-4 for 30min.
4. Use the client's last logged weight/reps as a starting point in the "note" field where helpful (e.g. "last: 135x8 — try 140x8").
5. Structure logically: warm-up block first if appropriate, then main lifts, then accessories/conditioning.
6. Honor any constraints in the user description (no equipment X, time limit, focus area, etc).
7. If the loggedExercises list is empty or near-empty, build the workout with isNew=true on everything and add a "note" suggesting the client ask their coach to demo each new movement.
8. Match the client's stated goal and program type when picking volume/intensity.`;

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
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: false, error: 'ANTHROPIC_API_KEY not configured. Add it in Netlify - Site Settings - Environment Variables.' }),
    };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers, body: 'Bad JSON' }; }

  const { description, loggedExercises = [], clientName = '', goal = '', programType = '' } = body;
  if (!description || typeof description !== 'string') {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Missing description' }) };
  }
  if (description.length > 1000) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Description too long (max 1000 chars)' }) };
  }

  const userMessage = `Client: ${clientName}
Goal: ${goal}
Program type: ${programType}

Their request:
"${description}"

Exercises they have previously logged (most-frequent first; lastWeight/lastReps are from their most recent session):
${JSON.stringify(loggedExercises, null, 2)}

Generate a single workout session as specified. Remember: at least 75% of exercises must come from the logged list above. Mark anything outside that list with isNew: true.`;

  try {
    const res = await fetch(CLAUDE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Claude API error:', res.status, errText);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: false, error: `Claude API returned ${res.status}` }),
      };
    }

    const data = await res.json();
    const raw  = (data.content || []).map(x => x.text || '').join('').replace(/```json|```/g, '').trim();

    let parsed;
    try { parsed = JSON.parse(raw); }
    catch (e) {
      console.error('JSON parse error - Claude response was:', raw.slice(0, 500));
      return { statusCode: 200, headers, body: JSON.stringify({ ok: false, error: 'AI returned unparseable response' }) };
    }

    if (!parsed.title || !Array.isArray(parsed.blocks)) {
      return { statusCode: 200, headers, body: JSON.stringify({ ok: false, error: 'Unexpected AI response shape' }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, workout: parsed }),
    };
  } catch (err) {
    console.error('ai-build-workout error:', err.message);
    return { statusCode: 200, headers, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
