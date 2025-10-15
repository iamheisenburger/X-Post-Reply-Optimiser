/**
 * POST QUALITY VALIDATOR
 * 
 * Applies same rigorous quality checks as reply system to post generation
 * - Specificity validation (no generic AI slop)
 * - Authenticity checks (no fake expertise)
 * - Quality scoring
 * - Iteration feedback
 */

export interface PostQualityReport {
  passed: boolean;
  score: number;
  issues: string[];
  improvements: {
    needsMoreSpecificity?: boolean;
    needsMoreData?: boolean;
    tooGeneric?: boolean;
    tooSalesy?: boolean;
    notAuthentic?: boolean;
  };
}

const GENERIC_PHRASES = [
  "game changer",
  "unlock your potential",
  "take your business to the next level",
  "level up",
  "crushing it",
  "here's the thing",
  "let me tell you",
  "trust me",
  "follow for more",
  "if you found this valuable",
  "drop a like",
];

const FAKE_EXPERTISE_PATTERNS = [
  /made \$[\d,]+k/i,
  /scaled to [\d,]+ users/i,
  /10x'd my business/i,
  /went from 0 to [\d,]+/i, // Unless it's YOUR specific journey
];

/**
 * Validate post quality - catches generic AI slop
 */
export function validatePostQuality(
  post: string,
  category: string,
  allowedClaims: string[]
): PostQualityReport {
  const issues: string[] = [];
  const improvements: PostQualityReport['improvements'] = {};
  let score = 100;

  // Check for generic phrases
  const lowerPost = post.toLowerCase();
  const genericFound = GENERIC_PHRASES.filter(phrase => 
    lowerPost.includes(phrase.toLowerCase())
  );
  
  if (genericFound.length > 0) {
    issues.push(`Generic phrases detected: ${genericFound.join(', ')}`);
    improvements.tooGeneric = true;
    score -= 30;
  }

  // Check for fake expertise (claims you can't back up)
  for (const pattern of FAKE_EXPERTISE_PATTERNS) {
    if (pattern.test(post)) {
      const match = post.match(pattern);
      if (match && !allowedClaims.some(claim => match[0].includes(claim))) {
        issues.push(`Unverified claim: "${match[0]}" - you can't claim this yet`);
        improvements.notAuthentic = true;
        score -= 40;
      }
    }
  }

  // Check for specificity (needs numbers/data)
  const hasNumbers = /\d+/.test(post);
  const hasPercentage = /%/.test(post);
  const hasMetric = /(followers|users|days|hours|minutes|week|month)/i.test(post);
  
  if (!hasNumbers && category !== 'philosophy') {
    issues.push('Missing specific data/numbers');
    improvements.needsMoreData = true;
    score -= 20;
  }

  // Check length (too short = low value)
  if (post.length < 50) {
    issues.push('Too short - needs more substance');
    improvements.needsMoreSpecificity = true;
    score -= 15;
  }

  // Check for salesy language
  const salesyPhrases = ['buy now', 'limited time', 'dm me', 'link in bio', 'check out my'];
  const salesyFound = salesyPhrases.filter(phrase => lowerPost.includes(phrase));
  
  if (salesyFound.length > 0) {
    issues.push(`Too salesy: ${salesyFound.join(', ')}`);
    improvements.tooSalesy = true;
    score -= 25;
  }

  // Check for first-person (authenticity)
  const hasFirstPerson = /\b(I|my|me|I'm)\b/i.test(post);
  if (!hasFirstPerson && category !== 'philosophy') {
    issues.push('Missing first-person perspective - feels impersonal');
    improvements.notAuthentic = true;
    score -= 15;
  }

  const passed = score >= 70;

  return {
    passed,
    score: Math.max(0, score),
    issues,
    improvements,
  };
}

/**
 * Generate improvement instructions for Claude
 */
export function getImprovementInstructions(report: PostQualityReport): string {
  const instructions: string[] = [];

  if (report.improvements.tooGeneric) {
    instructions.push('❌ REMOVE generic phrases like "game changer", "level up", "here\'s the thing"');
    instructions.push('✅ USE specific, concrete language');
  }

  if (report.improvements.needsMoreData) {
    instructions.push('❌ MISSING numbers and data');
    instructions.push('✅ ADD specific metrics: "7 followers", "0 users", "Day 6"');
  }

  if (report.improvements.needsMoreSpecificity) {
    instructions.push('❌ TOO VAGUE');
    instructions.push('✅ BE SPECIFIC: What exactly happened? What did you learn?');
  }

  if (report.improvements.tooSalesy) {
    instructions.push('❌ TOO SALESY - this is not an ad');
    instructions.push('✅ SHARE VALUE: Teach, don\'t sell');
  }

  if (report.improvements.notAuthentic) {
    instructions.push('❌ NOT AUTHENTIC - don\'t claim fake achievements');
    instructions.push('✅ ONLY CLAIM WHAT YOU CAN VERIFY: Real numbers, real experiences');
  }

  return instructions.join('\n');
}

/**
 * Validate entire post batch
 */
export function validatePostBatch(
  posts: Array<{ content: string; category: string }>,
  allowedClaims: string[]
): {
  allPassed: boolean;
  reports: PostQualityReport[];
  averageScore: number;
} {
  const reports = posts.map(post => 
    validatePostQuality(post.content, post.category, allowedClaims)
  );

  const allPassed = reports.every(r => r.passed);
  const averageScore = Math.round(
    reports.reduce((sum, r) => sum + r.score, 0) / reports.length
  );

  return {
    allPassed,
    reports,
    averageScore,
  };
}

