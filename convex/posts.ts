import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new post/reply
export const create = mutation({
  args: {
    content: v.string(),
    type: v.union(v.literal("reply"), v.literal("post"), v.literal("thread")),
    targetUsername: v.optional(v.string()),
    targetTweetId: v.optional(v.string()),
    algorithmScore: v.number(),
    scoreBreakdown: v.object({
      engagement: v.number(),
      recency: v.number(),
      mediaPresence: v.number(),
      conversationDepth: v.number(),
      authorReputation: v.number(),
    }),
    status: v.union(
      v.literal("draft"),
      v.literal("optimized"),
      v.literal("posted")
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const postId = await ctx.db.insert("posts", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
    return postId;
  },
});

// Get all posts
export const list = query({
  args: {
    status: v.optional(v.union(v.literal("draft"), v.literal("optimized"), v.literal("posted"))),
  },
  handler: async (ctx, args) => {
    const status = args.status;
    
    if (status) {
      return await ctx.db
        .query("posts")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .collect();
    }
    
    return await ctx.db
      .query("posts")
      .order("desc")
      .collect();
  },
});

// Get a single post by ID
export const get = query({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Update a post
export const update = mutation({
  args: {
    id: v.id("posts"),
    content: v.optional(v.string()),
    algorithmScore: v.optional(v.number()),
    scoreBreakdown: v.optional(v.object({
      engagement: v.number(),
      recency: v.number(),
      mediaPresence: v.number(),
      conversationDepth: v.number(),
      authorReputation: v.number(),
    })),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("optimized"),
      v.literal("posted")
    )),
    postedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Delete a post
export const remove = mutation({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

