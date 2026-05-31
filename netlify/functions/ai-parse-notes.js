/**
 * ai-parse-notes — Parses a free-text coach session note and extracts
 * actionable items (injury flags, suggested exercises, removal candidates).
 *
 * POST /api/ai-parse-notes
 * Body: { note: string, clientName?: string, currentExercises?: string[] }
 *
 * Required env vars:
 *   ANTHROPIC_API_KEY
 *   APP_URL (optional CORS origin)
 *
 * Returns:
 *   { ok: true, parsed: { flags, suggested_exercises, remove_suggestions, summary } }
 *   { ok: false, error: string }
 */

const CLAUDE_API = 'https://api.anthropic.com/v1/messages';

const SYSTEM_PROMPT = `You are an expert strength coach assistant parsing a coach's free-text session note about a client. Extract actionable items.

Return ONLY valid JSON — no markdown fences, no extra text — matching exactly this schema:
{
  "summary": "One plain-English sentence summarizing what was parsed",
  "flags": ["short phrase per injury / concern / red flag"],
  "suggested_exercises": [
    {
      "name": "Specific exercise name",
      "sets": "e.g. 3",
      "reps": "e.g. 10 or 30s",
      "notes": "Why this addresses the note (one short sentence)",
      "category": "mobility | corrective | strength | power | cardio"
    }
  ],
  "remove_suggestions": ["Exercise name to consider pulling from current program"]
}

Strict rules:
1. "category" MUST be exactly one of: mobility, corrective, strength, power, cardio
2. For any injury or pain mention, add an entry to "flags" AND add at least one "corrective" or "mobility" exercise that targets the area
3. For performance cues ("wants to work on X", "needs more Y") add 1-3 relevant "suggested_exercises"
4. If the note mentions an exercise that aggravates an injury or no longer fits the client's goals, add the exercise name to "remove_suggestions"
5. If the coach lists currentExercises, only put names from that list into "remove_suggestions" (do not invent)
6. Cap suggested_exercises at 5 total. Cap flags at 5. Cap remove_suggestions at 3.
7. If nothing actionable is mentioned, return empty arrays and a summary saying so. Do not fabricate.
8. Keep "notes" under 80 characters per exercise.`;

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
      body: JSON.stringify({ ok: false, error: 'ANTHROPIC_API_KEY not configured.' }),
    };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers, body: 'Bad JSON' }; }

  const note = (body.note || '').toString().trim();
  if (!note) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Missing note text' }) };
  }
  if (note.length > 2000) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Note exceeds 2000 chars' }) };
  }

  const clientName = (body.clientName || 'the client').toString().slice(0, 80);
  const currentExercises = Array.isArray(body.currentExercises)
    ? body.currentExercises.slice(0, 60).map(s => String(s).slice(0, 80))
    : [];

  const userMessage =
    `Client: ${clientName}\n\n` +
    `Coach session note:\n"""${note}"""\n\n` +
    (currentExercises.length
      ? `Current program exercises (only these names are valid for "remove_suggestions"):\n${currentExercises.join(', ')}\n\n`
      : '') +
    `Parse this note and return the JSON object.`;

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
        max_tokens: 1200,
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
      console.error('JSON parse error — Claude response was:', raw.slice(0, 500));
      return { statusCode: 200, headers, body: JSON.stringify({ ok: false, error: 'AI returned unparseable response' }) };
    }

    // Normalize shape so the client can render without defensive checks
    const ALLOWED_CAT = ['mobility','corrective','strength','power','cardio'];
    parsed.summary = typeof parsed.summary === 'string' ? parsed.summary : '';
    parsed.flags   = Array.isArray(parsed.flags) ? parsed.flags.slice(0, 5).map(s => String(s).slice(0, 120)) : [];
    parsed.remove_suggestions = Array.isArray(parsed.remove_suggestions)
      ? parsed.remove_suggestions.slice(0, 3).map(s => String(s).slice(0, 80))
      : [];
    parsed.suggested_exercises = Array.isArray(parsed.suggested_exercises)
      ? parsed.suggested_exercises.slice(0, 5).map(e => ({
          name: String(e.name || '').slice(0, 80),
          sets: String(e.sets || '').slice(0, 12),
          reps: String(e.reps || '').slice(0, 16),
          notes: String(e.notes || '').slice(0, 120),
          category: ALLOWED_CAT.includes(String(e.category || '').toLowerCase())
            ? String(e.category).toLowerCase()
            : 'strength',
        })).filter(e => e.name)
      : [];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, parsed }),
    };
  } catch (err) {
    console.error('ai-parse-notes error:', err.message);
    return { statusCode: 200, headers, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
