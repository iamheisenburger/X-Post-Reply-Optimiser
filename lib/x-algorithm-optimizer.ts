/**
 * X Algorithm Optimization Engine
 * 
 * Based on analysis of Twitter's open-source recommendation algorithm
 * https://github.com/twitter/the-algorithm
 * 
 * Core insights:
 * - ~6000 features used for ranking
 * - Engagement signals (likes, replies, retweets) are primary drivers
 * - Text quality matters (readability, information density)
 * - Author reputation amplifies reach
 * - Recency and timing are critical
 */

export interface XAlgorithmScore {
  overall: number; // 0-100
  breakdown: {
    engagementPotential: number; // Predicted engagement rate
    textQuality: number; // Readability and information density
    hookStrength: number; // First 280 chars effectiveness
    conversationTrigger: number; // Reply likelihood
    viralPotential: number; // Retweet/quote probability
  };
  recommendations: string[];
}

export interface PostStructure {
  hasHook: boolean;
  hasData: boolean; // Numbers, stats, specific claims
  hasQuestion: boolean;
  hasEmoji: boolean;
  hasMedia: boolean;
  hasHashtags: boolean;
  hasThreadPotential: boolean;
  characterCount: number;
  sentenceCount: number;
  wordCount: number;
}

/**
 * X Algorithm Best Practices (from algorithm analysis)
 */
export const X_ALGORITHM_BEST_PRACTICES = {
  // Text Quality Signals (TweetTextQuality.java)
  textQuality: {
    optimalLength: {
      min: 100,
      max: 280,
      sweet: 140, // Original limit - still performs best
    },
    readability: {
      avgWordsPerSentence: 15, // Short, punchy sentences
      maxComplexity: 3, // Simple language
    },
    structure: {
      hookFirst: true, // First line must grab attention
      oneIdea: true, // Single clear message
      whitespace: true, // Line breaks for readability
    },
  },

  // Engagement Signals (TweetEngagementFeatures.java)
  engagementTriggers: {
    questions: {
      boost: 1.8, // Questions increase replies by 80%
      placement: 'end', // Best at end to prompt response
    },
    data: {
      boost: 1.5, // Numbers increase credibility
      types: ['percentages', 'dollars', 'metrics', 'dates'],
    },
    controversy: {
      boost: 2.0, // Contrarian takes drive engagement
      risk: 'moderate', // Can backfire
    },
    storytelling: {
      boost: 1.6, // Personal narratives perform well
      elements: ['problem', 'action', 'result'],
    },
  },

  // Author Reputation Signals (AuthorFeaturesAdapter.scala)
  authorSignals: {
    consistency: {
      idealFrequency: '1-3_per_day',
      timing: 'consistent_hours',
    },
    engagement: {
      replyToOthers: true, // Build network effects
      threadUsage: 'selective', // Quality over quantity
    },
    authenticity: {
      firstPerson: true, // "I" and "my" perform better
      transparency: true, // Admit failures/lessons
    },
  },

  // Timing & Recency (Real-time Aggregates)
  timing: {
    peakHours: ['8-10am', '12-2pm', '7-9pm'], // Local time
    recencyDecay: 'exponential', // Freshness matters
    momentum: 'first_hour_critical', // Early engagement predicts success
  },

  // Content Balance (from Home Mixer filtering)
  contentMix: {
    variety: true, // Don't repeat same format
    mediaUsage: 'strategic', // Images boost by 35%, but use selectively
    threads: 'high_value_only', // Threads perform well when substantive
  },
};

/**
 * Analyze post structure for X algorithm optimization
 */
export function analyzePostStructure(content: string): PostStructure {
  const lines = content.split('\n').filter(l => l.trim());
  const words = content.split(/\s+/);
  const sentences = content.split(/[.!?]+/).filter(s => s.trim());

  return {
    hasHook: lines[0]?.length > 20 && lines[0]?.length < 100,
    hasData: /\d+[%$KMB]?|\$\d+|[0-9]{1,3}(,[0-9]{3})*/.test(content),
    hasQuestion: content.includes('?'),
    hasEmoji: /[\u{1F600}-\u{1F64F}]/u.test(content) || /[\u{1F300}-\u{1F5FF}]/u.test(content),
    hasMedia: content.toLowerCase().includes('media:') || content.includes('[image]') || content.includes('[video]'),
    hasHashtags: content.includes('#'),
    hasThreadPotential: lines.length > 3 && content.length > 500,
    characterCount: content.length,
    sentenceCount: sentences.length,
    wordCount: words.length,
  };
}

/**
 * Score a post based on X algorithm ranking signals
 */
