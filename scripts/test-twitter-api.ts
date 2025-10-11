#!/usr/bin/env tsx
// Diagnostic script to test TwitterAPI.io integration
// Run: npx tsx scripts/test-twitter-api.ts

import { twitterApi } from "../lib/twitter-api";

async function testTwitterAPI() {
  console.log("=".repeat(80));
  console.log("🧪 TWITTER API DIAGNOSTIC TEST");
  console.log("=".repeat(80));
  console.log();

  // Check environment variables
  console.log("📋 ENVIRONMENT CHECK:");
  console.log(`   TWITTER_API_KEY: ${process.env.TWITTER_API_KEY ? "✅ Set" : "❌ NOT SET"}`);
  console.log(`   TWITTER_API_BASE_URL: ${process.env.TWITTER_API_BASE_URL || "https://api.twitterapi.io (default)"}`);
  console.log();

  if (!process.env.TWITTER_API_KEY) {
    console.error("❌ TWITTER_API_KEY is not set!");
    console.error("   Set it in .env.local or run: export TWITTER_API_KEY=your_key_here");
    process.exit(1);
  }

  // Test accounts - using well-known, definitely NOT suspended accounts
  const testAccounts = [
    { username: "elonmusk", description: "Elon Musk - Tech billionaire" },
    { username: "naval", description: "Naval Ravikant - AngelList founder" },
    { username: "levelsio", description: "Pieter Levels - Indie hacker" },
  ];

  console.log("🎯 TEST ACCOUNTS:");
  testAccounts.forEach(acc => console.log(`   • @${acc.username} - ${acc.description}`));
  console.log();

  let successCount = 0;
  let failCount = 0;

  // Test each account
  for (const account of testAccounts) {
    console.log("=".repeat(80));
    console.log(`\n🧪 TESTING @${account.username}`);
    console.log("=".repeat(80));

    try {
      // Step 1: Fetch user profile
      console.log("\n📍 STEP 1: Fetch User Profile");
      console.log("-".repeat(60));
      
      const user = await twitterApi.getUser(account.username);
      
      if (!user) {
        console.error(`❌ FAILED: Could not fetch user @${account.username}`);
        failCount++;
        continue;
      }

      console.log(`\n✅ User fetched successfully:`);
      console.log(`   Username: @${user.username}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   User ID: ${user.id}`);
      console.log(`   Followers: ${user.followers_count.toLocaleString()}`);
      console.log(`   Bio: ${user.description.substring(0, 100)}${user.description.length > 100 ? "..." : ""}`);

      // Step 2: Fetch user's tweets
      console.log("\n📍 STEP 2: Fetch User's Last 10 Tweets");
      console.log("-".repeat(60));
      
      const tweets = await twitterApi.getUserTweets(user.id, 10);
      
      if (tweets.length === 0) {
        console.error(`❌ FAILED: No tweets returned for @${account.username}`);
        console.error(`   This is the CRITICAL BUG - API returns empty array for working accounts`);
        failCount++;
        continue;
      }

      console.log(`\n✅ Fetched ${tweets.length} tweets:`);
      tweets.forEach((tweet, idx) => {
        console.log(`   ${idx + 1}. "${tweet.text.substring(0, 80)}${tweet.text.length > 80 ? "..." : ""}"`);
      });

      // Step 3: Test getTweet with the first tweet
      if (tweets.length > 0) {
        console.log("\n📍 STEP 3: Fetch Single Tweet");
        console.log("-".repeat(60));
        
        const tweetId = tweets[0].id;
        const detailedTweet = await twitterApi.getTweet(tweetId);
        
        if (!detailedTweet) {
          console.error(`❌ FAILED: Could not fetch tweet ${tweetId}`);
          failCount++;
          continue;
        }

        console.log(`\n✅ Tweet fetched successfully:`);
        console.log(`   Tweet ID: ${detailedTweet.id}`);
        console.log(`   Author: @${detailedTweet.author.username}`);
        console.log(`   Text: "${detailedTweet.text.substring(0, 100)}..."`);
        console.log(`   Created: ${detailedTweet.created_at}`);
      }

      successCount++;
      console.log(`\n✅ ALL TESTS PASSED FOR @${account.username}`);

    } catch (error) {
      console.error(`\n💥 EXCEPTION testing @${account.username}:`, error);
      if (error instanceof Error) {
        console.error(`   ${error.message}`);
      }
      failCount++;
    }

    console.log();
  }

  // Final summary
  console.log("=".repeat(80));
  console.log("\n📊 FINAL RESULTS");
  console.log("=".repeat(80));
  console.log(`   ✅ Successful: ${successCount}/${testAccounts.length}`);
  console.log(`   ❌ Failed: ${failCount}/${testAccounts.length}`);
  console.log();

  if (successCount === testAccounts.length) {
    console.log("🎉 ALL TESTS PASSED! Twitter API integration is working correctly.");
    process.exit(0);
  } else {
    console.log("❌ SOME TESTS FAILED! Check the logs above for details.");
    console.log();
    console.log("🔍 TROUBLESHOOTING:");
    console.log("   1. Verify your TWITTER_API_KEY is valid");
    console.log("   2. Check TwitterAPI.io dashboard for API usage/errors");
    console.log("   3. Review the detailed logs above to see exact API responses");
    console.log("   4. If API is returning unexpected formats, update lib/twitter-api.ts parsing logic");
    process.exit(1);
  }
}

// Run the test
testTwitterAPI().catch((error) => {
  console.error("💥 FATAL ERROR:", error);
  process.exit(1);
});

