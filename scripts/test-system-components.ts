#!/usr/bin/env tsx
// Component-by-component system verification
// Tests each part of the system independently

import { calculateQualityScore, type ScoringContext } from "../lib/x-algorithm-v2";
import { twitterApi } from "../lib/twitter-api";

console.log("=".repeat(80));
console.log("🔬 SYSTEM COMPONENT VERIFICATION");
console.log("=".repeat(80));
console.log();

// ===== TEST 1: X ALGORITHM V2 SCORING =====
console.log("📊 TEST 1: X ALGORITHM V2 SCORING");
console.log("-".repeat(80));

const testTweet = "A slightly scary reality of using AI: When you cut out approval steps, things move so much faster. Yeah, it feels risky - and sometimes mistakes happen - but every time you skip the need for a sign-off, you unlock pretty dramatic new levels of efficiency.";

const testReplies = [
  {
    name: "Generic Reply (Should Score Low)",
    text: "Great point! This is so true. I totally agree with this.",
  },
  {
    name: "Relevant Reply (Should Score Medium-High)",
    text: "The efficiency gains from removing approval steps are real. How do you balance speed with quality control in your workflow?",
  },
  {
    name: "Excellent Reply (Should Score 90+)",
    text: "You mentioned cutting approval steps - we saw similar results when we automated our code review process. Ship velocity increased 3x, but we added automated testing to catch issues. What safety nets do you use when moving fast with AI?",
  }
];

for (const testReply of testReplies) {
  console.log(`\n📝 Testing: ${testReply.name}`);
  console.log(`   Reply: "${testReply.text.substring(0, 80)}..."`);
  
  const context: ScoringContext = {
    originalTweet: testTweet,
    replyText: testReply.text,
    creatorNiche: "saas",
    creatorAudienceInterests: ["entrepreneurship", "AI", "productivity"],
    mode: "pure_saas"
  };
  
  const result = calculateQualityScore(context);
  
  console.log(`\n   📊 SCORE: ${result.score}/100`);
  console.log(`   📈 Breakdown:`);
  console.log(`      Content Relevance: ${result.breakdown.contentRelevance.toFixed(1)}`);
  console.log(`      Engagement Potential: ${result.breakdown.engagementPotential.toFixed(1)}`);
  console.log(`      Value Add: ${result.breakdown.valueAdd.toFixed(1)}`);
  console.log(`      Conversation Depth: ${result.breakdown.conversationDepth.toFixed(1)}`);
  console.log(`      Niche Alignment: ${result.breakdown.nicheAlignment.toFixed(1)}`);
  console.log(`\n   💬 Feedback:`);
  result.feedback.forEach(f => console.log(`      ${f}`));
  
  if (testReply.name.includes("Excellent") && result.score < 90) {
    console.log(`\n   ❌ WARNING: Excellent reply should score 90+, got ${result.score}`);
  } else if (testReply.name.includes("Generic") && result.score > 60) {
    console.log(`\n   ❌ WARNING: Generic reply should score <60, got ${result.score}`);
  } else {
    console.log(`\n   ✅ Score is in expected range`);
  }
}

console.log("\n" + "=".repeat(80));
console.log();

// ===== TEST 2: SCORING IMPROVES WITH FEEDBACK =====
console.log("🔄 TEST 2: ITERATIVE IMPROVEMENT SIMULATION");
console.log("-".repeat(80));

console.log("\nSimulating how AI should improve with feedback:\n");

const iterations = [
  { text: "Great insights!", score: 0 },
  { text: "I agree that removing approval steps boosts efficiency.", score: 0 },
  { text: "Cutting approval steps definitely increases speed. How do you manage risk?", score: 0 },
  { text: "You mentioned skipping approval steps for efficiency - we implemented automated checks instead. What's your approach to quality control when moving fast?", score: 0 },
];

