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
      console.log(`Tweet data structure:`, JSON.stringify(data).substring(0, 500));
      
      // TwitterAPI.io returns tweets in a 'tweets' array
      const tweets = data.tweets || [];
      const tweet = tweets[0];
      
      if (!tweet) {
        console.error(`No tweet found in response for ID ${tweetId}`);
        return null;
      }

      console.log(`Tweet object keys:`, Object.keys(tweet));
      
      // TwitterAPI.io includes author data directly in the tweet
      const authorData = tweet.author;
      
      if (!authorData) {
        console.error(`No author data in tweet response`);
        return null;
      }

      console.log(`Author data found:`, JSON.stringify(authorData).substring(0, 200));
      
      // Map author data to our TwitterUser format
      const author: TwitterUser = {
        id: authorData.id || authorData.userId || "",
        username: authorData.username || authorData.screenName || "unknown",
        name: authorData.name || authorData.displayName || "Unknown User",
        description: authorData.description || authorData.bio || "",
        followers_count: authorData.followersCount || authorData.followers_count || 0,
        following_count: authorData.followingCount || authorData.following_count || 0,
        verified: authorData.verified || authorData.isVerified || false,
      };

      console.log(`Successfully extracted author: @${author.username}`);

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
      console.error(`Failed to fetch tweet ${tweetId}:`, error);
      return null;
    }
  },

  // Add more API functions as needed
};

