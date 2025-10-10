import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create or update daily analytics
export const upsert = mutation({
  args: {
    date: v.string(), // YYYY-MM-DD
    followersGained: v.optional(v.number()),
    subwiseUsersGained: v.optional(v.number()),
    totalPosts: v.optional(v.number()),
    totalReplies: v.optional(v.number()),
    totalEngagement: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { date, ...updates } = args;
    
    // Check if analytics for this date already exists
    const existing = await ctx.db
      .query("analytics")
      .withIndex("by_date", (q) => q.eq("date", date))
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        ...updates,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      // Create new
      const now = Date.now();
      return await ctx.db.insert("analytics", {
        date,
        followersGained: updates.followersGained || 0,
        subwiseUsersGained: updates.subwiseUsersGained || 0,
        totalPosts: updates.totalPosts || 0,
        totalReplies: updates.totalReplies || 0,
        totalEngagement: updates.totalEngagement || 0,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Get analytics for a date range
export const getRange = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const allAnalytics = await ctx.db
      .query("analytics")
      .withIndex("by_date")
      .collect();
    
    return allAnalytics.filter(
      (a) => a.date >= args.startDate && a.date <= args.endDate
    );
  },
});

// Get all analytics
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("analytics")
      .withIndex("by_date")
      .order("desc")
      .collect();
  },
});

