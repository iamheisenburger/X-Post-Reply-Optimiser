// Specificity Validator - Ensures replies have concrete details
// This prevents generic "I've found" replies and enforces specific numbers, timeframes, scenarios

export interface SpecificityCheck {
  passed: boolean;
  score: number;
  issues: string[];
  suggestions: string[];
  concreteElementsFound: {
    hasNumbers: boolean;
    hasTimeframe: boolean;
    hasSpecificScenario: boolean;
    hasConcreteVerbs: boolean;
  };
}

/**
 * Validates that a reply contains concrete, specific details.
 * 
 * REQUIREMENTS for passing:
 * - No vague phrases ("I've found", "in my experience" without specifics)
 * - At least 2 concrete elements (numbers, timeframes, scenarios, action verbs)
 * - Score >= 70
 * 
 * @param reply - The generated reply text to validate
 * @returns SpecificityCheck with pass/fail, score, and detailed feedback
 */
export function validateSpecificity(reply: string): SpecificityCheck {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 50; // Start neutral
  
  // === CHECK 1: Detect vague phrases (CRITICAL) ===
  const vaguePatterns = [
    { 
      pattern: /\b(i've found|i have found)\b(?!\s+(that\s+)?(\d+|at|when|specifically))/i,
      message: "Too vague: 'I've found' without specifics",
      fix: "Say WHEN, WHERE, and WHAT you found (e.g., 'At 5K MRR, I found...')"
    },
    { 
      pattern: /\bin my experience\b(?!\s+(at|when|with|building))/i,
      message: "Too generic: 'in my experience' without context",
      fix: "Share SPECIFIC experience (e.g., 'In building X, I discovered...')"
    },
    { 
      pattern: /\bi've noticed\b(?!\s+(that\s+)?(\d+|at|over|across))/i,
      message: "Too vague: 'I've noticed' without data",
      fix: "What did you notice? When? With what sample size?"
    },
    { 
      pattern: /\b(this|it|that)\s+(really\s+)?(works?|helps?|improves?)\b(?!\s+(by|to\s+\d+|for))/i,
      message: "Vague claim without evidence",
      fix: "By how much? Over what timeframe? What specific metric improved?"
    },
    {
      pattern: /\b(great|amazing|love|absolutely|totally)\s+(point|insights?|post|thread|thoughts?)\b/i,
      message: "Generic filler praise",
      fix: "Remove filler, jump straight to insight"
    }
  ];
  
  let vagueCount = 0;
  for (const { pattern, message, fix } of vaguePatterns) {
    if (pattern.test(reply)) {
      vagueCount++;
      const match = reply.match(pattern)?.[0];
      issues.push(`❌ ${message}: "${match}"`);
      suggestions.push(`   → ${fix}`);
      score -= 15; // Heavy penalty for vague language
    }
  }
  
  // === CHECK 2: Look for concrete elements ===
  
  // Detect if this is a QUESTION-based reply (honest curiosity strategy)
  const isQuestion = reply.trim().endsWith('?') || reply.includes('?');
  
  // 1. Numbers/Metrics (with context) - MORE GENEROUS for questions with ratios
  const hasRatios = /\b\d+%\s+(to|vs|versus|and)\s+\d+%/i.test(reply) || // "60% to 40%", "70% vs 30%"
                    /\b\d+\s+(to|vs|versus|and)\s+\d+/i.test(reply);   // "10 to 2", "5 vs 3"
  const hasMetrics = /\b\d+[KMB]?\s*(MRR|ARR|users?|followers?|%|x|times?|days?|weeks?|months?|customers?|revenue)\b/i.test(reply);
  const hasNumbers = hasRatios || hasMetrics;
  
  if (hasNumbers) {
    score += 20;
    if (hasRatios && isQuestion) {
      score += 10; // Bonus for ratio-based questions (honest strategy)
    }
  } else {
    issues.push(`❌ No specific numbers or metrics`);
    suggestions.push(`   → Add: "60% to 40%" or "10 to 2" or "at 5K MRR" or "3x improvement"`);
  }
  
  // 2. Timeframes
  const hasTimeframe = /\b(last|this|next|over|for|within|after|during)\s+(week|month|quarter|year|day|2-3\s+weeks?|30\s+days?|Q\d)\b/i.test(reply) ||
                       /\b(recently|yesterday|today|ago|in\s+\d{4})\b/i.test(reply) ||
                       /\b(Q[1-4]\s+\d{4})\b/i.test(reply);
  if (hasTimeframe) {
    score += 15;
  } else {
    issues.push(`❌ No specific timeframe mentioned`);
    suggestions.push(`   → Add: "last month" or "over 3 weeks" or "in Q4 2024"`);
  }
  
  // 3. Specific scenarios/contexts
  const hasSpecificScenario = /\b(at|when|building|launching|during|while)\s+(our|my|the)\s+\w+/i.test(reply) ||
                              /\b(at|when)\s+(we|I)\s+(built|launched|tested|implemented|discovered|analyzed)/i.test(reply) ||
                              /\bat\s+\d+[KM]?\s*(MRR|ARR|users?)\b/i.test(reply);
  if (hasSpecificScenario) {
    score += 20;
  } else {
    issues.push(`❌ No specific scenario or context`);
    suggestions.push(`   → Add: "At [Company]" or "When we built X" or "During our launch"`);
  }
  
  // 4. Concrete action verbs (not "helps", "works")
  const hasConcreteVerbs = /\b(tested|implemented|built|launched|discovered|analyzed|measured|tracked|reduced|increased|improved|scaled|deployed|shipped|optimized)\b/i.test(reply);
  if (hasConcreteVerbs) {
    score += 10;
  } else {
    suggestions.push(`   💡 Use concrete verbs: "tested", "implemented", "measured", "reduced"`);
  }
  
  // === CHECK 3: Calculate concrete score ===
  const concreteElementsFound = {
    hasNumbers,
    hasTimeframe,
    hasSpecificScenario,
    hasConcreteVerbs
  };
  
  const concreteCount = Object.values(concreteElementsFound).filter(Boolean).length;
  
  // Critical check: Need at least 2 concrete elements if there are vague phrases
  if (concreteCount < 2 && vagueCount > 0) {
    issues.push(`❌ CRITICAL: Only ${concreteCount}/4 concrete elements found, but ${vagueCount} vague phrases detected`);
    suggestions.push(`   → REQUIRED: At least 2 of [Numbers, Timeframe, Specific Scenario, Concrete Verbs]`);
    score -= 10; // Additional penalty
  }
  
  // Bonus for having 3+ concrete elements
  if (concreteCount >= 3) {
    score += 15;
  }
  
  // === PASS/FAIL LOGIC ===
  // HONEST QUESTIONS get special treatment:
  // - If it's a question with ratios + any other element (timeframe/scenario/verbs), that's specific enough
  // - Otherwise: no vague phrases OR at least 2 concrete elements + score >= 70
  
  const isQuestionWithRatios = isQuestion && hasRatios;
  const passed = isQuestionWithRatios 
    ? (concreteCount >= 2 && score >= 60) // More lenient for honest questions with ratios
    : (vagueCount === 0 || concreteCount >= 2) && score >= 70;
  
  if (passed) {
    suggestions.push(`✅ Reply has good specificity - ${concreteCount}/4 concrete elements`);
  }
  
  return {
    passed,
    score: Math.min(100, Math.max(0, score)),
    issues,
    suggestions,
    concreteElementsFound
  };
}

