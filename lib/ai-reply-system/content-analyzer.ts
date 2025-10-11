// content-analyzer.ts - Extract meaningful content from tweets for reply construction

export interface TweetContent {
  mainClaim: string;           // The core statement/claim
  keyPhrases: string[];        // Important phrases to reference
  entities: string[];          // People, companies, products mentioned
  numbers: string[];           // Stats, metrics mentioned
  actionWords: string[];       // Verbs that indicate action/process
  problemMentioned: string | null;  // If tweet mentions a problem
  solutionMentioned: string | null; // If tweet mentions a solution
  hasExample: boolean;
  exampleContent: string | null;
}

/**
 * Extract meaningful content from tweet text for reply construction
 * This enables replies to REFERENCE specific tweet content
 */
export function analyzeTweetContent(tweetText: string): TweetContent {
  const cleaned = tweetText.trim();
  
  // Extract key phrases (2-4 word meaningful chunks)
  const keyPhrases = extractKeyPhrases(cleaned);
  
  // Extract entities (capitalized words that aren't at start of sentence)
  const entities = extractEntities(cleaned);
  
  // Extract numbers/stats
  const numbers = extractNumbers(cleaned);
  
  // Extract action words (important verbs)
  const actionWords = extractActionWords(cleaned);
  
  // Identify problem/solution pattern
  const { problem, solution } = extractProblemSolution(cleaned);
  
  // Identify examples
  const { hasExample, exampleContent } = extractExample(cleaned);
  
  // Extract main claim (first sentence or key statement)
  const mainClaim = extractMainClaim(cleaned);
  
  return {
    mainClaim,
    keyPhrases,
    entities,
    numbers,
    actionWords,
    problemMentioned: problem,
    solutionMentioned: solution,
    hasExample,
    exampleContent,
  };
}

function extractMainClaim(text: string): string {
  // Get first sentence or first 100 chars
  const firstSentence = text.split(/[.!?]/)[0];
  return firstSentence.trim().substring(0, 100);
}

function extractKeyPhrases(text: string): string[] {
  const phrases: string[] = [];
  
  // Split into sentences
  const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 10);
  
  for (const sentence of sentences) {
    const words = sentence.toLowerCase().split(/\s+/);
    
    // Extract 2-4 word phrases that don't start with stop words
    for (let i = 0; i < words.length - 1; i++) {
      const twoWord = words.slice(i, i + 2).join(' ');
      const threeWord = words.slice(i, i + 3).join(' ');
      
      if (isSignificantPhrase(twoWord)) phrases.push(twoWord);
      if (words.length > i + 2 && isSignificantPhrase(threeWord)) phrases.push(threeWord);
    }
  }
  
  // If no phrases found, generate fallback from main claim
  if (phrases.length === 0) {
    const mainWords = text.split(/\s+/).filter(w => w.length > 3 && !/^(the|a|an|to|for|of|in|on|at|is|are)$/.test(w.toLowerCase()));
    if (mainWords.length >= 2) {
      phrases.push(mainWords.slice(0, 3).join(' '));
    }
  }
  
  // Return unique, sorted by length (longer = more specific)
  return [...new Set(phrases)].sort((a, b) => b.length - a.length).slice(0, 5);
}

function isSignificantPhrase(phrase: string): boolean {
  const stopStarts = ['the ', 'a ', 'an ', 'to ', 'for ', 'of ', 'in ', 'on ', 'at ', 'is ', 'are '];
  const hasStopStart = stopStarts.some(stop => phrase.startsWith(stop));
  return !hasStopStart && phrase.length > 5;
}

function extractEntities(text: string): string[] {
  const words = text.split(/\s+/);
  const entities: string[] = [];
  
  for (let i = 1; i < words.length; i++) { // Skip first word (likely capitalized naturally)
    const word = words[i];
    // Capitalized word that's not at start of sentence
    if (/^[A-Z][a-zA-Z]+$/.test(word) && word.length > 2) {
      entities.push(word);
    }
  }
  
  // Edge case: If no entities, try to infer from common patterns
  if (entities.length === 0) {
    // No fallback for now - leave empty
  }
  
  return [...new Set(entities)];
}

function extractNumbers(text: string): string[] {
  const numbers: string[] = [];
  
  // Match patterns like: 5x, 10%, $100, 100 users, 3 months
  const patterns = [
    /\d+[x%]/g,
    /\$\d+[kmb]?/gi,
    /\d+\s*(users|people|times|days|months|years|hours)/gi,
  ];
  
  patterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) numbers.push(...matches);
  });
  
  return [...new Set(numbers)];
}

function extractActionWords(text: string): string[] {
  const actionVerbs = [
    'build', 'ship', 'launch', 'scale', 'grow', 'create', 'develop', 'design',
    'train', 'learn', 'improve', 'optimize', 'solve', 'fix', 'implement',
    'fight', 'compete', 'execute', 'iterate', 'test', 'validate', 'deploy',
  ];
  
  const words = text.toLowerCase().split(/\s+/);
  const found = words.filter(word => {
    const base = word.replace(/ing$|ed$|s$/, ''); // Remove common endings
    return actionVerbs.includes(base);
  });
  
  return [...new Set(found)];
}

function extractProblemSolution(text: string): { problem: string | null; solution: string | null } {
  const lowerText = text.toLowerCase();
  
  // Problem indicators
  const problemPatterns = [
    /problem is (.+?)[.!?]/i,
    /issue with (.+?)[.!?]/i,
    /struggle with (.+?)[.!?]/i,
    /challenge (.+?)[.!?]/i,
    /difficult to (.+?)[.!?]/i,
  ];
  
  let problem: string | null = null;
  for (const pattern of problemPatterns) {
    const match = text.match(pattern);
    if (match) {
      problem = match[1].trim();
      break;
    }
  }
  
  // Solution indicators
  const solutionPatterns = [
    /solution is (.+?)[.!?]/i,
    /fix is (.+?)[.!?]/i,
    /answer is (.+?)[.!?]/i,
    /key is (.+?)[.!?]/i,
    /secret is (.+?)[.!?]/i,
  ];
  
  let solution: string | null = null;
  for (const pattern of solutionPatterns) {
    const match = text.match(pattern);
    if (match) {
      solution = match[1].trim();
      break;
    }
  }
  
  return { problem, solution };
}

function extractExample(text: string): { hasExample: boolean; exampleContent: string | null } {
  const exampleIndicators = [
    /for example[,:]?\s*(.+?)[.!?]/i,
    /like\s+(.+?)[.!?]/i,
    /such as\s+(.+?)[.!?]/i,
    /e\.g\.\s*(.+?)[.!?]/i,
  ];
  
  for (const pattern of exampleIndicators) {
    const match = text.match(pattern);
    if (match) {
      return { hasExample: true, exampleContent: match[1].trim() };
    }
  }
  
  return { hasExample: false, exampleContent: null };
}

/**
 * Build a summary of what the tweet is about (for reply construction)
 */
export function buildTweetSummary(content: TweetContent): string {
  const parts: string[] = [];
  
  if (content.mainClaim) {
    parts.push(`Main point: "${content.mainClaim}"`);
  }
  
  if (content.entities.length > 0) {
    parts.push(`Mentions: ${content.entities.join(', ')}`);
  }
  
  if (content.numbers.length > 0) {
    parts.push(`Stats: ${content.numbers.join(', ')}`);
  }
  
  if (content.problemMentioned) {
    parts.push(`Problem: "${content.problemMentioned}"`);
  }
  
  if (content.solutionMentioned) {
    parts.push(`Solution: "${content.solutionMentioned}"`);
  }
  
  return parts.join(' | ');
}

