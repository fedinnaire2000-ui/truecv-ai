export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { cvText, jdText, jobTitle } = req.body || {};
  if (!cvText || !jdText) {
    return res.status(400).json({ error: "Missing cvText or jdText" });
  }
  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: "AI is not configured yet (missing API key)." });
  }

  const prompt = `You are an expert ATS (Applicant Tracking System) analyst and professional CV reviewer.

Analyze the CV below against the job description and target role, and respond with ONLY a single valid JSON object — no markdown, no code fences, no explanation before or after. The JSON must match this exact schema:

{
  "score": <integer 0-100, how well the CV matches the job>,
  "matchingSkills": [<3-6 short skill phrases already present in the CV that match the job>],
  "missingSkills": [<3-6 short skill phrases relevant to the job but missing or weak in the CV>],
  "missingKeywords": [<4-8 single words or short phrases from the job description not reflected in the CV>],
  "experienceMatch": "<one sentence assessing how well the candidate's experience aligns with the role>",
  "educationMatch": "<one sentence assessing the education section relative to the role>",
  "recommendations": [<3-5 short, specific, actionable suggestions to improve this CV for this job>]
}

Target job title: ${jobTitle || "Not specified"}

Job description:
"""
${jdText}
"""

Candidate CV:
"""
${cvText}
"""`;

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        response_format: { type: "json_object" },
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      return res.status(502).json({ error: "AI provider error", detail: errText.slice(0, 500) });
    }

    const data = await groqRes.json();
    const content = data.choices?.[0]?.message?.content || "{}";

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return res.status(502).json({ error: "AI returned an invalid response. Please try again." });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message || "Unexpected server error" });
  }
}
