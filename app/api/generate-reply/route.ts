import { NextRequest, NextResponse } from "next/server";
import { twitterApi } from "@/lib/twitter-api";
import { buildCreatorIntelligence, extractTweetId } from "@/lib/ai-reply-system/creator-intelligence";
import { generateOptimizedReplies } from "@/lib/ai-reply-system/reply-generator";
import { generateOptimizedRepliesWithClaude } from "@/lib/ai-reply-system/claude-reply-generator";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function POST(request: NextRequest) {
  try {
    const { tweetUrl } = await request.json();

    if (!tweetUrl) {
      return NextResponse.json(
        { error: "Tweet URL is required" },
        { status: 400 }
      );
    }

    // 1. Extract tweet ID from URL
    const tweetId = extractTweetId(tweetUrl);
    console.log(`🎯 Extracted tweet ID: ${tweetId}`);

    // 2. Fetch tweet data
    if (!process.env.TWITTER_API_KEY) {
      return NextResponse.json(
        { error: "TWITTER_API_KEY is not configured in environment variables." },
        { status: 500 }
      );
    }
    
    const tweet = await twitterApi.getTweet(tweetId);
    if (!tweet) {
      return NextResponse.json(
        { 
          error: "Could not fetch tweet. Check your TWITTER_API_KEY and tweet URL."
        },
        { status: 404 }
      );
    }

    console.log(`✅ Fetched tweet from @${tweet.author.username}`);

    // 3. Build creator intelligence - CHECK DATABASE FIRST!
    let creatorIntelligence;
    let profileSource: 'cached' | 'analyzed' = 'analyzed';
    try {
      const cachedProfile = await fetchQuery(api.creators.getByUsername, { 
        username: tweet.author.username 
      });

      if (cachedProfile) {
        console.log(`✅ Using pre-analyzed profile from database!`);
        profileSource = 'cached';
        
        // Transform cached profile to CreatorIntelligence format
        creatorIntelligence = {
          username: cachedProfile.username,
          displayName: cachedProfile.displayName,
          followerCount: cachedProfile.followerCount,
          verified: cachedProfile.verified,
          primaryNiche: cachedProfile.primaryNiche as "saas" | "mma" | "tech" | "finance" | "mindset" | "other",
          secondaryNiches: cachedProfile.secondaryNiches,
          metrics: {
            followers: cachedProfile.followerCount,
            engagementRate: 0.03,
          },
          audience: {
            demographics: {
              primaryInterests: cachedProfile.audiencePrimaryInterests,
              languageStyle: cachedProfile.audienceLanguageStyle,
              sophisticationLevel: cachedProfile.audienceSophisticationLevel,
              irrelevantTopics: cachedProfile.audienceIrrelevantTopics,
            },
            engagementPatterns: {
              respondsTo: cachedProfile.respondsTo,
              ignores: cachedProfile.ignores,
              preferredTone: cachedProfile.preferredTone,
            },
          },
          contentPatterns: {
            topics: [],
            postTypes: { insights: 0, questions: 0, announcements: 0, personal: 0 },
            toneProfile: { serious: 0, humorous: 0, technical: 0, philosophical: 0 },
          },
          crossoverPotential: {
            mmaRelevance: cachedProfile.mmaRelevance as 0 | 1 | 2 | 3 | 4 | 5,
            saasRelevance: cachedProfile.saasRelevance as 0 | 1 | 2 | 3 | 4 | 5,
            disciplineTopics: cachedProfile.disciplineTopics as 0 | 1 | 2 | 3 | 4 | 5,
            philosophyTopics: cachedProfile.philosophyTopics as 0 | 1 | 2 | 3 | 4 | 5,
          },
          optimalReplyStrategy: {
            mode: cachedProfile.optimalMode as "pure_saas" | "pure_mma" | "mindset_crossover" | "technical" | "storytelling",
            avoidTopics: cachedProfile.avoidTopics,
            emphasizeTopics: cachedProfile.emphasizeTopics,
            toneMatch: cachedProfile.toneMatch,
            questionStyle: cachedProfile.questionStyle,
          },
          lastUpdated: cachedProfile.lastUpdated,
          tweetAnalysisCount: cachedProfile.tweetAnalysisCount,
        };
      } else {
        console.log(`⚠️ Profile not in database. Add @${tweet.author.username} to Profiles page for better results.`);
        
        creatorIntelligence = await buildCreatorIntelligence(
          tweet.author.username,
          {
            id: tweet.author.id,
            name: tweet.author.name,
            description: tweet.author.description,
            followers_count: tweet.author.followers_count,
            following_count: tweet.author.following_count,
            verified: tweet.author.verified || false,
          },
          tweet.text
        );
      }
    } catch (error) {
      console.error("Error building creator intelligence:", error);
      return NextResponse.json(
        { error: "Failed to analyze creator profile. Check your OPENAI_API_KEY." },
        { status: 500 }
      );
    }

    console.log(`🧠 Built intelligence: ${creatorIntelligence.primaryNiche} niche, ${creatorIntelligence.optimalReplyStrategy.mode} mode`);

    // 4. Calculate time since tweet posted (for recency boost)
    const tweetDate = new Date(tweet.created_at);
    const now = new Date();
    const minutesSincePosted = Math.floor((now.getTime() - tweetDate.getTime()) / (1000 * 60));

    console.log(`⏱️  Tweet posted ${minutesSincePosted} minutes ago ${minutesSincePosted <= 5 ? '(RECENCY BOOST!)' : ''}`);

    // 5. Generate algorithm-optimized replies with Claude + Specificity Validation
    // Use Claude if API key is available, otherwise fall back to OpenAI
    const useClaude = !!process.env.ANTHROPIC_API_KEY;

    console.log(`🤖 Using ${useClaude ? 'CLAUDE (recommended)' : 'OpenAI (fallback)'} for generation`);

    const result = useClaude
      ? await generateOptimizedRepliesWithClaude({
          tweetText: tweet.text,
          tweetAuthor: tweet.author.username,
          creatorProfile: creatorIntelligence,
          minutesSincePosted,
          yourHandle: process.env.NEXT_PUBLIC_X_HANDLE || "madmanhakim",
        })
      : await generateOptimizedReplies({
          tweetText: tweet.text,
          tweetAuthor: tweet.author.username,
          creatorProfile: creatorIntelligence,
          minutesSincePosted,
          yourHandle: process.env.NEXT_PUBLIC_X_HANDLE || "madmanhakim",
        });

    console.log(`✨ Generated ${result.replies.length} algorithm-optimized replies`);
    console.log(`📊 Quality: ${result.qualityReport.passed ? 'PASSED' : 'ISSUES'}`);
    console.log(`📊 Attempts: ${result.totalAttempts}`);
    console.log(`📊 Best score: ${result.qualityReport.bestScore}/100`);

    // Log specificity only for Claude (has specificityReport property)
    if (useClaude && 'specificityReport' in result) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const specReport = (result as any).specificityReport;
      if (specReport) {
        console.log(`📊 Specificity: ${specReport.passed ? 'PASSED' : specReport.score + '/100'}`);
      }
    }

    // 6. Transform for frontend
    const classifyMode = (text: string, f: { hasQuestion: boolean; hasPushback: boolean; hasSpecificData: boolean; }) => {
      if (f.hasPushback) return "contrarian";
      if (f.hasQuestion) return "question";
      if (/\b(I agree|good point|so true|exactly)\b/i.test(text)) return "agreement";
      return "add_value";
    };

    const transformedReplies = result.replies.map((reply, idx) => {
      const p = reply.prediction;
      
      // Show probability/likelihood scores (0-100) for each signal - these are interpretable
      // CRITICAL: Guard all calculations to prevent NaN/undefined breaking frontend .toFixed()
      const authorReplyChance = Math.round((p.authorReplyProb || 0) * 100); // Direct probability (0-100%)
      const conversationLikelihood = Math.min(100, Math.round(((p.repliesExpected || 0) / 10) * 100)); // Normalized expected replies
      const profileClickChance = Math.min(100, Math.round(((p.profileClicksExpected || 0) / 10) * 100)); // Normalized expected clicks
      const recencyBoost = minutesSincePosted <= 5 ? 100 : Math.max(0, Math.round((1 - (minutesSincePosted || 0) / 60) * 100));
      
      // Overall score: weighted combination emphasizing author reply (most valuable per X algorithm)
      const overallScore = Math.max(1, Math.min(100, Math.round(
        authorReplyChance * 0.50 +       // Author response is KING (75x in X algorithm)
        conversationLikelihood * 0.30 +  // Conversation starter (13.5x)
        profileClickChance * 0.15 +      // Profile visit (5x, leads to follows)
        recencyBoost * 0.05              // Recency bonus (2.5x within 5min)
      )));

      return {
        text: reply.text,
        score: Number(overallScore) || 0,
        breakdown: {
          engagement: Number(authorReplyChance) || 0,        // Likelihood author responds (0-100%)
          recency: Number(recencyBoost) || 0,                // Recency advantage (0-100)
          mediaPresence: 0,                                  // Reserved for future media detection
          conversationDepth: Number(conversationLikelihood) || 0, // Likelihood of sparking replies (0-100)
          authorReputation: Number(profileClickChance) || 0, // Likelihood of profile click (0-100)
        },
        mode: classifyMode(reply.text, reply.features),
        iteration: idx + 1,
        reasoning: [reply.reasoning],
        features: {
          hasQuestion: reply.features.hasQuestion,
          hasPushback: reply.features.hasPushback,
          hasData: reply.features.hasSpecificData,
          authorReplyProb: authorReplyChance,
        },
      };
    });

    const averageScore = Math.round(
      transformedReplies.reduce((sum, r) => sum + r.score, 0) / transformedReplies.length
    );

    // 7. Return results
    return NextResponse.json({
      replies: transformedReplies,
      selectedMode: "algorithm_optimized",
      creatorProfile: {
        username: creatorIntelligence.username,
        displayName: creatorIntelligence.displayName,
        primaryNiche: creatorIntelligence.primaryNiche,
        mmaRelevance: creatorIntelligence.crossoverPotential.mmaRelevance,
        saasRelevance: creatorIntelligence.crossoverPotential.saasRelevance,
        replyMode: creatorIntelligence.optimalReplyStrategy.mode,
        preferredTone: creatorIntelligence.audience.engagementPatterns.preferredTone,
        profileSource: profileSource,
      },
      totalIterations: result.totalAttempts,
      averageScore: averageScore,
      qualityReport: {
        passed: result.qualityReport.passed,
        bestScore: result.qualityReport.bestScore,
        issues: result.qualityReport.issues,
        attemptNumber: result.qualityReport.attemptNumber,
      },
      algorithmInsights: {
        authorReplyWeight: "75x (TARGET THIS!)",
        conversationWeight: "13.5x",
        likeWeight: "1x",
        recencyBoost: minutesSincePosted <= 5 ? "ACTIVE ⚡" : "DECAYING 📉",
        tweetAge: `${minutesSincePosted} min`,
      },
    });

  } catch (error) {
    console.error("Error in generate-reply API:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: errorMessage, stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined },
      { status: 500 }
    );
  }
}