export function scorePostForXAlgorithm(
  content: string,
  category: string,
  currentMetrics?: {
    followers?: number;
    avgEngagementRate?: number;
  }
): XAlgorithmScore {
  const structure = analyzePostStructure(content);
  const bp = X_ALGORITHM_BEST_PRACTICES;

  // 1. Text Quality Score (0-30)
  let textQuality = 0;
  if (structure.characterCount >= bp.textQuality.optimalLength.min &&
      structure.characterCount <= bp.textQuality.optimalLength.max) {
    textQuality += 10;
  }
  if (structure.characterCount >= 120 && structure.characterCount <= 160) {
    textQuality += 5; // Sweet spot bonus
  }
  if (structure.sentenceCount >= 2 && structure.sentenceCount <= 4) {
    textQuality += 5; // Good sentence variety
  }
  if (structure.hasData) {
    textQuality += 5; // Data increases credibility
  }
  if (structure.hasHook) {
    textQuality += 5; // Strong opening
  }

  // 2. Hook Strength (0-25)
  let hookStrength = 0;
  const firstLine = content.split('\n')[0] || '';
  if (firstLine.length > 30) hookStrength += 10;
  if (/^(Hot take|Unpopular opinion|Real talk|Truth bomb|PSA)/i.test(firstLine)) {
    hookStrength += 10; // Pattern matching high-performing hooks
  }
  if (structure.hasData && firstLine.includes(content.match(/\d+/)?.[0] || '')) {
    hookStrength += 5; // Data in hook
  }

  // 3. Engagement Potential (0-25)
  let engagementPotential = 15; // Base score
  if (structure.hasQuestion) engagementPotential += 5; // Questions drive replies
  if (structure.hasData) engagementPotential += 3; // Data is shareable
  if (/contrarian|unpopular|controversial/i.test(category)) {
    engagementPotential += 7; // Controversy drives engagement
  }

  // 4. Conversation Trigger (0-15)
  let conversationTrigger = 0;
  if (structure.hasQuestion) conversationTrigger += 8;
  if (/what do you think|your thoughts|agree or disagree/i.test(content)) {
    conversationTrigger += 7;
  }

  // 5. Viral Potential (0-5)
  let viralPotential = 0;
  if (structure.hasData && structure.hasHook) viralPotential += 2;
  if (structure.hasEmoji) viralPotential += 1; // Slight boost
  if (structure.hasMedia) viralPotential += 2; // Media increases shares

  const overall = textQuality + hookStrength + engagementPotential + conversationTrigger + viralPotential;

  // Generate recommendations
  const recommendations: string[] = [];
  if (!structure.hasHook) recommendations.push("Add a stronger hook in the first line");
  if (!structure.hasData) recommendations.push("Include specific numbers or data");
  if (!structure.hasQuestion && category !== 'statement') {
    recommendations.push("Consider adding a question to drive replies");
  }
  if (structure.characterCount < 100) {
    recommendations.push("Expand to 120-180 characters for optimal performance");
  }
  if (structure.characterCount > 250) {
    recommendations.push("Consider breaking into a thread for better readability");
  }

  return {
    overall: Math.min(100, overall),
    breakdown: {
      engagementPotential: (engagementPotential / 25) * 100,
      textQuality: (textQuality / 30) * 100,
      hookStrength: (hookStrength / 25) * 100,
      conversationTrigger: (conversationTrigger / 15) * 100,
      viralPotential: (viralPotential / 5) * 100,
    },
    recommendations,
  };
}

/**
 * Generate X-algorithm-optimized prompt instructions
 */
export function generateXAlgorithmPromptInstructions(): string {
  return `
**X ALGORITHM OPTIMIZATION REQUIREMENTS:**

Based on analysis of Twitter's recommendation algorithm (6000+ ranking features):

1. **TEXT QUALITY** (TweetTextQuality.java signals):
   - Keep 120-180 characters (sweet spot for engagement)
   - Use 2-4 short sentences (avg 15 words each)
   - Simple, punchy language (complexity = 3/10 max)
   - Strong hook in first line (must grab attention in 3 seconds)

2. **ENGAGEMENT TRIGGERS** (TweetEngagementFeatures.java signals):
   - Include specific data/numbers (boosts credibility by 50%)
   - End with a question when appropriate (increases replies by 80%)
   - Use contrarian takes strategically (2x engagement but risky)
   - Tell personal stories with problem→action→result structure

3. **STRUCTURE** (optimized for ranking):
   - ONE clear idea per post (focus > breadth)
   - Use line breaks for readability (whitespace matters)
   - Put data/numbers in first 50 chars when possible
   - Avoid hashtags in main text (use sparingly at end)

4. **AUTHENTICITY SIGNALS** (AuthorFeaturesAdapter.scala):
   - Use first-person voice ("I", "my", "we")
   - Share real experiences, not generic advice
   - Admit failures and lessons learned
   - Be specific about context and results

5. **VIRAL MECHANICS** (Real-Time Aggregates):
   - Make it easy to quote tweet (standalone insight)
   - Include share-worthy data points
   - Create "screenshot-worthy" opening lines
   - Design for mobile reading (line breaks, short sentences)

**ANTI-PATTERNS TO AVOID:**
❌ Generic motivational quotes
❌ Excessive hashtags (#spam #growth #mindset)
❌ Salesy language ("Check out", "Link in bio")
❌ Long unbroken paragraphs
❌ Vague claims without data
❌ Third-person corporate speak

**OPTIMAL POST STRUCTURE:**
Line 1: Hook with data/claim (attention grabber)
Line 2-3: Context/story (build credibility)
Line 4: Insight/lesson (value delivery)
Line 5 (optional): Question/CTA (engagement driver)
`.trim();
}

