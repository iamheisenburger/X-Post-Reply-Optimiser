# Convex Setup Guide

Based on your Convex dashboard screenshots, you have:
- **Development:** `quick-flamingo-142`
- **Production:** `brave-owl-955` ✅

## Quick Setup (3 commands)

```bash
# 1. Navigate to project
cd "C:\Users\arshadhakim\OneDrive\Desktop\X Replies\x-reply-optimizer"

# 2. Connect to your PRODUCTION Convex deployment
npx convex dev --prod brave-owl-955

# 3. This will:
#    - Create .env.local with your Convex URL
#    - Push your schema (targets, posts, analytics tables)
#    - Start watching for changes
```

## What Gets Created

### Database Tables (from `convex/schema.ts`)

1. **targets** - Your 50 VIP accounts
   ```typescript
   {
     username: string
     displayName: string
     priority: "high" | "medium" | "low"
     tags: string[]
     followerCount?: number
     lastEngaged?: number
     // ... more fields
   }
   ```

2. **posts** - Your optimized content
   ```typescript
   {
     content: string
     type: "reply" | "post" | "thread"
     algorithmScore: number
     scoreBreakdown: {
       engagement: number
       content: number
       timing: number
       // ...
     }
     status: "draft" | "optimized" | "posted"
     // ... performance tracking
   }
   ```

3. **templates** - Proven content patterns
4. **analytics** - Daily progress tracking
5. **algorithmRules** - X algorithm reference

## Using Convex MCP Server

I see you have the Convex MCP server set up! Here's how to use it:

### Query Your Data

```typescript
// In your app
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// Get all targets
const targets = useQuery(api.targets.list);

// Get posts by status
const drafts = useQuery(api.posts.listByStatus, { status: "draft" });
```

### Mutations (Add/Update Data)

```typescript
import { useMutation } from "convex/react";

// Add a new VIP target
const addTarget = useMutation(api.targets.add);

await addTarget({
  username: "levelsio",
  displayName: "Pieter Levels",
  priority: "high",
  tags: ["indie-hacker", "saas"],
});
```

### Via MCP (Using Cursor/AI)

With your Convex MCP server, you can:
- Query data directly from Cursor
- View tables and schema
- Read function specs
- Test queries

## Verifying Setup

### 1. Check Tables Created
```bash
# After running npx convex dev
# Open Convex dashboard → Data
# You should see: targets, posts, templates, analytics, algorithmRules
```

### 2. Test Query
```bash
# In convex dashboard, run:
await ctx.db.query("targets").collect()
# Should return: [] (empty at first)
```

### 3. Add First Target (via app)
- Run `npm run dev`
- Go to "VIP Targets" page
- Click "Add Target"
- Fill in details
- Check Convex dashboard → Data → targets

## Environment Variables

After running `npx convex dev`, your `.env.local` will have:

```env
NEXT_PUBLIC_CONVEX_URL=https://brave-owl-955.convex.cloud
CONVEX_DEPLOYMENT=prod:brave-owl-955
```

**Add to Vercel:**
1. Go to your Vercel project
2. Settings → Environment Variables
3. Add both variables
4. Redeploy

## Development vs Production

### Development (`quick-flamingo-142`)
- For testing
- Separate data
- Command: `npx convex dev --dev quick-flamingo-142`

### Production (`brave-owl-955`) ✅ Recommended
- For live app
- Your real data
- Command: `npx convex dev --prod brave-owl-955`

## Troubleshooting

### "Cannot find module @/convex/_generated/api"

**Fix:**
```bash
# Regenerate Convex types
npx convex dev

# Or manually
npx convex codegen
```

### "Failed to connect"

**Fix:**
```bash
# Re-authenticate
npx convex logout
npx convex dev --prod brave-owl-955
```

### Schema Changes Not Showing

**Fix:**
```bash
# Push schema manually
npx convex deploy --prod brave-owl-955
```

## Next Steps

1. ✅ Run `npx convex dev --prod brave-owl-955`
2. ✅ Verify tables created in Convex dashboard
3. ✅ Run `npm run dev`
4. ✅ Add your first VIP target
5. ✅ Optimize your first post

## Monitoring

### Convex Dashboard
- **Data tab:** View all your data
- **Functions tab:** See query/mutation calls
- **Logs tab:** Debug issues
- **Usage tab:** Track API calls

### Queries Per Day Estimate
For 30-day challenge:
- Daily targets check: ~50 queries/day
- Post creation: ~5 mutations/day
- Analytics updates: ~10 mutations/day

**Total: ~2,000 queries/month** (well within free tier!)

---

**Your Convex is ready!** Just run the command and start building. 🚀


