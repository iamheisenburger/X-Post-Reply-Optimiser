// OpenAI API client wrapper

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIResponse {
  id: string;
  choices: Array<{
    message: {
      content: string;
    };
    finish_reason: string;
  }>;
}

export async function generateWithOpenAI(
  messages: OpenAIMessage[],
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured. Add it to your environment variables.");
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: options.model || "gpt-4o-mini",
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens || 500,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
  }

  const data: OpenAIResponse = await response.json();
  return data.choices[0].message.content;
}

interface CreatorAnalysis {
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
}

export async function analyzeCreatorProfile(
  bio: string,
  recentTweets: string[]
): Promise<CreatorAnalysis> {
  const prompt = `Analyze this X creator's profile and recent tweets.

Profile Bio: ${bio}

Recent Tweets:
${recentTweets.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Analyze and return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
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

  const response = await generateWithOpenAI(
    [
      {
        role: "system",
        content: "You are an expert at analyzing X/Twitter creator profiles and their audiences. Always return valid JSON only, no markdown formatting."
      },
      { role: "user", content: prompt }
    ],
    {
      temperature: 0.3, // Lower temperature for more consistent analysis
      maxTokens: 800
    }
  );

  // Clean up the response - remove markdown code blocks if present
  let cleanResponse = response.trim();
  if (cleanResponse.startsWith("```json")) {
    cleanResponse = cleanResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "");
  } else if (cleanResponse.startsWith("```")) {
    cleanResponse = cleanResponse.replace(/```\n?/g, "");
  }

  return JSON.parse(cleanResponse);
}

export async function generateReply(
  systemPrompt: string,
  context: string,
  previousAttempt?: string,
  feedback?: string
): Promise<string> {
  const messages: OpenAIMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: context }
  ];

  if (previousAttempt && feedback) {
    messages.push({
      role: "assistant",
      content: previousAttempt
    });
    messages.push({
      role: "user",
      content: `FEEDBACK: ${feedback}\n\nRegenerate the reply addressing these issues.`
    });
  }

  return generateWithOpenAI(messages, {
    temperature: 0.8, // More creative for reply generation
    maxTokens: 300
  });
}

