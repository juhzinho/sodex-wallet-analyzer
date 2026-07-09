# SoDEX Wallet Analyzer

Analyse any SoDEX mainnet wallet — volume, PnL, fees, win rate, campaign metrics and more.

## Stack

- **Next.js 15** (App Router)
- **React 19**
- **Tailwind CSS**
- **Recharts** + **Framer Motion**
- **Vitest** for unit tests

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Share a wallet analysis

```
http://localhost:3000/?wallet=0xYourAddressHere
```

## Scripts

| Command           | Description              |
|-------------------|--------------------------|
| `npm run dev`     | Development server       |
| `npm run build`   | Production build         |
| `npm run start`   | Production server        |
| `npm run lint`    | ESLint (Next.js rules)   |
| `npm run test`    | Run unit tests           |

## Environment variables

Copy `.env.example` to `.env.local`:

| Variable | Default | Description |
|----------|---------|-------------|
| `SODEX_PERPS_BASE` | mainnet perps URL | Override SoDEX perps gateway |
| `SODEX_SPOT_BASE` | mainnet spot URL | Override SoDEX spot gateway |
| `SODEX_FETCH_FUNDING` | `false` | Fetch funding history (slower) |
| `ANALYSIS_CACHE_TTL_MS` | `300000` | Server cache TTL (5 min) |
| `RATE_LIMIT_PER_MINUTE` | `10` | Max analyses per IP/min |

## Architecture

```
app/api/analyze/[address]/route.ts   SSE stream + cache + rate limit
services/sodex/api.ts                SoDEX HTTP client (pagination, retries)
services/sodex/analyzer.ts           Metrics, charts, position reconstruction
lib/analysis-cache.ts                In-memory TTL cache
lib/rate-limit.ts                    Per-IP request throttling
components/                          UI (dashboard, charts, tables)
lib/i18n.ts                          en / pt-BR / es translations
```

## Performance

- **Metrics and charts** are computed from the full trade history server-side.
- **SSE payload** is capped (2 000 perps trades, 1 000 spot, 500 positions) to keep responses fast for heavy wallets.
- **Repeated lookups** within the cache TTL return instantly from server memory.

## Languages

English, Português (BR) and Español.
