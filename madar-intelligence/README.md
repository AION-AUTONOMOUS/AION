# MADAR Intelligence — مدار للذكاء والبحث

**Tagline:** اكتشف العالم. افهم ما وراءه. / The World, Better Understood.

A bilingual Arabic/English web-search prototype built with Next.js App Router and TypeScript. It searches the live web through Tavily, generates a source-grounded answer through the OpenAI Responses API, and displays the original source links. This is an MVP, not a global search index.

## Requirements

- Node.js 20.9+ (recommended LTS)
- npm
- Tavily API key
- OpenAI API key and a model enabled for that API account

## Local setup

1. `cd madar-intelligence`
2. `npm install`
3. Copy `.env.example` to `.env.local`.
4. Set `TAVILY_API_KEY`, `OPENAI_API_KEY`, and `OPENAI_MODEL` in `.env.local`. Never commit `.env.local` or send keys in chat.
5. `npm run dev` and open `http://localhost:3000`.

## Verification

GitHub Actions run [40829341132](https://github.com/AION-AUTONOMOUS/AION/actions/runs/40829341132) passed `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` for commit `e3b102fd9fdf2bb94d80d83ed673c0bf6b7ecd64`. The workflow currently generates `package-lock.json` during CI because the lockfile is not committed; reproducible dependency locking remains a follow-up before production.

## API

`POST /api/search` JSON body: `{ "query": "...", "language": "ar" | "en" }`. Query length is limited to 2–500 characters. The route returns `answer` and `sources`, or a generic error. Provider secrets are used only server-side. The in-memory rate limit (8 requests per minute per forwarded client IP) is a lightweight single-instance safeguard, not a distributed production rate limiter.

## Security and limitations

- Never expose API keys in client code or logs.
- Provider errors are returned as generic messages; logs contain only a short error code.
- Source excerpts are limited before prompting the model. Citations are requested, but the model can still mis-cite; users should open original sources.
- Search provider and AI requests have timeouts. Provider availability, model access, costs, and current prices must be verified in the respective accounts.
- For production, replace the in-memory limiter with a shared store or edge-level rate limiting, add monitoring and automated dependency updates, and validate citations against returned source IDs before display.
- No login, paid subscriptions, database, real-money features, or external publishing are included.

## Deployment

For Vercel, import the repository and set the project root directory to `madar-intelligence`; add the three environment variables in project settings before deploying. Do not deploy publicly until the owner authorizes it and provider keys are configured. A new dedicated GitHub repository was not created because the connected GitHub tools do not expose repository-creation permissions; this prototype is isolated in its own directory and branch in `AION-AUTONOMOUS/AION` pending a dedicated repository.
