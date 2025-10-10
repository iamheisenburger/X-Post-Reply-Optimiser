# Quick Setup Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Convex (Database)

```bash
# Run Convex dev server (will open browser for authentication)
npx convex dev
```

This will:
- Create a Convex account (if you don't have one)
- Generate your deployment
- Create `.env.local` with your Convex URL

### 3. (Optional) Twitter API Setup

If you want to fetch target user data:

1. Sign up at [twitterapi.io](https://twitterapi.io)
2. Get your API key
3. Add to `.env.local`:

```env
TWITTER_API_KEY=your_key_here
TWITTER_API_BASE_URL=https://api.twitterapi.io/v1
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
x-reply-optimizer/
├── app/                    # Next.js pages
│   ├── page.tsx           # Content optimizer (main page)
│   ├── targets/page.tsx   # VIP target manager
│   ├── analytics/         # Performance tracking (coming soon)
│   └── library/           # Content library (coming soon)
│
├── components/
│   ├── navigation.tsx     # Main navigation
│   ├── target-manager.tsx # VIP targets UI
│   └── ui/               # shadcn components
│
├── lib/
│   ├── x-algorithm.ts    # X algorithm rules & scoring (EXACT weights!)
│   ├── twitter-api.ts    # Twitter API wrapper
│   └── utils.ts          # Utilities
│
├── convex/
│   ├── schema.ts         # Database schema
│   ├── targets.ts        # Target CRUD operations
│   ├── posts.ts          # Post tracking
│   └── tsconfig.json     # Convex TypeScript config
│
└── mcp.json              # MCP server configuration
```

## 🎯 How to Use

### Content Optimizer (Main Page)

1. **Write your post/reply** in the textarea
2. **Select your goal**: 
   - Replies (highest weight: 13.5x)
   - Retweets  
   - Profile Visits
   - Viral Reach
3. **Click "Analyze"** to see:
   - Algorithm score (0-100)
   - Breakdown by category
   - Specific weaknesses
   - Optimization recommendations
   - Goal-specific tips

### VIP Target Manager

1. **Add high-value accounts** in your niche
2. **Set priority** (high/medium/low)
3. **Tag by category** (saas, mma, indie-hacker, etc.)
4. **Track last engagement** to stay consistent
5. **Manage up to 50 targets**

## 📊 Understanding the Algorithm Score

The score is based on 5 categories:

1. **Engagement Potential** (30 pts)
   - Has question? (+8)
   - Has CTA? (+7)
   - Mentions relevant accounts? (+8)

2. **Content Quality** (25 pts)
   - Has media? (+10)
   - Is thread? (+8)
   - No external links? (+7)

3. **Timing** (20 pts)
   - Post recency
   - Critical first 15-minute window

4. **Author Reputation** (15 pts)
   - Your TweepCred score
   - Follower quality

5. **Network Effects** (10 pts)
   - Follower overlap
   - Social proof signals

## 🎓 Key Algorithm Insights

### EXACT Engagement Weights (from X's Heavy Ranker)

| Engagement | Weight | Strategy |
|-----------|--------|----------|
| Reply + Author Engages | **75.0x** | Ask insightful questions, add value |
| Reply | **13.5x** | Spark conversations, ask questions |
| Profile Click + Engage | **12.0x** | Optimize bio, pin best content |
| Good Click (2+ min) | **10.0x** | Create threads, detailed insights |
| Retweet | **1.0x** | Share valuable, retweetable content |
| Like | **0.5x** | Baseline engagement |

### Formula

```
score = Σ (engagement_weight × probability_of_engagement)
```

## 💡 Pro Tips

### For Maximum Reply Engagement:
- End with open-ended questions
- Share controversial (but respectful) takes
- Ask for experiences: "Has anyone else...?"
- Reply to your own post with context

### For Profile Visits:
- Tease your expertise
- End with "More in my pinned tweet"
- Position yourself as thought leader

### For Viral Reach:
- Combine: strong hook + media + question + timing
- Tag 1-2 larger accounts (respectfully)
- Post when target audience is active
- Engage immediately after posting

### Target Selection:
- Choose accounts whose followers = your target audience
- Prioritize 3%+ engagement rates
- Mix large (100K+) and mid-tier (10-50K) accounts
- Reply within first 15 minutes of their posts

## 🐛 Troubleshooting

### Convex Not Working?
```bash
# Re-authenticate
npx convex dev

# Check .env.local has:
NEXT_PUBLIC_CONVEX_URL=https://...
CONVEX_DEPLOYMENT=...
```

### TypeScript Errors?
```bash
# Regenerate Convex types
npx convex dev

# Or directly:
npx convex codegen
```

### Styles Not Loading?
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

## 📈 Next Steps

1. **Add your 50 VIP targets** in the Targets page
2. **Draft 5 posts** and optimize them
3. **Post your best one** and track performance
4. **Engage with targets** daily (20 replies minimum)
5. **Document your journey** - build in public!

## 🔗 Resources

- [X Algorithm GitHub](https://github.com/twitter/the-algorithm)
- [Heavy Ranker Docs](https://github.com/twitter/the-algorithm-ml/blob/main/projects/home/recap/README.md)
- [Your 30-Day Challenge Tweet](https://x.com/madmanhakim)

---

**Good luck with your 30-day challenge!** 🚀

3 → 250 followers | 0 → 50 SubWise users

