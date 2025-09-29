import { env } from "../src/env";

export default {
	providers: [
		{
			domain: env.CONVEX_SITE_URL,
			applicationID: "convex",
		},
	],
};