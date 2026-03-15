const OpenAI = require('openai');

function getProvider() {
  return String(process.env.NEXA_AI_PROVIDER || 'free').trim().toLowerCase();
}

function getSystemPrompt() {
  return 'You write punchy, viral 30-60 second YouTube Shorts scripts. Return ONLY the final script text. Structure: strong hook (first 3 seconds), 2-3 short beats, closing call-to-action. Keep it conversational and energetic.';
}

function getUserPrompt(videoIdea) {
  return `Write a YouTube Shorts script for this idea: "${videoIdea}"`;
}

function buildFallbackScript(videoIdea) {
  const idea = String(videoIdea || 'this topic').trim().slice(0, 100);
  return [
    `Hook: You won't believe what I discovered about ${idea}.`,
    ``,
    `Beat 1: Most people completely overlook this — but once you see it, everything changes.`,
    ``,
    `Beat 2: The truth is, when you break it down, it's not complicated. Focus on what actually moves the needle.`,
    ``,
    `Beat 3: I've seen this work for hundreds of creators who stopped overcomplicating and just executed.`,
    ``,
    `Payoff: Follow for more AI content strategies. Comment below if you want a full breakdown.`,
  ].join('\n');
}

async function generateWithOpenAI(videoIdea) {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set.');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  // ✅ FIXED: correct chat.completions format (not client.responses which was wrong)
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: getSystemPrompt() },
      { role: 'user', content: getUserPrompt(videoIdea) },
    ],
    max_tokens: 500,
    temperature: 0.8,
  });

  const script = response.choices?.[0]?.message?.content?.trim();
  if (!script) throw new Error('OpenAI returned empty response.');
  return { script, provider: 'openai', warning: null };
}

async function generateWithGroq(videoIdea) {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY not set.');

  // Groq uses OpenAI-compatible API — just different baseURL
  const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  });

  const model = process.env.GROQ_MODEL || 'llama3-8b-8192';
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: getSystemPrompt() },
      { role: 'user', content: getUserPrompt(videoIdea) },
    ],
    max_tokens: 500,
    temperature: 0.8,
  });

  const script = response.choices?.[0]?.message?.content?.trim();
  if (!script) throw new Error('Groq returned empty response.');
  return { script, provider: 'groq', warning: null };
}

async function generateWithOllama(videoIdea) {
  const endpoint = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
  const model = process.env.OLLAMA_MODEL || 'llama3.2:3b';

  const response = await fetch(`${endpoint}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        { role: 'system', content: getSystemPrompt() },
        { role: 'user', content: getUserPrompt(videoIdea) },
      ],
    }),
  });

  if (!response.ok) throw new Error(`Ollama error ${response.status}`);
  const payload = await response.json();
  const script = payload.message?.content?.trim();
  if (!script) throw new Error('Ollama returned empty content.');
  return { script, provider: 'ollama', warning: null };
}

async function generateShortScript(videoIdea) {
  const provider = getProvider();
  const attempts = [];

  if (provider === 'openai') {
    attempts.push({ name: 'openai', fn: () => generateWithOpenAI(videoIdea) });
  } else if (provider === 'groq') {
    attempts.push({ name: 'groq', fn: () => generateWithGroq(videoIdea) });
  } else if (provider === 'ollama') {
    attempts.push({ name: 'ollama', fn: () => generateWithOllama(videoIdea) });
  } else {
    // auto mode: try groq first (free), then openai, then ollama
    if (process.env.GROQ_API_KEY) attempts.push({ name: 'groq', fn: () => generateWithGroq(videoIdea) });
    if (process.env.OPENAI_API_KEY) attempts.push({ name: 'openai', fn: () => generateWithOpenAI(videoIdea) });
    attempts.push({ name: 'ollama', fn: () => generateWithOllama(videoIdea) });
  }

  for (const attempt of attempts) {
    try {
      const result = await attempt.fn();
      console.log(`[nexa] Script via ${result.provider}`);
      return result;
    } catch (err) {
      console.warn(`[nexa] ${attempt.name} failed: ${err.message}`);
    }
  }

  return {
    script: buildFallbackScript(videoIdea),
    provider: 'fallback',
    warning: 'No AI provider available. Set GROQ_API_KEY for free AI generation at groq.com',
  };
}

module.exports = { generateShortScript };
