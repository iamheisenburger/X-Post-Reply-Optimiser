// lib/twitter-api.ts

const TWITTER_API_BASE_URL = process.env.TWITTER_API_BASE_URL || "https://api.twitterapi.io";
const TWITTER_API_KEY = process.env.TWITTER_API_KEY;

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
      const response = await fetch(`${TWITTER_API_BASE_URL}/users/by/username/${username}`, {
        headers: {
          Authorization: `Bearer ${TWITTER_API_KEY}`,
        },
      });
      if (!response.ok) {
        console.error(`Error fetching user ${username}: ${response.statusText}`);
        return null;
      }
      const data = await response.json();
      return data.data;
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
      const response = await fetch(`${TWITTER_API_BASE_URL}/users/${userId}/tweets?max_results=${count}`, {
        headers: {
          Authorization: `Bearer ${TWITTER_API_KEY}`,
        },
      });
      if (!response.ok) {
        console.error(`Error fetching tweets for user ${userId}: ${response.statusText}`);
        return [];
      }
      const data = await response.json();
      return data.data || [];
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
      // Fetch tweet with author expansion
      const response = await fetch(
        `${TWITTER_API_BASE_URL}/tweets/${tweetId}?expansions=author_id&tweet.fields=created_at,conversation_id,entities,public_metrics`,
        {
          headers: {
            Authorization: `Bearer ${TWITTER_API_KEY}`,
          },
        }
      );
      
      if (!response.ok) {
        console.error(`Error fetching tweet ${tweetId}: ${response.statusText}`);
        return null;
      }
      
      const data = await response.json();
      const tweet = data.data;
      const author = data.includes?.users?.[0];

      if (!tweet || !author) {
        console.error(`Tweet or author data missing for ${tweetId}`);
        return null;
      }

      return {
        ...tweet,
        author: {
          id: author.id,
          username: author.username,
          name: author.name,
          description: author.description || "",
          followers_count: author.public_metrics?.followers_count || 0,
          following_count: author.public_metrics?.following_count || 0,
          verified: author.verified || false,
        },
        hasMedia: !!(tweet.entities?.urls?.length || tweet.attachments),
        isThread: tweet.conversation_id !== tweet.id,
      };
    } catch (error) {
      console.error(`Failed to fetch tweet ${tweetId}:`, error);
      return null;
    }
  },

  // Add more API functions as needed
};

