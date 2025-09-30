"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { Firecrawl } from "@mendable/firecrawl-js";

const app = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });

/**
 * Scrapes multiple URLs using Firecrawl and returns combined markdown content
 */
export const scrapeUrls = internalAction({
	args: {
		urls: v.array(v.string()),
	},
	handler: async (_, args) => {
		try {
			// Scrape all URLs in parallel
			const scrapePromises = args.urls.map(async (url) => {
				try {
					const result = await app.scrape(url, {
						formats: ["markdown"],
					});


					if (!result.markdown) {
						console.error(`Failed to scrape ${url}`);
						return null;
					}

					return {
						url,
						markdown: result.markdown,
						title: result.metadata?.title || url,
					};
				} catch (error) {
					console.error(`Error scraping ${url}:`, error);
					return null;
				}
			});

			const results = await Promise.all(scrapePromises);

			// Filter out failed scrapes
			const successfulScrapes = results.filter((r) => r !== null);

			if (successfulScrapes.length === 0) {
				throw new Error("Failed to scrape any URLs");
			}

			// Combine all markdown content
			const combinedContent = successfulScrapes
				.map((scrape) => {
					return `# ${scrape.title}\n\nSource: ${scrape.url}\n\n${scrape.markdown}`;
				})
				.join("\n\n---\n\n");

			return {
				success: true,
				content: combinedContent,
				scrapedCount: successfulScrapes.length,
				totalUrls: args.urls.length,
			};
		} catch (error) {
			console.error("Error in scrapeUrls:", error);
			throw new Error(
				`Failed to scrape URLs: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	},
});
