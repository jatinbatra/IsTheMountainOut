import { TwitterApi } from "twitter-api-v2";

/**
 * Post a tweet to X/Twitter.
 * Returns true if posted successfully, false if credentials not configured.
 */
export async function postTweet(message: string): Promise<boolean> {
  const appKey = process.env.TWITTER_APP_KEY;
  const appSecret = process.env.TWITTER_APP_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_SECRET;

  if (!appKey || !appSecret || !accessToken || !accessSecret) {
    console.log("[Twitter] Credentials not configured, skipping tweet");
    console.log(`[Twitter] Would have posted: ${message}`);
    return false;
  }

  try {
    const client = new TwitterApi({
      appKey,
      appSecret,
      accessToken,
      accessSecret,
    });

    await client.v2.tweet(message);
    console.log(`[Twitter] Posted: ${message}`);
    return true;
  } catch (err) {
    console.warn("[Twitter] Failed to post:", err instanceof Error ? err.message : String(err));
    return false;
  }
}
