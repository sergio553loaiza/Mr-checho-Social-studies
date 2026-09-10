export interface AssistantRequest {
  sectionTitle?: string;
  promptQuestion?: string;
  studentDraft?: string;
  studentQuestion?: string;
  symbolTitle?: string;
  symbolCategory?: string;
  branchTitle?: string;
  branchQuestion?: string;
  branchHelperTip?: string;
  studentMessage?: string;
  expectedKeywords?: string[];
}

export interface AssistantResponse {
  reply: string;
  suggestedAction?: string;
}

/**
 * Pedagogical Socratic tutor logic ensuring students receive guidance
 * that NEVER gives the direct answer, but prompts observation and conceptual connections.
 */
function getLocalTutorGuidance(params: AssistantRequest): string {
  const q = (params.studentMessage || params.studentQuestion || '').toLowerCase();
  const title = params.branchTitle || params.sectionTitle || 'this topic';
  const symbol = params.symbolTitle || 'the Colombian symbol';
  const helperTip = params.branchHelperTip || '';

  // If asking for direct answer or fact
  if (q.includes('where') || q.includes('what is the answer') || q.includes('tell me') || q.includes('who is')) {
    return `In Social Studies, discovery is more memorable than memorizing! Look closely at the central hub for **${symbol}** and the branch **"${title}"**.\n\nClue to reflect on: ${helperTip || 'Think about how this symbol was shaped by Colombian history.'}\n\nWhat words come to mind when you observe the central image?`;
  }

  // If asking how to start or write
  if (q.includes('how to start') || q.includes('how do i write') || q.includes('start') || q.includes('help me write')) {
    return `Here is a strong way to start your response:\n1. Open with one sentence identifying what **${title}** means for **${symbol}**.\n2. In your second sentence, explain why this aspect is important to Colombian citizens or the environment.\n\nTry drafting that first sentence now!`;
  }

  // If asking about vocabulary or meaning
  if (q.includes('vocabulary') || q.includes('words') || q.includes('meaning') || q.includes('mean')) {
    const kws = params.expectedKeywords && params.expectedKeywords.length > 0
      ? params.expectedKeywords.slice(0, 4).join(', ')
      : 'independence, sovereignty, biodiversity, culture';
    return `Rich Social Studies writing uses precise terminology! For **${title}**, consider incorporating words like: *${kws}*. Which of these do you already understand best?`;
  }

  // If asking about Colombian identity
  if (q.includes('identity') || q.includes('pride') || q.includes('colombia')) {
    return `National symbols connect past, present, and future generations. How does **${symbol}** make people from diverse Colombian regions feel united? Reflect on where people see or celebrate this symbol in daily life.`;
  }

  // Default encouraging Socratic guidance
  return `You are doing great work! Take another look at the guiding question: "${params.branchQuestion || params.promptQuestion || ''}".\n\n💡 *Helpful Clue:* ${helperTip || 'Focus on describing what you know and how it connects to Colombian heritage.'}\n\nWhat is your first reaction to that question? Write a short draft and we can refine it together!`;
}

export async function askSocialStudiesAssistant(
  params: AssistantRequest
): Promise<string> {
  try {
    const res = await fetch('/api/ai-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.reply) {
        return typeof data.reply === 'string' ? data.reply : data.reply.text || String(data.reply);
      }
    }
  } catch (err) {
    console.warn('AI Assistant API unavailable, using local pedagogical tutor rules:', err);
  }

  return getLocalTutorGuidance(params);
}
