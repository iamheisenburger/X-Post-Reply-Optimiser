/**
 * Anthropic Claude API client wrapper
 *
 * Claude is better than GPT-4o-mini at:
 * 1. Following complex instructions (specificity requirements)
 * 2. Self-critique (identifying when being vague)
 * 3. Reasoning (understanding concrete vs generic)
 * 4. Instruction adherence (less prompt engineering needed)
 */

import Anthropic from "@anthropic-ai/sdk";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

export async function generateWithClaude(
  systemPrompt: string,
  messages: ClaudeMessage[],
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not configured. Get one free at console.anthropic.com"
    );
  }

  const anthropic = new Anthropic({
    apiKey: ANTHROPIC_API_KEY,
  });

  const response = await anthropic.messages.create({
    model: options.model || "claude-haiku-4-5-20251001",
    max_tokens: options.maxTokens || 800,
    temperature: options.temperature ?? 0.7,
    system: systemPrompt,
    messages,
  });

  if (response.content[0].type === "text") {
    return response.content[0].text;
  }

  throw new Error("Unexpected response format from Claude");
}

/**
 * Generate reply with Claude (better instruction-following than GPT-4o-mini)
 */
export async function generateReplyWithClaude(
  systemPrompt: string,
  context: string,
  previousAttempt?: string,
  feedback?: string,
  iteration: number = 1
): Promise<string> {
  const messages: ClaudeMessage[] = [{ role: "user", content: context }];

  if (previousAttempt && feedback) {
    messages.push({
      role: "assistant",
      content: previousAttempt,
    });
    messages.push({
      role: "user",
      content: `FEEDBACK: ${feedback}\n\nRegenerate the reply addressing these issues. Be CONCRETE and SPECIFIC.`,
    });
  }

  // Claude Haiku 4.5 - faster and more cost-effective while maintaining quality
  const model = "claude-haiku-4-5-20251001";
  const temperature = iteration <= 2 ? 0.7 : 0.9;

  console.log(`   🤖 Using ${model} for iteration ${iteration} (temp: ${temperature})`);

  return generateWithClaude(systemPrompt, messages, {
    model,
    temperature,
    maxTokens: 800,
  });
}

/**
 * Analyze creator profile with Claude (better at nuanced analysis)
 */
export async function analyzeCreatorProfileWithClaude(
  bio: string,
  recentTweets: string[]
): Promise<{
  primaryNiche: string;
  secondaryNiches: string[];
  audienceInterests: string[];
  audienceIrrelevantTopics: string[];
  crossoverPotential: {
    mmaRelevance: number;
    saasRelevance: number;
    disciplineTopics: number;
    philosophyTopics: number;
  };
  optimalReplyMode: string;
  respondsTo: string[];
  preferredTone: string;
  avoidTopics: string[];
  emphasizeTopics: string[];
}> {
  const prompt = `Analyze this X creator's profile and recent tweets.

Profile Bio: ${bio}

Recent Tweets:
${recentTweets.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "primaryNiche": "saas|mma|tech|finance|mindset|other",
  "secondaryNiches": ["array", "of", "niches"],
  "audienceInterests": ["what", "their", "audience", "cares", "about"],
  "audienceIrrelevantTopics": ["topics", "their", "audience", "does", "not", "care", "about"],
  "crossoverPotential": {
    "mmaRelevance": 0-5,
    "saasRelevance": 0-5,
    "disciplineTopics": 0-5,
    "philosophyTopics": 0-5
  },
  "optimalReplyMode": "pure_saas|pure_mma|mindset_crossover|technical",
  "respondsTo": ["types", "of", "replies", "they", "engage", "with"],
  "preferredTone": "technical|casual|philosophical|direct|analytical",
  "avoidTopics": ["topics", "to", "avoid"],
  "emphasizeTopics": ["topics", "to", "emphasize"]
}

Be precise about crossoverPotential ratings:
- 0 = completely irrelevant
- 1-2 = barely relevant
- 3 = somewhat relevant
- 4-5 = core interest

Example: If creator is @levelsio (indie hacker), mmaRelevance=0, saasRelevance=5
Example: If creator is @arielhelwani (MMA journalist), mmaRelevance=5, saasRelevance=0`;

  const systemPrompt = `You are an expert at analyzing X/Twitter creator profiles and their audiences.
Always return valid JSON only, no markdown formatting, no explanations.`;

  const response = await generateWithClaude(
    systemPrompt,
    [{ role: "user", content: prompt }],
    {
      temperature: 0.3, // Lower temperature for consistent analysis
      maxTokens: 800,
    }
  );

  // Clean up response - Claude is better at following "no markdown" but just in case
  let cleanResponse = response.trim();
  if (cleanResponse.startsWith("```json")) {
    cleanResponse = cleanResponse
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "");
  } else if (cleanResponse.startsWith("```")) {
    cleanResponse = cleanResponse.replace(/```\n?/g, "");
  }

  return JSON.parse(cleanResponse);
}
