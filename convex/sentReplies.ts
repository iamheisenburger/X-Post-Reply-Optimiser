import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Mark a reply as sent
 * This saves the reply to the database and updates daily stats
 */
export const markAsSent = mutation({
  args: {
    content: v.string(),
    strategy: v.string(),
    algorithmScore: v.number(),
    scoreBreakdown: v.object({
      engagement: v.number(),
      recency: v.number(),
      mediaPresence: v.number(),
      conversationDepth: v.number(),
      authorReputation: v.number(),
    }),
    tweetUrl: v.string(),
    tweetAuthor: v.string(),
    tweetContent: v.string(),
    targetUsername: v.string(),
    targetTweetId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const today = new Date(now).toISOString().split('T')[0]; // YYYY-MM-DD

    // 1. Create the post record
    const postId = await ctx.db.insert("posts", {
      content: args.content,
      type: "reply",
      targetUsername: args.targetUsername,
      targetTweetId: args.targetTweetId,
      algorithmScore: args.algorithmScore,
      scoreBreakdown: args.scoreBreakdown,
      status: "posted",
      postedAt: now,
      strategy: args.strategy,
      tweetUrl: args.tweetUrl,
      tweetAuthor: args.tweetAuthor,
      tweetContent: args.tweetContent,
      generatedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    // 2. Update daily stats
    const existingStats = await ctx.db
      .query("dailyStats")
      .withIndex("by_date", (q) => q.eq("date", today))
      .first();

    if (existingStats) {
      // Update existing stats
      const creators = [...existingStats.creators];
      const creatorIndex = creators.findIndex(c => c.username === args.targetUsername);

      if (creatorIndex >= 0) {
        creators[creatorIndex].count += 1;
      } else {
        creators.push({ username: args.targetUsername, count: 1 });
      }

      // Recalculate average score
      const newRepliesSent = existingStats.repliesSent + 1;
      const newAvgScore = Math.round(
        ((existingStats.avgScore * existingStats.repliesSent) + args.algorithmScore) / newRepliesSent
      );

      await ctx.db.patch(existingStats._id, {
        repliesSent: newRepliesSent,
        avgScore: newAvgScore,
        creators,
        updatedAt: now,
      });
    } else {
      // Create new stats for today
      await ctx.db.insert("dailyStats", {
        date: today,
        repliesSent: 1,
        repliesGenerated: 0, // Will be updated when replies are generated
        avgScore: args.algorithmScore,
        topStrategy: args.strategy,
        creators: [{ username: args.targetUsername, count: 1 }],
        createdAt: now,
        updatedAt: now,
      });
    }

    return postId;
  },
});

/**
 * Get sent replies for a specific date
 */
export const getSentRepliesByDate = query({
  args: {
    date: v.string(), // YYYY-MM-DD
  },
  handler: async (ctx, args) => {
    // Parse date as UTC to avoid timezone bugs
    const [year, month, day] = args.date.split('-').map(Number);
    const startOfDay = Date.UTC(year, month - 1, day, 0, 0, 0);
    const endOfDay = Date.UTC(year, month - 1, day, 23, 59, 59, 999);

    const replies = await ctx.db
      .query("posts")
      .withIndex("by_posted_date")
      .filter((q) =>
        q.and(
          q.gte(q.field("postedAt"), startOfDay),
          q.lte(q.field("postedAt"), endOfDay),
          q.eq(q.field("status"), "posted")
        )
      )
      .order("desc")
      .collect();

    return replies;
  },
});

/**
 * Get today's sent replies
 */
export const getTodaySentReplies = query({
  handler: async (ctx) => {
    const todayUTC = new Date();
    const [year, month, day] = [todayUTC.getUTCFullYear(), todayUTC.getUTCMonth(), todayUTC.getUTCDate()];
    const startOfDay = Date.UTC(year, month, day, 0, 0, 0);
    const endOfDay = Date.UTC(year, month, day, 23, 59, 59, 999);

    const replies = await ctx.db
      .query("posts")
      .withIndex("by_posted_date")
      .filter((q) =>
        q.and(
          q.gte(q.field("postedAt"), startOfDay),
          q.lte(q.field("postedAt"), endOfDay),
          q.eq(q.field("status"), "posted")
        )
      )
      .order("desc")
      .collect();

    return replies;
  },
});

/**
 * Get daily stats for a date range
 */
export const getDailyStatsRange = query({
  args: {
    startDate: v.string(), // YYYY-MM-DD
    endDate: v.string(), // YYYY-MM-DD
  },
  handler: async (ctx, args) => {
    const stats = await ctx.db
      .query("dailyStats")
      .withIndex("by_date")
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), args.startDate),
          q.lte(q.field("date"), args.endDate)
        )
      )
      .collect();

    return stats;
  },
});

/**
 * Get today's stats
 */
export const getTodayStats = query({
  handler: async (ctx) => {
    const today = new Date().toISOString().split('T')[0];

    const stats = await ctx.db
      .query("dailyStats")
      .withIndex("by_date", (q) => q.eq("date", today))
      .first();

    return stats || {
      date: today,
      repliesSent: 0,
      repliesGenerated: 0,
      avgScore: 0,
      topStrategy: undefined,
      creators: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  },
});

/**
 * Delete a sent reply and update daily stats
 */
export const deleteReply = mutation({
  args: {
    id: v.id("posts"),
  },
  handler: async (ctx, args) => {
    // Get the reply first to extract info for stats update
    const reply = await ctx.db.get(args.id);

    if (!reply || !reply.postedAt) {
      throw new Error("Reply not found or not posted");
    }

    const replyDate = new Date(reply.postedAt).toISOString().split('T')[0];

    // Delete the reply
    await ctx.db.delete(args.id);

    // Update daily stats
    const stats = await ctx.db
      .query("dailyStats")
      .withIndex("by_date", (q) => q.eq("date", replyDate))
      .first();

    if (stats) {
      // Get all remaining replies for this date to recalculate stats
      // Parse date as UTC to avoid timezone bugs
      const [year, month, day] = replyDate.split('-').map(Number);
      const startOfDay = Date.UTC(year, month - 1, day, 0, 0, 0);
      const endOfDay = Date.UTC(year, month - 1, day, 23, 59, 59, 999);

      const remainingReplies = await ctx.db
        .query("posts")
        .withIndex("by_posted_date")
        .filter((q) =>
          q.and(
            q.gte(q.field("postedAt"), startOfDay),
            q.lte(q.field("postedAt"), endOfDay),
            q.eq(q.field("status"), "posted")
          )
        )
        .collect();

      if (remainingReplies.length === 0) {
        // No more replies for this date, delete the stats
        await ctx.db.delete(stats._id);
      } else {
        // Recalculate stats
        const newAvgScore = Math.round(
          remainingReplies.reduce((sum, r) => sum + r.algorithmScore, 0) / remainingReplies.length
        );

        // Recalculate creators
        const creatorCounts = new Map<string, number>();
        remainingReplies.forEach(r => {
          if (r.targetUsername) {
            creatorCounts.set(
              r.targetUsername,
              (creatorCounts.get(r.targetUsername) || 0) + 1
            );
          }
        });

        const newCreators = Array.from(creatorCounts.entries()).map(([username, count]) => ({
          username,
          count,
        }));

        await ctx.db.patch(stats._id, {
          repliesSent: remainingReplies.length,
          avgScore: newAvgScore,
          creators: newCreators,
          updatedAt: Date.now(),
        });
      }
    }

    return { success: true };
  },
});
