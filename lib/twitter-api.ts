// lib/twitter-api.ts
// TwitterAPI.io wrapper - uses x-api-key header for authentication

const TWITTER_API_BASE_URL = process.env.TWITTER_API_BASE_URL || "https://api.twitterapi.io";
const TWITTER_API_KEY = process.env.TWITTER_API_KEY;

// Helper function to create headers with x-api-key
function getHeaders(): HeadersInit {
  if (!TWITTER_API_KEY) {
    throw new Error("TWITTER_API_KEY is required");
  }
  return {
    "x-api-key": TWITTER_API_KEY,
    "Content-Type": "application/json",
  };
}

export interface TwitterUser {
  id: string;
  username: string;
  name: string;
  profile_image_url?: string;
  followers_count: number;
  following_count: number;
  tweet_count?: number;
  description: string;
  verified?: boolean;
}

export interface Tweet {
  id: string;
  text: string;
  created_at: string;
  author_id?: string;
  conversation_id?: string;
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
    impression_count?: number;
  };
  entities?: {
    urls?: Array<{ url: string; expanded_url: string }>;
  };
}

export interface DetailedTweet extends Tweet {
  author: TwitterUser;
  hasMedia: boolean;
  isThread: boolean;
}

export const twitterApi = {
  async getUser(username: string): Promise<TwitterUser | null> {
    if (!TWITTER_API_KEY) {
      console.warn("TWITTER_API_KEY is not set. Cannot fetch user data.");
      return null;
    }
    try {
      // TwitterAPI.io CORRECT endpoint: /twitter/user/info
      const url = `${TWITTER_API_BASE_URL}/twitter/user/info?userName=${username}`;
      console.log(`\n🔍 FETCHING USER: @${username}`);
      console.log(`📡 Request URL: ${url}`);
      
      const response = await fetch(url, {
        headers: getHeaders(),
      });
      
      console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ HTTP ERROR: ${response.status} - ${response.statusText}`);
        console.error(`📄 Error Body:`, errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          console.error(`🔍 Parsed Error:`, JSON.stringify(errorJson, null, 2));
        } catch {
          // Not JSON
        }
        
        return null;
      }
      
      const data = await response.json();
      
      console.log(`📦 User API Response Keys: [${Object.keys(data).join(', ')}]`);
      
      // Check for error in response
      if (data.status === "error" || data.error || data.errors) {
        const errorMsg = data.msg || data.error?.message || data.errors?.[0]?.message || JSON.stringify(data.error || data.errors);
        console.error(`❌ API returned error for @${username}: ${errorMsg}`);
        return null;
      }
      
      // TwitterAPI.io returns user data nested in data.data
      const userData = data.data || data;
      
      console.log(`   User ID: ${userData.id || 'NOT FOUND'}`);
      console.log(`   Username: ${userData.userName || userData.username || 'NOT FOUND'}`);
      console.log(`   Followers: ${userData.followers || 0}`);
      
      // Map to our TwitterUser interface
      const user: TwitterUser = {
        id: userData.id || "",
        username: userData.userName || userData.username || userData.screenName || "",
        name: userData.name || "",
        description: userData.description || "",
        followers_count: userData.followers || 0,
        following_count: userData.following || 0,
        verified: userData.isVerified || userData.isBlueVerified || false,
        profile_image_url: userData.profilePicture || userData.profile_image_url,
        tweet_count: userData.statusesCount || 0,
      };
      
      if (!user.id || !user.username) {
        console.error(`❌ INVALID USER DATA: Missing required fields (id or username)`);
        console.error(`   Full response:`, JSON.stringify(data, null, 2));
        return null;
      }
      
      console.log(`✅ SUCCESS: Fetched @${user.username} (ID: ${user.id})`);
      
      return user;
    } catch (error) {
      console.error(`💥 EXCEPTION in getUser(${username}):`, error);
      if (error instanceof Error) {
        console.error(`   Message: ${error.message}`);
      }
      return null;
    }
  },

  async getUserTweets(userId: string, count: number = 10): Promise<Tweet[]> {
    if (!TWITTER_API_KEY) {
      console.warn("TWITTER_API_KEY is not set. Cannot fetch user tweets.");
      return [];
    }
    try {
      // TwitterAPI.io CORRECT endpoint: /twitter/user/last_tweets
      // Note: API returns up to 20 tweets per page, no 'count' parameter
      const url = `${TWITTER_API_BASE_URL}/twitter/user/last_tweets?userId=${userId}`;
      console.log(`\n🔍 FETCHING TWEETS: Last tweets for user ${userId}`);
      console.log(`📡 Request URL: ${url}`);
      
      const response = await fetch(url, {
        headers: getHeaders(),
      });
      
      console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ HTTP ERROR: ${response.status} - ${response.statusText}`);
        console.error(`📄 Error Body:`, errorText);
        
        // Try to parse error as JSON for better debugging
        try {
          const errorJson = JSON.parse(errorText);
          console.error(`🔍 Parsed Error:`, JSON.stringify(errorJson, null, 2));
        } catch {
          // Not JSON, already logged as text
        }
        
        return [];
      }
      
      const data = await response.json();
      
      // ===== COMPREHENSIVE LOGGING =====
      console.log(`\n📦 FULL API RESPONSE for getUserTweets(${userId}):`);
      console.log(`   Type: ${typeof data}`);
      console.log(`   Is Array: ${Array.isArray(data)}`);
      if (typeof data === 'object' && data !== null) {
        console.log(`   Keys: [${Object.keys(data).join(', ')}]`);
        console.log(`   Full Response (first 1000 chars):`, JSON.stringify(data, null, 2).substring(0, 1000));
      }
      
      // ===== DETECT "UNAVAILABLE" RESPONSES FIRST =====
      // TwitterAPI.io returns this format when they can't fetch timeline:
      // { "status": "success", "data": { "unavailable": true, "message": "User is suspended" } }
      // This happens for rate limits, suspended accounts, or protected accounts
      if (data.data && typeof data.data === 'object' && data.data.unavailable === true) {
        const reason = data.data.message || data.data.unavailableReason || "Timeline unavailable";
        console.warn(`⚠️ TwitterAPI.io reports timeline unavailable: ${reason}`);
        console.warn(`   NOTE: This might be a FALSE POSITIVE - the account may not actually be suspended`);
        console.warn(`   Common causes: Rate limiting, protected account, or API limitation`);
        console.warn(`   Will continue with single-tweet analysis as fallback`);
        return [];
      }
      
      // ===== ATTEMPT MULTIPLE PARSING STRATEGIES =====
      
      // Strategy 1: Check for direct tweets array (CORRECT FORMAT per docs)
      if (data.tweets && Array.isArray(data.tweets)) {
        console.log(`✅ SUCCESS: Found ${data.tweets.length} tweets in data.tweets`);
        // Return only the requested count (API might return up to 20)
        return data.tweets.slice(0, count);
      }
      
      // Strategy 2: Check if data itself is an array
      if (Array.isArray(data)) {
        console.log(`✅ SUCCESS: Response is direct array with ${data.length} tweets`);
        return data;
      }
      
      // Strategy 3: Check for nested data.data (but NOT the unavailable format)
      if (data.data && Array.isArray(data.data)) {
        console.log(`✅ SUCCESS: Found ${data.data.length} tweets in data.data`);
        return data.data;
      }
      
      // Strategy 4: Check for results array (some APIs use this)
      if (data.results && Array.isArray(data.results)) {
        console.log(`✅ SUCCESS: Found ${data.results.length} tweets in data.results`);
        return data.results;
      }
      
      // Strategy 5: Check for timeline or statuses (Twitter standard)
      if (data.timeline && Array.isArray(data.timeline)) {
        console.log(`✅ SUCCESS: Found ${data.timeline.length} tweets in data.timeline`);
        return data.timeline;
      }
      
      if (data.statuses && Array.isArray(data.statuses)) {
        console.log(`✅ SUCCESS: Found ${data.statuses.length} tweets in data.statuses`);
        return data.statuses;
      }
      
      // Strategy 6: Check for error messages
      if (data.error || data.errors) {
        const errorMsg = data.error?.message || data.errors?.[0]?.message || JSON.stringify(data.error || data.errors);
        console.warn(`⚠️ API returned error: ${errorMsg}`);
        return [];
      }
      
      // If we get here, the response format is unrecognized
      console.error(`\n❌ FAILED TO PARSE RESPONSE: Unrecognized format`);
      console.error(`   This means TwitterAPI.io changed their response structure.`);
      console.error(`   Full response:`, JSON.stringify(data, null, 2));
      
      return [];
    } catch (error) {
      console.error(`\n💥 EXCEPTION in getUserTweets(${userId}):`, error);
      if (error instanceof Error) {
        console.error(`   Message: ${error.message}`);
        console.error(`   Stack:`, error.stack);
      }
      return [];
    }
  },

  async getTweet(tweetId: string): Promise<DetailedTweet | null> {
    if (!TWITTER_API_KEY) {
      console.warn("TWITTER_API_KEY is not set. Cannot fetch tweet.");
      return null;
    }
    try {
      // TwitterAPI.io endpoint format: /twitter/tweets?tweet_ids=...
      const url = `${TWITTER_API_BASE_URL}/twitter/tweets?tweet_ids=${tweetId}`;
      console.log(`\n🔍 FETCHING TWEET: ID ${tweetId}`);
      console.log(`📡 Request URL: ${url}`);
      
      const response = await fetch(url, {
        headers: getHeaders(),
      });
      
      console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ HTTP ERROR: ${response.status} - ${response.statusText}`);
        console.error(`📄 Error Body:`, errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          console.error(`🔍 Parsed Error:`, JSON.stringify(errorJson, null, 2));
        } catch {
          // Not JSON
        }
        
        return null;
      }
      
      const data = await response.json();
      console.log(`📦 Tweet API Response Keys: [${Object.keys(data).join(', ')}]`);
      console.log(`   Response preview (first 500 chars):`, JSON.stringify(data).substring(0, 500));
      
      // Check for errors in response
      if (data.error || data.errors) {
        const errorMsg = data.error?.message || data.errors?.[0]?.message || JSON.stringify(data.error || data.errors);
        console.error(`❌ API returned error for tweet ${tweetId}: ${errorMsg}`);
        return null;
      }
      
      // TwitterAPI.io returns tweets in a 'tweets' array
      const tweets = data.tweets || [];
      
      if (tweets.length === 0) {
        console.error(`❌ No tweets found in response`);
        console.error(`   Expected: data.tweets to be an array with 1 tweet`);
        console.error(`   Got: ${JSON.stringify(data)}`);
        return null;
      }
      
      const tweet = tweets[0];
      console.log(`✅ Found tweet in response`);
      console.log(`   Tweet keys: [${Object.keys(tweet).join(', ')}]`);
      console.log(`   Tweet text: "${tweet.text?.substring(0, 100) || 'NO TEXT'}..."`);
      
      // TwitterAPI.io includes author data directly in the tweet
      const authorData = tweet.author;
      
      if (!authorData) {
        console.error(`❌ No author data in tweet response`);
        console.error(`   Tweet object:`, JSON.stringify(tweet, null, 2));
        return null;
      }

      console.log(`📦 Author data keys: [${Object.keys(authorData).join(', ')}]`);
      
      // Map author data to our TwitterUser format
      const author: TwitterUser = {
        id: authorData.id || authorData.userId || "",
        username: authorData.userName || authorData.username || authorData.screenName || "unknown",
        name: authorData.name || authorData.displayName || "Unknown User",
        description: authorData.description || authorData.bio || "",
        followers_count: authorData.followersCount || authorData.followers_count || 0,
        following_count: authorData.followingCount || authorData.following_count || 0,
        verified: authorData.verified || authorData.isVerified || authorData.isBlueVerified || false,
      };

      if (!author.id || !author.username || author.username === "unknown") {
        console.error(`❌ Invalid author data extracted`);
        console.error(`   Author ID: ${author.id || 'MISSING'}`);
        console.error(`   Username: ${author.username || 'MISSING'}`);
        console.error(`   Raw author data:`, JSON.stringify(authorData, null, 2));
        return null;
      }

      console.log(`✅ SUCCESS: Tweet from @${author.username} (ID: ${author.id})`);

      return {
        ...tweet,
        author: {
          id: author.id,
          username: author.username,
          name: author.name,
          description: author.description,
          followers_count: author.followers_count,
          following_count: author.following_count,
          verified: author.verified || false,
        },
        hasMedia: !!(tweet.entities?.urls?.length || tweet.attachments || tweet.media),
        isThread: tweet.conversation_id && tweet.conversation_id !== tweet.id,
      };
    } catch (error) {
      console.error(`💥 EXCEPTION in getTweet(${tweetId}):`, error);
      if (error instanceof Error) {
        console.error(`   Message: ${error.message}`);
        console.error(`   Stack:`, error.stack);
      }
      return null;
    }
  },

  // Add more API functions as needed
};