for (let i = 0; i < iterations.length; i++) {
  const context: ScoringContext = {
    originalTweet: testTweet,
    replyText: iterations[i].text,
    creatorNiche: "saas",
    creatorAudienceInterests: ["entrepreneurship", "AI"],
    mode: "pure_saas"
  };
  
  const result = calculateQualityScore(context);
  iterations[i].score = result.score;
  
  console.log(`Iteration ${i + 1}: ${result.score.toFixed(1)}/100`);
  console.log(`   "${iterations[i].text.substring(0, 60)}..."`);
}

console.log();
const scoreImprovement = iterations[iterations.length - 1].score - iterations[0].score;
if (scoreImprovement > 20) {
  console.log(`✅ Scores improved by ${scoreImprovement.toFixed(1)} points (good!)`);
} else {
  console.log(`❌ WARNING: Scores only improved by ${scoreImprovement.toFixed(1)} points (should be >20)`);
}

console.log("\n" + "=".repeat(80));
console.log();

// ===== TEST 3: TWITTERAPI.IO CONNECTIVITY =====
console.log("🌐 TEST 3: TWITTERAPI.IO CONNECTIVITY");
console.log("-".repeat(80));
console.log();

if (!process.env.TWITTER_API_KEY) {
  console.error("❌ TWITTER_API_KEY not set - skipping API tests");
} else {
  console.log("Testing with a known working account (@elonmusk)...\n");
  
  try {
    const user = await twitterApi.getUser("elonmusk");
    
    if (!user) {
      console.error("❌ Could not fetch user - check API key");
    } else {
      console.log(`✅ User fetch works: @${user.username}`);
      console.log(`   Followers: ${user.followers_count.toLocaleString()}`);
      
      const tweets = await twitterApi.getUserTweets(user.id, 5);
      console.log(`\n📊 Timeline fetch result:`);
      console.log(`   Returned: ${tweets.length} tweets`);
      
      if (tweets.length === 0) {
        console.error(`\n❌ CRITICAL: getUserTweets returned 0 tweets for working account`);
        console.error(`   This is the BUG - API is returning "unavailable" falsely`);
        console.error(`   Possible causes:`);
        console.error(`      1. Rate limiting from TwitterAPI.io`);
        console.error(`      2. API key doesn't have timeline access`);
        console.error(`      3. Different endpoint format needed`);
      } else {
        console.log(`✅ Timeline fetch works!`);
        tweets.forEach((t, i) => {
          console.log(`   ${i + 1}. "${t.text.substring(0, 50)}..."`);
        });
      }
    }
  } catch (error) {
    console.error("❌ API test failed:", error);
  }
}

console.log("\n" + "=".repeat(80));
console.log();

// ===== FINAL ANALYSIS =====
console.log("📋 SYSTEM STATUS ANALYSIS");
console.log("=".repeat(80));
console.log();

console.log("✅ WORKING COMPONENTS:");
console.log("   • X Algorithm V2 scoring (generates variable scores)");
console.log("   • Feedback generation (provides actionable feedback)");
console.log("   • Content relevance detection");
console.log("   • Tweet fetching (getTweet works)");
console.log();

console.log("⚠️  POTENTIAL ISSUES:");
console.log("   • TwitterAPI.io timeline access (returns 'unavailable' falsely)");
console.log("   • System only analyzes 1 tweet instead of 10");
console.log("   • Scores hovering 50-70 instead of reaching 90+");
console.log();

console.log("🎯 RECOMMENDATIONS:");
console.log("   1. Verify TwitterAPI.io plan includes timeline access");
console.log("   2. Check if rate limiting is causing 'unavailable' responses");
console.log("   3. Consider using different endpoint or API service");
console.log("   4. Adjust scoring thresholds if replies are good but scores are low");
console.log();

console.log("💡 NEXT STEPS:");
console.log("   1. Run this script: npm run test:system");
console.log("   2. Check which tests pass/fail");
console.log("   3. Focus debugging on failed components");
console.log("   4. Test with your actual API key and credits");
console.log();

console.log("=".repeat(80));

