/**
 * Keyword Extractor
 * 
 * Extracts KEY terms from the original tweet that MUST be used in replies
 * for high content relevance scores. The X algorithm wants exact keyword matches,
 * not synonyms.
 */

export interface KeywordExtractionResult {
  primaryKeywords: string[];      // Main concepts (3-5 words)
  actionVerbs: string[];           // Key action words
  emotionalWords: string[];        // Emotional/power words
  uniquePhrases: string[];         // Distinctive 2-3 word phrases
}

/**
 * Extract keywords from a tweet for content relevance matching
 */
export function extractKeywords(tweetText: string): KeywordExtractionResult {
  const text = tweetText.toLowerCase();
  
  // Common stop words to ignore
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might',
    'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it',
    'we', 'they', 'them', 'their', 'what', 'which', 'who', 'when', 'where',
    'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
    'other', 'some', 'such', 'no', 'not', 'only', 'own', 'same', 'so',
    'than', 'too', 'very', 'just', 'don', 't', 's'
  ]);

  // Extract words (filter stop words, keep 4+ letters or important short words)
  const words = text
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0)
    .filter(w => !stopWords.has(w) || ['mind', 'fear', 'hope', 'word', 'life', 'self'].includes(w));

  // Count word frequency
  const wordFreq = new Map<string, number>();
  words.forEach(word => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  });

  // Action verbs (common in tweets about doing/achieving)
  const actionVerbPatterns = [
    'build', 'create', 'make', 'start', 'launch', 'grow', 'scale', 'learn',
    'discover', 'find', 'achieve', 'master', 'improve', 'optimize', 'train',
    'fight', 'compete', 'win', 'lose', 'practice', 'work', 'focus', 'ship',
    'talk', 'feed', 'believe', 'shape', 'think', 'feel', 'know', 'understand'
  ];
  const actionVerbs = words.filter(w => actionVerbPatterns.includes(w));

  // Emotional/power words
  const emotionalPatterns = [
    'fear', 'hope', 'courage', 'doubt', 'confidence', 'anxiety', 'calm',
    'stressed', 'peaceful', 'angry', 'happy', 'sad', 'excited', 'nervous',
    'powerful', 'weak', 'strong', 'broken', 'whole', 'lost', 'found',
    'kindly', 'harsh', 'gentle', 'brutal'
  ];
  const emotionalWords = words.filter(w => emotionalPatterns.includes(w));

  // Primary keywords (most frequent non-stop words, or words appearing 2+ times)
  const primaryKeywords = Array.from(wordFreq.entries())
    .filter(([word, freq]) => word.length >= 4 || ['mind', 'fear', 'hope', 'word', 'life', 'self'].includes(word))
    .sort((a, b) => b[1] - a[1])  // Sort by frequency
    .slice(0, 8)                    // Top 8
    .map(([word]) => word);

  // Extract 2-3 word distinctive phrases
  const sentences = tweetText.split(/[.!?]\s+/);
  const uniquePhrases: string[] = [];
  
  sentences.forEach(sentence => {
    const sentenceWords = sentence.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0);
    
    // Extract 2-word phrases
    for (let i = 0; i < sentenceWords.length - 1; i++) {
      const phrase = `${sentenceWords[i]} ${sentenceWords[i + 1]}`;
      if (!stopWords.has(sentenceWords[i]) || !stopWords.has(sentenceWords[i + 1])) {
        uniquePhrases.push(phrase);
      }
    }
    
    // Extract 3-word phrases  
    for (let i = 0; i < sentenceWords.length - 2; i++) {
      const phrase = `${sentenceWords[i]} ${sentenceWords[i + 1]} ${sentenceWords[i + 2]}`;
      if (!stopWords.has(sentenceWords[i]) && !stopWords.has(sentenceWords[i + 2])) {
        uniquePhrases.push(phrase);
      }
    }
  });

  return {
    primaryKeywords: [...new Set(primaryKeywords)],
    actionVerbs: [...new Set(actionVerbs)],
    emotionalWords: [...new Set(emotionalWords)],
    uniquePhrases: [...new Set(uniquePhrases)].slice(0, 5)
  };
}

/**
 * Check if a reply uses enough keywords from the original tweet
 */
export function validateKeywordUsage(
  reply: string,
  keywords: KeywordExtractionResult
): { passed: boolean; score: number; missingKeywords: string[]; usedKeywords: string[] } {
  const replyLower = reply.toLowerCase();
  
  const usedPrimary = keywords.primaryKeywords.filter(k => replyLower.includes(k));
  const usedVerbs = keywords.actionVerbs.filter(k => replyLower.includes(k));
  const usedEmotional = keywords.emotionalWords.filter(k => replyLower.includes(k));
  const usedPhrases = keywords.uniquePhrases.filter(k => replyLower.includes(k));

  const totalKeywords = keywords.primaryKeywords.length;
  const usedCount = usedPrimary.length;
  const usagePercent = totalKeywords > 0 ? (usedCount / totalKeywords) * 100 : 0;

  // Calculate score
  let score = 0;
  score += (usedPrimary.length / Math.max(keywords.primaryKeywords.length, 1)) * 60; // Primary keywords worth 60%
  score += (usedVerbs.length / Math.max(keywords.actionVerbs.length, 1)) * 15;       // Verbs worth 15%
  score += (usedEmotional.length / Math.max(keywords.emotionalWords.length, 1)) * 15; // Emotional worth 15%
  score += (usedPhrases.length / Math.max(keywords.uniquePhrases.length, 1)) * 10;    // Phrases worth 10%

  const passed = score >= 40; // Need at least 40% keyword match

  const missingKeywords = [
    ...keywords.primaryKeywords.filter(k => !replyLower.includes(k)),
    ...keywords.emotionalWords.filter(k => !replyLower.includes(k))
  ].slice(0, 5);

  const usedKeywords = [
    ...usedPrimary,
    ...usedVerbs,
    ...usedEmotional
  ];

  return {
    passed,
    score: Math.min(100, Math.round(score)),
    missingKeywords,
    usedKeywords
  };
}

