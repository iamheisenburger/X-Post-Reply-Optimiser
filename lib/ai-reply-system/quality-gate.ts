// quality-gate.ts - Quality assessment and feedback loop system

import type { CreatorIntelligence } from './types';
import type { TweetContent } from './content-analyzer';
import type { BuiltReply } from './reply-builder';

export interface QualityReport {
  passed: boolean;
  bestScore: number;
  issues: string[];
  improvements: ReplyConstraints;
  attemptNumber: number;
}

export interface ReplyConstraints {
  mustIncludeQuestion?: string;
  mustReferencePhrases?: string[];
  mustReferenceTopics?: string[];
  mustUseTone?: string;
  mustHaveFeature?: ('question' | 'pushback' | 'data' | 'example')[];
  avoidGenericPhrases?: boolean;
  emphasizeCreatorTopics?: string[];
}

const QUALITY_THRESHOLD = 60;
const MIN_FEATURE_SCORE = 40;

/**
 * Assess quality of generated replies and provide improvement instructions
 */
export function assessQuality(
  replies: BuiltReply[],
  creator: CreatorIntelligence,
  tweetContent: TweetContent,
  attemptNumber: number
): QualityReport {
  const issues: string[] = [];
  const improvements: ReplyConstraints = {};
  
  // Sort by score to get best
  const sorted = [...replies].sort((a, b) => b.score - a.score);
  const bestScore = sorted[0]?.score || 0;
  
  console.log(`\n🔍 Quality Assessment - Attempt ${attemptNumber}`);
  console.log(`   Best score: ${bestScore}/100`);
  
  // ============================================
  // CHECK 1: Score Threshold
  // ============================================
  if (bestScore < QUALITY_THRESHOLD) {
    issues.push(`Low engagement potential (best: ${bestScore}/100, need: ${QUALITY_THRESHOLD})`);
    console.log(`   ❌ Score too low: ${bestScore} < ${QUALITY_THRESHOLD}`);
    
    // Identify what's missing for higher scores
    const bestReply = sorted[0];
    if (!bestReply.features.hasQuestion) {
      improvements.mustHaveFeature = improvements.mustHaveFeature || [];
      improvements.mustHaveFeature.push('question');
    }
    if (!bestReply.features.hasPushback) {
      improvements.mustHaveFeature = improvements.mustHaveFeature || [];
      improvements.mustHaveFeature.push('pushback');
    }
    if (!bestReply.features.hasSpecificData && tweetContent.numbers.length > 0) {
      improvements.mustHaveFeature = improvements.mustHaveFeature || [];
      improvements.mustHaveFeature.push('data');
    }
  } else {
    console.log(`   ✅ Score acceptable: ${bestScore}/100`);
  }
  
  // ============================================
  // CHECK 2: Feature Detection
  // ============================================
  const hasQuestion = replies.some(r => r.features.hasQuestion);
  const hasPushback = replies.some(r => r.features.hasPushback);
  const hasData = replies.some(r => r.features.hasSpecificData);
  
  if (!hasQuestion) {
    issues.push('Missing question reply (75x author response weight)');
    console.log(`   ❌ No question reply found`);
    
    // Generate specific question based on creator profile
    if (creator.audience.engagementPatterns.respondsTo.includes('thoughtful questions')) {
      const topic = creator.optimalReplyStrategy.emphasizeTopics[0];
      improvements.mustIncludeQuestion = `Ask about ${topic} related to their specific point`;
    } else if (tweetContent.keyPhrases.length > 0) {
      improvements.mustIncludeQuestion = `Ask how they developed their approach to "${tweetContent.keyPhrases[0]}"`;
    } else {
      improvements.mustIncludeQuestion = 'Ask about their process or methodology';
    }
  } else {
    console.log(`   ✅ Has question reply`);
  }
  
  if (!hasPushback) {
    issues.push('Missing contrarian angle (memorable + defensible)');
    console.log(`   ❌ No contrarian reply found`);
    improvements.mustHaveFeature = improvements.mustHaveFeature || [];
    improvements.mustHaveFeature.push('pushback');
  } else {
    console.log(`   ✅ Has contrarian reply`);
  }
  
  if (!hasData && tweetContent.numbers.length > 0) {
    issues.push(`Tweet mentions data (${tweetContent.numbers.join(', ')}) but replies don't reference it`);
    console.log(`   ⚠️  Tweet has numbers but replies don't reference them`);
  }
  
  // ============================================
  // CHECK 3: Content Specificity
  // ============================================
  const referencesContent = replies.filter(r => {
    // Check if reply references any key phrase from tweet
    const lowerText = r.text.toLowerCase();
    return tweetContent.keyPhrases.some(phrase => 
      lowerText.includes(phrase.toLowerCase())
    ) || tweetContent.mainClaim.split(' ').slice(0, 5).some(word => 
      word.length > 4 && lowerText.includes(word.toLowerCase())
    );
  });
  
  if (referencesContent.length < 2) {
    issues.push('Replies too generic - must reference specific tweet content');
    console.log(`   ❌ Only ${referencesContent.length}/3 replies reference tweet content`);
    
    improvements.mustReferencePhrases = tweetContent.keyPhrases.slice(0, 2);
    improvements.avoidGenericPhrases = true;
  } else {
    console.log(`   ✅ ${referencesContent.length}/3 replies reference tweet content`);
  }
  
  // ============================================
  // CHECK 4: Creator Profile Matching
  // ============================================
  const emphasizedTopics = creator.optimalReplyStrategy.emphasizeTopics;
  const matchesProfile = replies.filter(r => {
    const lowerText = r.text.toLowerCase();
    return emphasizedTopics.some(topic => 
      lowerText.includes(topic.toLowerCase())
    );
  });
  
  if (matchesProfile.length === 0 && emphasizedTopics.length > 0) {
    issues.push(`Not leveraging creator's emphasized topics: ${emphasizedTopics.join(', ')}`);
    console.log(`   ❌ No replies reference creator's emphasized topics`);
    
    improvements.emphasizeCreatorTopics = emphasizedTopics.slice(0, 2);
  } else {
    console.log(`   ✅ ${matchesProfile.length}/3 replies match creator profile`);
  }
  
  // ============================================
  // CHECK 5: Tone Matching
  // ============================================
  const preferredTone = creator.audience.engagementPatterns.preferredTone;
  if (preferredTone && !improvements.mustUseTone) {
    improvements.mustUseTone = preferredTone;
  }
  
  // ============================================
  // CHECK 6: Diversity
  // ============================================
  const strategies = new Set(replies.map(r => r.strategy));
  if (strategies.size < 3) {
    issues.push('Replies too similar - need distinct strategies');
    console.log(`   ❌ Only ${strategies.size} distinct strategies (need 3)`);
  } else {
    console.log(`   ✅ 3 distinct strategies`);
  }
  
  // ============================================
  // PASS/FAIL DECISION
  // ============================================
  const passed = issues.length === 0 && bestScore >= QUALITY_THRESHOLD;
  
  if (passed) {
    console.log(`\n✅ QUALITY GATE PASSED on attempt ${attemptNumber}`);
  } else {
    console.log(`\n⚠️  QUALITY GATE FAILED on attempt ${attemptNumber}`);
    console.log(`   Issues: ${issues.length}`);
    issues.forEach(issue => console.log(`     - ${issue}`));
  }
  
  return {
    passed,
    bestScore,
    issues,
    improvements,
    attemptNumber,
  };
}

