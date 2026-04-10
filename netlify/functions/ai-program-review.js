/**
 * ai-program-review — Analyzes a client's training history and recommends
 * program adaptations using Claude AI. All recommendations are returned to
 * the coach for approval before any changes are applied.
 *
 * POST /api/ai-program-review
 * Body: { clientData: { client, workoutDays, fitLogs, checkins, macroScores, weightLogs, prs } }
 *
 * Required env vars:
 *   ANTHROPIC_API_KEY  — Claude API key from console.anthropic.com
 *   APP_URL            — your Netlify URL (for CORS)
 *
 * Returns:
 *   { ok: true, summary: string, recommendations: Recommendation[] }
 *   { ok: false, error: string }
 */

const CLAUDE_API = 'https://api.anthropic.com/v1/messages';

const SYSTEM_PROMPT = `You are an expert personal trainer and strength coach reviewing a client's program and recent training data to recommend targeted adjustments.

Return ONLY valid JSON — no markdown fences, no extra text — matching exactly this schema:
{
  "summary": "2-3 sentence honest assessment of the client's recent progress and what the data says about what needs to change",
  "recommendations": [
    {
      "id": "rec_1",
      "dayId": "<must exactly match one of the workoutDays[].id values provided>",
      "dayTitle": "<human-readable day name>",
      "type": "swap_exercise | adjust_volume | adjust_intensity | add_exercise | remove_exercise",
      "priority": "high | medium | low",
      "reason": "Specific reason from the data — e.g. low adherence, stagnant PRs, high stress scores",
      "current": { "name": "...", "sets": "...", "reps": "...", "note": "..." },
      "proposed": { "name": "...", "sets": "...", "reps": "...", "note": "..." },
      "blockIdx": 0,
      "exerciseIdx": 0
    }
  ]
}

Strict rules:
1. Max 5 recommendations, ordered by priority (high first)
2. Only recommend a change if there is clear evidence from the training data (poor adherence, missing sessions, plateau, high stress/low energy, etc.)
3. If the program and data look solid, say so in the summary and return fewer recommendations
4. For "add_exercise": set exerciseIdx to -1 (append to end of block); provide "proposed" only
5. For "remove_exercise": set exerciseIdx to the exact index; provide "current" only (omit "proposed")
6. For "swap_exercise", "adjust_volume", "adjust_intensity": provide both "current" and "proposed" with exact blockIdx and exerciseIdx
7. dayId MUST exactly match a value from the provided workoutDays array — never invent a dayId
8. Keep "reason" concise and data-driven (max 2 sentences)`;

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
      body: JSON.stringify({ ok: false, error: 'ANTHROPIC_API_KEY not configured. Add it in Netlify → Site Settings → Environment Variables.' }),
    };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers, body: 'Bad JSON' }; }

  const { clientData } = body;
  if (!clientData) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Missing clientData' }) };
  }

  const userMessage = `Analyze this client's training history and recommend program adaptations. Here is all the data:\n\n${JSON.stringify(clientData, null, 2)}`;

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
      console.error('JSON parse error — Claude response was:', raw.slice(0, 500));
      return { statusCode: 200, headers, body: JSON.stringify({ ok: false, error: 'AI returned unparseable response' }) };
    }

    if (!parsed.summary || !Array.isArray(parsed.recommendations)) {
      return { statusCode: 200, headers, body: JSON.stringify({ ok: false, error: 'Unexpected AI response shape' }) };
    }

    console.log(`AI review for ${clientData.client?.name}: ${parsed.recommendations.length} recommendations`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, summary: parsed.summary, recommendations: parsed.recommendations }),
    };
  } catch (err) {
    console.error('ai-program-review error:', err.message);
    return { statusCode: 200, headers, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
