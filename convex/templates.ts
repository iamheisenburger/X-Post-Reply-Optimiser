import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new template
export const create = mutation({
  args: {
    name: v.string(),
    content: v.string(),
    type: v.union(v.literal("reply"), v.literal("post"), v.literal("thread")),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const templateId = await ctx.db.insert("templates", {
      ...args,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    return templateId;
  },
});

// Get all templates
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("templates").collect();
  },
});

// Get a single template by ID
export const get = query({
  args: { id: v.id("templates") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Update a template
export const update = mutation({
  args: {
    id: v.id("templates"),
    name: v.optional(v.string()),
    content: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Delete a template
export const remove = mutation({
  args: { id: v.id("templates") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Increment usage count
export const incrementUsage = mutation({
  args: { id: v.id("templates") },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.id);
    if (template) {
      await ctx.db.patch(args.id, {
        usageCount: template.usageCount + 1,
        lastUsedAt: Date.now(),
      });
    }
  },
});

