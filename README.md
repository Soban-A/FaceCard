# Create T3 App

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

## What's next? How do I make an app with this?

We try to keep this project as simple as possible, so you can start with just the scaffolding we set up for you, and add additional things later when they become necessary.

If you are not familiar with the different technologies used in this project, please refer to the respective docs. If you still are in the wind, please join our [Discord](https://t3.gg/discord) and ask for help.

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Drizzle](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

## Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## How do I deploy this?

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.


Face Card Takehome Interview Question

Prompt
This is an open book exercise. Use any apps, tools, AI, etc. you would normally use when programming. We ask that you use TypeScript, Next.js, tRPC, and Tailwind CSS, the core of our stack. Beyond that, choose any libraries and tools you like.

Task
Build a simple clone of Perplexity  https://www.perplexity.ai/.

At a minimum, your app should include a page where a user can submit a query and receive a combination of search results and an AI response based on those results, with citations.

We're specifically interested in how you approach the following, as they reflect real patterns in our codebase:

tRPC: define a router with a procedure (or streaming procedure) for handling search/AI queries. Think about input validation, error handling, and how you'd structure the router.
Next.js: how you structure your app, handle server vs. client components, and use the App Router.
Tailwind: we care about clean, well-structured UI. It doesn't need to be elaborate, but it should look intentional.
For search results, one option is SerpAPI https://github.com/serpapi/serpapi-javascript (or any similar alternative). Choose any LLM provider.

Anything beyond the minimum is extra credit, choose whatever additions you think are most valuable or interesting, especially if there is a fintech aspect to it!

If you're relying on free API keys, be mindful of your usage limits during testing.

This specification is intentionally somewhat open-ended, we want to see how you exercise judgment.

Submission
Email a link to a public GitHub repo (or a zip file with source code) and a 20–120 second recording of the functionality to george@facecardhq.com or david@facecardhq.com.