/**
 * Check if we should keep iterating
 */
export function shouldIterate(report: QualityReport, maxAttempts: number = 3): boolean {
  if (report.passed) return false;
  if (report.attemptNumber >= maxAttempts) return false;
  
  // If score is catastrophically low and we've tried twice, give up
  if (report.bestScore < 30 && report.attemptNumber >= 2) {
    console.log(`   ⚠️  Score too low after ${report.attemptNumber} attempts. Stopping.`);
    return false;
  }
  
  return true;
}

/**
 * Generate human-readable improvement summary for logs
 */
export function getImprovementSummary(constraints: ReplyConstraints): string {
  const items: string[] = [];
  
  if (constraints.mustIncludeQuestion) {
    items.push(`Add question: "${constraints.mustIncludeQuestion}"`);
  }
  
  if (constraints.mustReferencePhrases && constraints.mustReferencePhrases.length > 0) {
    items.push(`Reference phrases: ${constraints.mustReferencePhrases.join(', ')}`);
  }
  
  if (constraints.emphasizeCreatorTopics && constraints.emphasizeCreatorTopics.length > 0) {
    items.push(`Connect to creator topics: ${constraints.emphasizeCreatorTopics.join(', ')}`);
  }
  
  if (constraints.mustHaveFeature && constraints.mustHaveFeature.length > 0) {
    items.push(`Must include: ${constraints.mustHaveFeature.join(', ')}`);
  }
  
  if (constraints.mustUseTone) {
    items.push(`Use ${constraints.mustUseTone} tone`);
  }
  
  if (constraints.avoidGenericPhrases) {
    items.push('Avoid generic phrases');
  }
  
  return items.join(' | ');
}

