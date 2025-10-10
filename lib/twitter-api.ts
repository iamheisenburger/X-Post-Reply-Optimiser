// lib/twitter-api.ts

const TWITTER_API_BASE_URL = process.env.TWITTER_API_BASE_URL || "https://api.twitterapi.io/v1";
const TWITTER_API_KEY = process.env.TWITTER_API_KEY;

interface TwitterUser {
  id: string;
  username: string;
  name: string;
  profile_image_url: string;
  followers_count: number;
  following_count: number;
  tweet_count: number;
  description: string;
}

interface Tweet {
  id: string;
  text: string;
  created_at: string;
  public_metrics: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
    impression_count: number;
  };
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

  // Add more API functions as needed (e.g., search, post tweet, etc.)
};

