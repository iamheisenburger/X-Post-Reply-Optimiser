// topic-extractor.ts - Extract key topics from tweets WITHOUT AI

export interface ExtractedTopic {
  mainTopic: string;
  keywords: string[];
  tweetType: 'question' | 'statement' | 'opinion' | 'announcement' | 'story';
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  hasNumbers: boolean;
  hasCallToAction: boolean;
}

/**
 * Extract the core topic from a tweet using NLP techniques
 * NO AI - pure rules and pattern matching
 */
export function extractTopic(tweetText: string): ExtractedTopic {
  const cleaned = tweetText.toLowerCase().trim();
  
  // Detect tweet type
  const tweetType = detectTweetType(cleaned);
  
  // Extract keywords (remove stop words, get meaningful terms)
  const keywords = extractKeywords(cleaned);
  
  // Identify main topic (most important keyword/phrase)
  const mainTopic = identifyMainTopic(cleaned, keywords);
  
  // Detect sentiment
  const sentiment = detectSentiment(cleaned);
  
  // Check for numbers (data-driven)
  const hasNumbers = /\d+[%x]|\$\d+|\d+\s*(users|people|times|days|years|months)/.test(tweetText);
  
  // Check for call to action
  const hasCallToAction = /\b(check out|read|learn|follow|subscribe|sign up|try|download|watch)\b/i.test(tweetText);
  
  return {
    mainTopic,
    keywords,
    tweetType,
    sentiment,
    hasNumbers,
    hasCallToAction,
  };
}

function detectTweetType(text: string): ExtractedTopic['tweetType'] {
  // Question: has question mark or starts with question word
  if (/\?/.test(text) || /^(what|why|how|when|where|who|which|should|would|could|can|is|are|do|does|did)/i.test(text)) {
    return 'question';
  }
  
  // Announcement: launching, released, announcing
  if (/\b(launching|released|announcing|excited to|proud to|introducing|new)\b/i.test(text)) {
    return 'announcement';
  }
  
  // Story: personal narrative indicators
  if (/\b(today|yesterday|just|remember when|back when|story time|thread)\b/i.test(text)) {
    return 'story';
  }
  
  // Opinion: strong stance indicators
  if (/\b(believe|think|opinion|honestly|truth|fact|wrong|right|best|worst|should|shouldn't|never|always)\b/i.test(text)) {
    return 'opinion';
  }
  
  // Default: statement
  return 'statement';
}

function extractKeywords(text: string): string[] {
  // Stop words to remove
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
    'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her',
    'its', 'our', 'their', 'me', 'him', 'them', 'us', 'just', 'so', 'than',
    'very', 'too', 'also', 'not', 'no', 'yes', 'more', 'most', 'some', 'any'
  ]);
  
  // Extract words, remove punctuation, filter stop words
  const words = text
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !stopWords.has(word))
    .filter(word => !/^\d+$/.test(word)); // Remove pure numbers
  
  // Get unique words, sort by frequency
  const frequency = new Map<string, number>();
  words.forEach(word => frequency.set(word, (frequency.get(word) || 0) + 1));
  
  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

function identifyMainTopic(text: string, keywords: string[]): string {
  // Check for common topics in tech/SaaS/business
  const topicPatterns = {
    'product development': /\b(product|feature|build|ship|develop|launch|release)\b/i,
    'scaling': /\b(scale|scaling|growth|grow|expand)\b/i,
    'team management': /\b(team|hire|hiring|culture|manage|lead|leadership)\b/i,
    'fundraising': /\b(raise|raised|funding|investor|round|series)\b/i,
    'metrics': /\b(metrics|data|analytics|kpi|numbers|revenue|arr|mrr)\b/i,
    'marketing': /\b(marketing|seo|content|growth|traffic|conversion)\b/i,
    'sales': /\b(sales|selling|customer|deal|pipeline|close)\b/i,
    'engineering': /\b(code|coding|engineer|technical|architecture|infrastructure)\b/i,
    'design': /\b(design|ux|ui|user experience|interface)\b/i,
    'ai/ml': /\b(ai|ml|machine learning|artificial intelligence|model|gpt)\b/i,
    'training': /\b(train|training|workout|practice|drill|conditioning)\b/i,
    'fighting': /\b(fight|fighting|combat|spar|sparring|technique)\b/i,
    'discipline': /\b(discipline|focus|mindset|mental|motivation)\b/i,
    'health': /\b(health|nutrition|diet|recovery|injury|wellness)\b/i,
  };
  
  for (const [topic, pattern] of Object.entries(topicPatterns)) {
    if (pattern.test(text)) {
      return topic;
    }
  }
  
  // Fallback: use most frequent keyword
  return keywords[0] || 'general';
}

function detectSentiment(text: string): ExtractedTopic['sentiment'] {
  const positiveWords = /\b(great|amazing|awesome|excellent|love|best|good|happy|excited|perfect|beautiful|wonderful|fantastic|incredible)\b/i;
  const negativeWords = /\b(bad|worst|hate|terrible|awful|horrible|poor|sad|angry|frustrated|disappointed|fail|failed|problem|issue|broken)\b/i;
  
  const hasPositive = positiveWords.test(text);
  const hasNegative = negativeWords.test(text);
  
  if (hasPositive && hasNegative) return 'mixed';
  if (hasPositive) return 'positive';
  if (hasNegative) return 'negative';
  return 'neutral';
}

/**
 * Identify niche-specific elements in tweet
 */
export function identifyNicheElements(text: string): {
  isSaaS: boolean;
  isMMA: boolean;
  isTech: boolean;
  isMindset: boolean;
  isFinance: boolean;
} {
  return {
    isSaaS: /\b(saas|software|product|startup|founder|b2b|b2c|customer|user|arr|mrr|churn)\b/i.test(text),
    isMMA: /\b(mma|ufc|fight|fighting|combat|martial arts|bjj|boxing|wrestling|training|cage|octagon)\b/i.test(text),
    isTech: /\b(code|coding|engineer|developer|api|database|frontend|backend|architecture|infrastructure)\b/i.test(text),
    isMindset: /\b(mindset|discipline|focus|motivation|goal|habit|routine|mental|philosophy|principle)\b/i.test(text),
    isFinance: /\b(money|revenue|profit|investment|funding|raise|valuation|financial|cash)\b/i.test(text),
  };
}

