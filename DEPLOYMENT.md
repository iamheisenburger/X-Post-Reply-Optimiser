# Deployment Guide

## ✅ GitHub - DONE
Your code is now live at: https://github.com/iamheisenburger/X-Post-Reply-Optimiser

## 🚀 Vercel Deployment

### Step 1: Import from GitHub
1. Go to [Vercel Dashboard](https://vercel.com/new)
2. Click "Import Project"
3. Select your GitHub repo: `iamheisenburger/X-Post-Reply-Optimiser`
4. Vercel will auto-detect Next.js settings

### Step 2: Environment Variables
Add these in Vercel dashboard (Settings → Environment Variables):

```env
# Convex - Get from your Convex dashboard
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOYMENT=prod:brave-owl-955

# Twitter API (Optional - for fetching target data)
TWITTER_API_KEY=your_key_here
TWITTER_API_BASE_URL=https://api.twitterapi.io/v1

# Your X Handle
NEXT_PUBLIC_X_HANDLE=madmanhakim
```

### Step 3: Deploy
- Click "Deploy"
- Vercel will build and deploy automatically
- You'll get a URL like: `x-post-reply-optimiser.vercel.app`

---

## 🗄️ Convex Setup

I can see you have **Production** deployment ready: `prod:brave-owl-955`

### Option A: Use Your Production Deployment (Recommended)

1. **Get your Convex URL:**
   - Go to your Convex dashboard
   - Click on "Production" deployment
   - Copy the deployment URL (looks like `https://brave-owl-955.convex.cloud`)

2. **Set up locally:**
```bash
# In your project directory
npx convex dev --prod brave-owl-955
```

This will:
- Connect to your production Convex deployment
- Generate `.env.local` with `NEXT_PUBLIC_CONVEX_URL`
- Push the schema from `convex/schema.ts`

3. **Add to Vercel:**
   - Copy the `NEXT_PUBLIC_CONVEX_URL` from `.env.local`
   - Add it to Vercel environment variables

### Option B: Use Development Deployment

If you want to test separately:

```bash
# Connect to dev deployment
npx convex dev --dev quick-flamingo-142
```

---

## 📡 Twitter API Setup (Optional)

### What You Need
The Twitter API integration is **optional** - the app works without it!

**With API:**
- Auto-fetch target user data (followers, engagement rate)
- Get recent tweets from your VIP targets
- Calculate engagement metrics

**Without API:**
- Manually enter target info
- Full content optimizer still works
- All algorithm features available

### If You Want Twitter API:

#### Step 1: Sign Up
1. Go to [twitterapi.io](https://twitterapi.io)
2. Create account
3. Choose a plan:
   - **Starter**: $5/month (10K tweets)
   - **Growth**: $20/month (50K tweets)
   - For this project: Starter is plenty!

#### Step 2: Get API Key
1. In twitterapi.io dashboard
2. Navigate to "API Keys"
3. Create new key
4. Copy the key (looks like: `ta_xxxxxxxxxxxxxxxx`)

#### Step 3: Add to Your Project

**Locally (.env.local):**
```env
TWITTER_API_KEY=ta_xxxxxxxxxxxxxxxx
TWITTER_API_BASE_URL=https://api.twitterapi.io/v1
```

**Vercel (Environment Variables):**
- Add same variables in Vercel dashboard
- Redeploy (Vercel will do this automatically)

#### Step 4: Test
```typescript
// In your app, this will now work:
import { getUser } from '@/lib/twitter-api';

const user = await getUser('madmanhakim');
console.log(user.followers_count); // Will show your real follower count
```

### API Cost Estimate
For your 30-day challenge:
- **Fetching 50 targets** = 50 API calls = ~$0.01
- **Daily updates** (30 days × 50) = 1,500 calls = ~$0.30
- **Recent tweets** (10 per target × 50) = 500 calls = ~$0.10

**Total: ~$0.41 for entire 30 days**

Much cheaper than $5/month minimum! 😄

---

## 🎯 Deployment Checklist

### Before Deploying:
- [x] Code pushed to GitHub ✅
- [ ] Convex deployment connected
- [ ] Environment variables set in Vercel
- [ ] Twitter API key (if using)

### After Deploying:
- [ ] Test content optimizer
- [ ] Add first VIP target
- [ ] Verify Convex connection
- [ ] (Optional) Test Twitter API

### Vercel Configuration:
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```
(Vercel auto-detects this for Next.js)

---

## 🔧 Troubleshooting

### Convex Connection Issues

**Problem:** "Failed to connect to Convex"

**Solution:**
```bash
# Re-authenticate with Convex
npx convex dev

# Or specifically use your production deployment
npx convex dev --prod brave-owl-955
```

### Vercel Build Fails

**Problem:** Build fails on Vercel

**Check:**
1. Are all environment variables set?
2. Is `NEXT_PUBLIC_CONVEX_URL` correct?
3. Did you push the schema with `npx convex deploy`?

**Fix:**
```bash
# Deploy schema manually
npx convex deploy --prod brave-owl-955
```

### Twitter API Not Working

**Problem:** API calls return errors

**Check:**
1. Is `TWITTER_API_KEY` set correctly?
2. Is it in Vercel environment variables?
3. Have you redeployed after adding it?

---

## 📊 Monitoring

### Convex Dashboard
- Monitor database queries
- Check function calls
- View logs in real-time
- Track usage

### Vercel Analytics
- Page views
- Performance metrics
- Error tracking
- Build logs

---

## 🎉 You're Live!

Once deployed, share your app:
- **Live URL:** `https://your-app.vercel.app`
- **GitHub:** https://github.com/iamheisenburger/X-Post-Reply-Optimiser
- **Your Journey:** Tweet about it! 🚀

---

## Next Steps After Deployment

1. **Day 1:**
   - Add your 50 VIP targets
   - Optimize your first post
   - Document setup process

2. **Week 1:**
   - Daily engagement routine
   - Track what works
   - Refine strategy

3. **Week 4:**
   - Hit 250 followers
   - Get 50 SubWise users
   - Share your journey!

---

**Need Help?**
- Check logs in Vercel dashboard
- View Convex logs in their dashboard
- Refer to SETUP.md for local development

Good luck! 🚀


