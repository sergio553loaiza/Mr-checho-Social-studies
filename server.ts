import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // AI Assistant for Socratic, pedagogical Social Studies guidance
  app.post('/api/ai-assistant', async (req, res) => {
    const { sectionTitle, promptQuestion, studentDraft, studentQuestion } = req.body || {};

    try {
      const ai = getGeminiClient();
      if (ai) {
        const systemPrompt = `You are Mr. Checho's Social Studies Assistant for Montessori Elementary students (ages 6-12) in Colombia.
CRITICAL PEDAGOGICAL RULES:
1. You MUST NEVER give students the direct answer or write answers for them.
   - For example: You MAY say: "Think about what the three colors represent" or "Look at the information about the history of the Colombian flag."
   - You MUST NEVER say: "Yellow represents gold, blue represents the seas and red represents blood."
2. You MUST NOT reveal factual historical dates, locations, or names directly. Instead, guide them Socratic-style to look back at the central symbol node, its tagline, or lesson clues.
3. You MAY: explain difficult vocabulary, clarify what the prompt is asking, suggest how to structure their answer in 2-3 sentences, and ask guiding questions.
4. Keep your response friendly, clear, encouraging, and under 3-4 sentences. The goal is for the student to look, think, connect, and write their own original response.`;

        const userPrompt = `Section: ${sectionTitle || 'Colombian National Symbols'}
Prompt Guiding Question: "${promptQuestion || ''}"
Student Draft so far: "${studentDraft || '(empty)'}"
Student asks: "${studentQuestion || 'How should I answer?'}"

Provide pedagogical, Socratic guidance according to the rules.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
          },
        });

        const reply = response.text ? response.text.trim() : null;
        if (reply) {
          return res.json({ reply });
        }
      }
    } catch (err: any) {
      console.warn('Gemini API call failed in /api/ai-assistant:', err?.message || err);
    }

    // Friendly Socratic pedagogical fallback
    return res.json({
      reply: `Think about what makes "${sectionTitle || 'this symbol'}" important in Colombian history and geography. Look closely at the center node of this mind map for key clues, then explain what you observe in your own words!`,
      suggestedAction: 'Start with one sentence describing the symbol, and a second sentence explaining why it matters to Colombians.',
    });
  });

  // AI Evaluation for open-ended Colombian Symbols Mind Maps
  app.post('/api/ai-evaluate', async (req, res) => {
    const { studentName, responses } = req.body || {};

    try {
      const ai = getGeminiClient();
      if (ai) {
        const prompt = `You are evaluating a student's completed Social Studies activity: "Colombian Symbols Mind Maps" for student "${studentName || 'Student'}".
Grade scale: 1.0 to 10.0 (rounded to 1 decimal). Passing grade is 7.0 or higher.
Rubric Weights:
- accuracyAndUnderstanding: 30% (max 3.0)
- completeness: 20% (max 2.0)
- explanationAndReasoning: 20% (max 2.0)
- vocabulary: 10% (max 1.0)
- connectionToIdentity: 10% (max 1.0)
- reflection: 10% (max 1.0)
Note: Section 11 is "My Own Colombian Symbol", evaluate it for creativity, original reflection, and values.
Do NOT penalize for minor grammar mistakes; evaluate conceptual understanding.

Here are the student's text responses across the sections:
${JSON.stringify(responses || {}, null, 2)}

Respond ONLY with valid JSON matching this schema:
{
  "finalScore": 8.5,
  "percentage": 85,
  "status": "PASSED",
  "passed": true,
  "rubricBreakdown": {
    "accuracyAndUnderstanding": 2.6,
    "completeness": 2.0,
    "explanationAndReasoning": 1.7,
    "vocabulary": 0.9,
    "connectionToIdentity": 0.8,
    "reflection": 0.9,
    "strengths": ["string"],
    "improvements": ["string"]
  },
  "feedback": "Detailed encouraging Montessori feedback identifying strengths and 1-2 recommendations."
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          if (typeof parsed.finalScore === 'number' && parsed.rubricBreakdown) {
            return res.json(parsed);
          }
        }
      }
    } catch (err: any) {
      console.warn('Gemini API call failed in /api/ai-evaluate:', err?.message || err);
    }

    // Fallback: will be handled or generated cleanly by frontend or fallback calculator
    return res.status(503).json({ error: 'AI evaluation currently unavailable, use deterministic fallback' });
  });

  // Vite middleware in dev; static assets in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mr Checho's Social Studies Lab server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
