import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Save or update daily input (what happened today)
 */
export const saveDailyInput = mutation({
  args: {
    date: v.string(), // YYYY-MM-DD
    events: v.array(v.string()),
    insights: v.array(v.string()),
    struggles: v.array(v.string()),
    futurePlans: v.optional(v.array(v.string())),
    metrics: v.object({
      followers: v.number(),
      subwiseUsers: v.number(),
      subwiseMRR: v.optional(v.number()),
      trainingMinutes: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if input already exists for this date
    const existing = await ctx.db
      .query("dailyInput")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        events: args.events,
        insights: args.insights,
        struggles: args.struggles,
        futurePlans: args.futurePlans,
        metrics: args.metrics,
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Create new
      const id = await ctx.db.insert("dailyInput", {
        date: args.date,
        events: args.events,
        insights: args.insights,
        struggles: args.struggles,
        futurePlans: args.futurePlans,
        metrics: args.metrics,
        createdAt: now,
        updatedAt: now,
      });
      return id;
    }
  },
});

/**
 * Get daily input for a specific date
 */
export const getDailyInput = query({
  args: {
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const input = await ctx.db
      .query("dailyInput")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .first();

    return input;
  },
});

/**
 * Get today's daily input
 */
export const getTodayInput = query({
  handler: async (ctx) => {
    const today = new Date().toISOString().split('T')[0];

    const input = await ctx.db
      .query("dailyInput")
      .withIndex("by_date", (q) => q.eq("date", today))
      .first();

    return input;
  },
});

/**
 * Save generated posts (from AI)
 */
export const saveGeneratedPosts = mutation({
  args: {
    posts: v.array(v.object({
      date: v.string(),
      content: v.string(),
      category: v.string(),
      postType: v.string(),
      algorithmScore: v.number(),
      scoreBreakdown: v.object({
        hookStrength: v.number(),
        conversationTrigger: v.number(),
        specificity: v.number(),
        authenticity: v.number(),
      }),
      suggestMedia: v.boolean(),
      mediaType: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const ids = [];

    for (const post of args.posts) {
      const id = await ctx.db.insert("generatedPosts", {
        ...post,
        status: "generated",
        createdAt: now,
        updatedAt: now,
      });
      ids.push(id);
    }

    return ids;
  },
});

/**
 * Get generated posts for a specific date
 */
export const getGeneratedPostsByDate = query({
  args: {
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("generatedPosts")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .order("desc")
      .collect();

    return posts;
  },
});

/**
 * Get today's generated posts
 */
export const getTodayGeneratedPosts = query({
  handler: async (ctx) => {
    const today = new Date().toISOString().split('T')[0];

    const posts = await ctx.db
      .query("generatedPosts")
      .withIndex("by_date", (q) => q.eq("date", today))
      .order("desc")
      .collect();

    return posts;
  },
});

/**
 * Update a generated post (edit)
 */
export const updateGeneratedPost = mutation({
  args: {
    id: v.id("generatedPosts"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      content: args.content,
      status: "edited",
      updatedAt: Date.now(),
    });
  },
});

/**
 * Approve a post (ready to be posted)
 */
export const approvePost = mutation({
  args: {
    id: v.id("generatedPosts"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "approved",
      updatedAt: Date.now(),
    });
  },
});

/**
 * Mark a post as posted (actually posted to X)
 */
export const markPostAsPosted = mutation({
  args: {
    id: v.id("generatedPosts"),
    tweetUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    await ctx.db.patch(args.id, {
      status: "posted",
      postedAt: now,
      tweetUrl: args.tweetUrl,
      updatedAt: now,
    });

    // Add to content bank for tracking
    const post = await ctx.db.get(args.id);
    if (post) {
      // Simple hash function for duplicate detection
      const contentHash = Buffer.from(post.content).toString('base64');

      await ctx.db.insert("contentBank", {
        content: post.content,
        contentHash,
        topics: [post.category],
        postedAt: now,
        performance: {
          likes: 0,
          retweets: 0,
          replies: 0,
        },
        createdAt: now,
      });
    }
  },
});

/**
 * Reject a post (user doesn't want to use it)
 */
export const rejectPost = mutation({
  args: {
    id: v.id("generatedPosts"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "rejected",
      updatedAt: Date.now(),
    });
  },
});

/**
 * Delete a generated post
 */
export const deleteGeneratedPost = mutation({
  args: {
    id: v.id("generatedPosts"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

/**
 * Get post performance stats for a date range
 */
export const getPostPerformanceStats = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const startTimestamp = new Date(args.startDate + 'T00:00:00').getTime();
    const endTimestamp = new Date(args.endDate + 'T23:59:59').getTime();

    const posts = await ctx.db
      .query("contentBank")
      .withIndex("by_posted")
      .filter((q) =>
        q.and(
          q.gte(q.field("postedAt"), startTimestamp),
          q.lte(q.field("postedAt"), endTimestamp)
        )
      )
      .collect();

    const totalPosts = posts.length;
    const totalLikes = posts.reduce((sum, p) => sum + p.performance.likes, 0);
    const totalRetweets = posts.reduce((sum, p) => sum + p.performance.retweets, 0);
    const totalReplies = posts.reduce((sum, p) => sum + p.performance.replies, 0);

    // Group by category
    const categoryStats: Record<string, { count: number; avgLikes: number }> = {};
    posts.forEach(post => {
      post.topics.forEach(topic => {
        if (!categoryStats[topic]) {
          categoryStats[topic] = { count: 0, avgLikes: 0 };
        }
        categoryStats[topic].count++;
        categoryStats[topic].avgLikes += post.performance.likes;
      });
    });

    // Calculate averages
    Object.keys(categoryStats).forEach(category => {
      categoryStats[category].avgLikes = Math.round(
        categoryStats[category].avgLikes / categoryStats[category].count
      );
    });

    return {
      totalPosts,
      avgLikes: totalPosts > 0 ? Math.round(totalLikes / totalPosts) : 0,
      avgRetweets: totalPosts > 0 ? Math.round(totalRetweets / totalPosts) : 0,
      avgReplies: totalPosts > 0 ? Math.round(totalReplies / totalPosts) : 0,
      categoryStats,
      topPosts: posts
        .sort((a, b) => b.performance.likes - a.performance.likes)
        .slice(0, 5),
    };
  },
});
