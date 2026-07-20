# Sub Value

**What each AI coding subscription is worth at public API rates.**

Live comparison of sticker price vs **API-equivalent** dollars for Claude, ChatGPT/Codex, SuperGrok / Grok Build, and related plans.

- Primary source for Anthropic & OpenAI: **[SemiAnalysis](https://x.com/SemiAnalysis_/status/2064815044085318040)** drain experiment (June 2026)
- Grok / SuperGrok: reverse-engineered ranges (low confidence — xAI does not publish pool $)

## Headline SemiAnalysis ceilings

| Plan | You pay | API-equivalent (full use) | Multiplier |
|------|--------:|--------------------------:|-----------:|
| Claude Pro | $20 | $400 | 20× |
| Claude Max 5× | $100 | $2,000 | 20× |
| Claude Max 20× | $200 | $8,000 | 40× |
| ChatGPT Plus | $20 | $700 | 35× |
| ChatGPT Pro 5× | $100 | $3,500 | 35× |
| ChatGPT Pro 20× | $200 | $14,000 | 70× |

These are **ceilings at full weekly utilization** with continuous coding tasks — not typical user spend.

Also includes lower-confidence rows for **SuperGrok / Grok Build**, **Gemini**, **Cursor**, and **GitHub Copilot** (pass-through credit products ≈ 1–2× sticker).

## Run locally

```bash
# any static server
python3 -m http.server 8080
# open http://localhost:8080
```

Or open `index.html` via a local server (ES modules + `fetch` need a server, not `file://`).

## Data

All plan numbers live in [`data/plans.json`](data/plans.json). Edit that file to update the site — no build step.

## Disclaimer

Not affiliated with SemiAnalysis, Anthropic, OpenAI, or xAI. API list prices and plan limits change. “API-equivalent” is not the same as a lab’s marginal cost of serving subscription traffic.

## License

MIT
