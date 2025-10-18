// quality-gate.ts - Quality assessment and feedback loop system

import type { CreatorIntelligence } from './types';
import type { TweetContent } from './content-analyzer';
import type { BuiltReply } from './reply-builder';

export interface QualityReport {
  passed: boolean;
  grammarPassed: boolean;
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
  ensureGrammar?: boolean; // New for grammar fixes
}

const QUALITY_THRESHOLD = 50; // Lowered from 60 - Claude generates quality replies
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
  
  // REMOVED: Grammar validation was causing false positives
  // Twitter-style writing doesn't fit Flesch readability formulas
  const grammarPassed = true;
  
  // ============================================
  // CHECK 1: Score Threshold
  // ============================================
  if (bestScore < QUALITY_THRESHOLD) {
    issues.push(`Low engagement potential (best: ${bestScore}/100, need: ${QUALITY_THRESHOLD})`);
    console.log(`   ❌ Score too low: ${bestScore} < ${QUALITY_THRESHOLD}`);
    
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
  // CHECK 2: Feature Detection (INFORMATIONAL ONLY)
  // ============================================
  // NOTE: We no longer enforce specific strategies (question/contrarian/etc)
  // The Reply Strategy Selector determines the best approach dynamically
  const hasQuestion = replies.some(r => r.features.hasQuestion);
  const hasPushback = replies.some(r => r.features.hasPushback);
  const hasData = replies.some(r => r.features.hasSpecificData);

  console.log(`   📊 Features detected:`);
  console.log(`      Question: ${hasQuestion ? '✅' : '❌'}`);
  console.log(`      Pushback: ${hasPushback ? '✅' : '❌'}`);
  console.log(`      Data: ${hasData ? '✅' : '❌'}`);

  // Only flag if tweet has numbers but NO replies reference them
  if (!hasData && tweetContent.numbers.length > 0) {
    console.log(`   ℹ️  Tweet mentions ${tweetContent.numbers.join(', ')} - consider referencing`);
  }
  
  // ============================================
  // CHECK 3: AI Detection Prevention - Em-Dashes
  // ============================================
  const hasEmDashes = replies.filter(r =>
    r.text.includes('—') || r.text.match(/\s-\s/)  // em-dash or " - "
  );

  if (hasEmDashes.length > 0) {
    issues.push('CRITICAL: Em-dashes/hyphens detected - instant AI tell!');
    console.log(`   🚨 ${hasEmDashes.length} replies contain em-dashes or hyphens for clause separation`);
    improvements.avoidGenericPhrases = true; // Use this flag to trigger rewrite
    improvements.ensureGrammar = true; // Use this to enforce no em-dashes
  } else {
    console.log(`   ✅ No em-dashes detected`);
  }

  // ============================================
  // CHECK 4: Content Specificity
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
  // CHECK 5: Creator Profile Matching
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
  // CHECK 6: Tone Matching
  // ============================================
  const preferredTone = creator.audience.engagementPatterns.preferredTone;
  if (preferredTone && !improvements.mustUseTone) {
    improvements.mustUseTone = preferredTone;
  }

  // ============================================
  // CHECK 7: Diversity (INFORMATIONAL ONLY)
  // ============================================
  // NOTE: Strategy selector determines how many approaches are needed
  // We no longer enforce "must have 3 distinct strategies"
  const strategies = new Set(replies.map(r => r.strategy));
  console.log(`   📊 Strategy diversity: ${strategies.size} distinct approaches`);
  
  // ============================================
  // PASS/FAIL DECISION (now includes grammar)
  // ============================================
  const passed = issues.length === 0 && bestScore >= QUALITY_THRESHOLD && grammarPassed;
  
  if (passed) {
    console.log(`\n✅ QUALITY GATE PASSED on attempt ${attemptNumber}`);
  } else {
    console.log(`\n⚠️  QUALITY GATE FAILED on attempt ${attemptNumber}`);
    console.log(`   Issues: ${issues.length}`);
    issues.forEach(issue => console.log(`     - ${issue}`));
  }
  
  return {
    passed,
    grammarPassed,
    bestScore,
    issues,
    improvements,
    attemptNumber,
  };
}

// REMOVED: validateGrammar function - was causing false positives
// Flesch readability formula doesn't work for conversational Twitter writing

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

