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
      // TwitterAPI.io endpoint format: /twitter/user?userName=username
      const response = await fetch(`${TWITTER_API_BASE_URL}/twitter/user?userName=${username}`, {
        headers: getHeaders(),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error fetching user ${username}: ${response.statusText}`, errorText);
        return null;
      }
      const data = await response.json();
      // TwitterAPI.io returns data directly, not nested in data.data
      return data;
    } catch (error) {
      console.error(`Failed to fetch user ${username}:`, error);
      return null;
    }
  },

  async getUserTweets(userId: string, count: number = 5): Promise<Tweet[]> {
    if (!TWITTER_API_KEY) {
      console.warn("TWITTER_API_KEY is not set. Cannot fetch user tweets.");
      return [];
    }
    try {
      // TwitterAPI.io endpoint format: /twitter/user/tweets?userId=...&count=...
      const response = await fetch(`${TWITTER_API_BASE_URL}/twitter/user/tweets?userId=${userId}&count=${count}`, {
        headers: getHeaders(),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error fetching tweets for user ${userId}: ${response.statusText}`, errorText);
        return [];
      }
      const data = await response.json();
      return Array.isArray(data) ? data : (data.data || []);
    } catch (error) {
      console.error(`Failed to fetch tweets for user ${userId}:`, error);
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
      console.log(`Fetching tweet from: ${url}`);
      
      const response = await fetch(url, {
        headers: getHeaders(),
      });
      
      console.log(`Tweet fetch response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error fetching tweet ${tweetId}:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          url: url
        });
        return null;
      }
      
      const data = await response.json();
      console.log(`Tweet data structure:`, JSON.stringify(data).substring(0, 200));
      
      // TwitterAPI.io returns array in data.data for multiple tweets
      const tweets = data.data || data;
      const tweet = Array.isArray(tweets) ? tweets[0] : tweets;
      
      if (!tweet) {
        console.error(`No tweet found in response for ID ${tweetId}`);
        return null;
      }
      
      // Author might be in includes.users or directly in tweet
      const author = data.includes?.users?.[0] || data.author || data.user || tweet.author || tweet.user;

      if (!tweet) {
        console.error(`Tweet data missing for ${tweetId}`);
        return null;
      }

      // Fetch author data separately if not included
      const authorData = author;
      if (!authorData && tweet.author_id) {
        // Fetch user by ID if needed
        console.log(`Fetching author data for user ID: ${tweet.author_id}`);
      }

      return {
        ...tweet,
        author: authorData ? {
          id: authorData.id || authorData.user_id || "",
          username: authorData.username || authorData.screen_name || "",
          name: authorData.name || authorData.display_name || "",
          description: authorData.description || authorData.bio || "",
          followers_count: authorData.followers_count || authorData.public_metrics?.followers_count || 0,
          following_count: authorData.following_count || authorData.public_metrics?.following_count || 0,
          verified: authorData.verified || false,
        } : {
          id: "",
          username: "unknown",
          name: "Unknown User",
          description: "",
          followers_count: 0,
          following_count: 0,
          verified: false,
        },
        hasMedia: !!(tweet.entities?.urls?.length || tweet.attachments || tweet.media),
        isThread: tweet.conversation_id && tweet.conversation_id !== tweet.id,
      };
    } catch (error) {
      console.error(`Failed to fetch tweet ${tweetId}:`, error);
      return null;
    }
  },

  // Add more API functions as needed
};

