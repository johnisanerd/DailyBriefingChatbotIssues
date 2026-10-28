import { ApifyClient } from 'apify-client';
import { config } from '../config.js';
import type { LinkedInPost } from '../types/index.js';

const client = new ApifyClient({
    token: config.APIFY_API_TOKEN,
});

export async function searchLinkedInPosts(keywords: string[]): Promise<LinkedInPost[]> {
    if (keywords.length === 0) return [];

    console.log(`🚀 Searching LinkedIn for posts with keywords: ${keywords.join(', ')}...`);

    // Prepare Actor input for johnvc/linkedin-post-search-api
    // Each keyword is searched separately, so the 50-post budget is split across them
    const input = {
        "keywords": keywords,
        "maxPostsPerKeyword": Math.ceil(50 / keywords.length), // ~50 items total
        "postedWithin": "day", // Recency
    };

    try {
        const run = await client.actor("johnvc/linkedin-post-search-api").call(input);
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        return items.map((item: any) => ({
            id: item.postId || item.id || Math.random().toString(36).substr(2, 9),
            text: item.text || "",
            authorName: item.authorName || "Unknown",
            authorProfileUrl: item.authorProfileUrl || item.authorUrl,
            postUrl: item.url || item.postUrl,
            postedAt: item.postedAt || item.datePosted || new Date().toISOString(),
            engagement: {
                reactions: item.reactionsCount || item.numLikes || 0,
                comments: item.commentsCount || item.numComments || 0,
                shares: item.sharesCount || 0,
            }
        }));
    } catch (error) {
        console.error("❌ Apify post search failed:", error);
        return [];
    }
}
