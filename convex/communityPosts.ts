import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Save generated community posts
 */
export const saveGenerated = mutation({
  args: {
    posts: v.array(v.object({
      date: v.string(),
      communityName: v.string(),
      content: v.string(),
      category: v.string(),
      algorithmScore: v.number(),
      communityFitScore: v.number(),
      scoreBreakdown: v.object({
        hookStrength: v.number(),
        communityAlignment: v.number(),
        conversationTrigger: v.number(),
        authenticity: v.number(),
      }),
      suggestMedia: v.boolean(),
      mediaType: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const ids = [];

    console.log(`💾 Saving ${args.posts.length} community posts to Convex`);

    for (const post of args.posts) {
      try {
        const insertData: {
          date: string;
          communityName: string;
          content: string;
          category: string;
          algorithmScore: number;
          communityFitScore: number;
          scoreBreakdown: {
            hookStrength: number;
            communityAlignment: number;
            conversationTrigger: number;
            authenticity: number;
          };
          suggestMedia: boolean;
          status: "generated" | "edited" | "approved" | "posted" | "rejected";
          createdAt: number;
          updatedAt: number;
          mediaType?: string;
        } = {
          date: post.date,
          communityName: post.communityName,
          content: post.content,
          category: post.category,
          algorithmScore: post.algorithmScore,
          communityFitScore: post.communityFitScore,
          scoreBreakdown: post.scoreBreakdown,
          suggestMedia: post.suggestMedia,
          status: "generated",
          createdAt: now,
          updatedAt: now,
        };

        // Only add mediaType if it exists
        if (post.mediaType !== undefined && post.mediaType !== null) {
          insertData.mediaType = post.mediaType;
        }

        const id = await ctx.db.insert("communityPosts", insertData);
        ids.push(id);
        console.log(`✅ Inserted post for ${post.communityName}`);
      } catch (error) {
        console.error(`❌ Failed to insert post for ${post.communityName}:`, error);
        throw error;
      }
    }

    console.log(`✅ All ${ids.length} community posts saved successfully`);
    return ids;
  },
});

/**
 * Get posts for a specific date
 */
export const getByDate = query({
  args: {
    date: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("communityPosts")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .order("desc")
      .collect();
  },
});

/**
 * Get posts for a specific community
 */
export const getByCommunity = query({
  args: {
    communityName: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("communityPosts")
      .withIndex("by_community", (q) => q.eq("communityName", args.communityName))
      .order("desc");

    if (args.limit) {
      return await query.take(args.limit);
    }

    return await query.collect();
  },
});

/**
 * Get posts for a specific date and community
 */
export const getByDateAndCommunity = query({
  args: {
    date: v.string(),
    communityName: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("communityPosts")
      .withIndex("by_date_community", (q) =>
        q.eq("date", args.date).eq("communityName", args.communityName)
      )
      .collect();
  },
});

/**
 * Get today's posts for all communities
 */
export const getToday = query({
  handler: async (ctx) => {
    const today = new Date().toISOString().split('T')[0];

    return await ctx.db
      .query("communityPosts")
      .withIndex("by_date", (q) => q.eq("date", today))
      .order("desc")
      .collect();
  },
});

/**
 * Update a community post (edit)
 */
export const update = mutation({
  args: {
    id: v.id("communityPosts"),
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
export const approve = mutation({
  args: {
    id: v.id("communityPosts"),
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
export const markAsPosted = mutation({
  args: {
    id: v.id("communityPosts"),
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
      const contentHash = Buffer.from(post.content).toString('base64');

      await ctx.db.insert("contentBank", {
        content: post.content,
        contentHash,
        topics: [post.communityName, post.category],
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
export const reject = mutation({
  args: {
    id: v.id("communityPosts"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "rejected",
      updatedAt: Date.now(),
    });
  },
});

/**
 * Delete a community post
 */
export const remove = mutation({
  args: {
    id: v.id("communityPosts"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
