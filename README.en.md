# Numerology · 命理

**[English](README.en.md) | [中文](README.md)**

> 🔗 **Live demo (no install, free model by default):** https://numerology-web-nine.vercel.app/
> Charts cast instantly; AI interpretation uses a free model by default — or paste your own API key under "⚙ AI 设置" to switch to a stronger model.

An AI-assisted Chinese metaphysics tool combining **BaZi (Four Pillars of Destiny)** and **Zi Wei Dou Shu (Purple Star Astrology)**. It helps people understand their personality tendencies and life patterns — positioned as a **cultural & self-reflection tool, not fortune-telling determinism**.

## Core Design Principle

> **Chart casting is computed; only interpretation uses AI.**

- **Chart casting is deterministic computation**: solar/lunar → ganzhi, solar-term month boundaries, true solar time correction, star placement, the Four Transformations (sihua), the Ten Gods (shishen), luck-cycle onset. There is exactly one correct answer — never handed to an LLM.
- **AI only does the interpretation layer**: it synthesizes the structured chart + matched rules into a personalized, traceable narrative and dialogue.

## Features

- 🧮 **Dual chart casting**: BaZi Four Pillars (Ten Gods / hidden stems / twelve life-stages / void / shensha / nayin) + Zi Wei Dou Shu (full 12-palace detail, sihua, four sets of twelve-spirits, decadal/annual ranges, the "three-directions-four-corners" pattern)
- 🌙 **Calendar**: solar / lunar (incl. leap month) input; birthplace province→city picker for **true solar time correction**
- 🔮 **Static + dynamic interpretation**: luck-cycle & annual Ten Gods + favorable-god activation, Zi Wei decadal/annual sihua flying into natal palaces — luck cycles weighted as dominant
- 📜 **Three AI outputs**: chart-pattern reading, deep luck-cycle/annual analysis (retrospective + forward-looking), and chart-based follow-up chat — all streamed, with prompt caching
- 🕰️ **Birth-hour inference**: when the hour is unknown, the AI narrows it down by comparing the day's 12 possible charts against your known life facts
- 📄 **PDF export**

## Quick Start

### Prerequisites

- Node.js **≥ 18.17**
- **The AI layer works out of the box with no key at all**: it defaults to the free, hosted [Pollinations](https://pollinations.ai/), so a fresh clone just runs (chart casting never needs a key). For better Chinese quality, switch to the free [Zhipu GLM-4-Flash](https://open.bigmodel.cn/) etc. See "Configuring the AI provider" below.

### Install & Run

```bash
# 1. Clone
git clone https://github.com/Crazycreate/Numerology.git
cd Numerology

# 2. Install dependencies (npm workspaces monorepo)
npm install

# 3. Build core packages (engine + knowledge + AI)
npm run build -w @numerology/knowledge -w @numerology/engine -w @numerology/ai

# 4. Start the web app — defaults to Pollinations, no key needed for AI reports
npm run dev -w @numerology/web
# Open http://localhost:3000

# (optional) switch to a better model: cp .env.example .env, then change AI_PROVIDER
```

### Configuring the AI provider

Chart casting is free and needs no key; only **AI interpretation / chat** goes through a provider. Pick one in `.env` via `AI_PROVIDER`:

| provider | cost | key needed | Chinese quality | notes / sign up |
|----------|------|-----------|-----------------|-----------------|
| `pollinations` (default) | **free** | **no** | fair | works out of the box, hosted small model; anonymous tier is rate-limited and truncates output |
| `ollama` | free | no | depends on model | runs locally, offline; install [Ollama](https://ollama.com/) then `ollama pull qwen2.5:32b` |
| `glm` | free | yes | strong | recommended upgrade, direct in China: [open.bigmodel.cn](https://open.bigmodel.cn/) → `GLM_API_KEY` |
| `gemini` | free tier | yes | good | [aistudio.google.com](https://aistudio.google.com/apikey) → `GEMINI_API_KEY` |
| `groq` | free | yes | weaker, very fast | [console.groq.com](https://console.groq.com/keys) → `GROQ_API_KEY` |
| `anthropic` | paid | yes | highest | [console.anthropic.com](https://console.anthropic.com/) → `ANTHROPIC_API_KEY` |
| `custom` | depends | maybe | — | any OpenAI-compatible endpoint (OpenRouter / DeepSeek / local Ollama …): `AI_BASE_URL` + `AI_API_KEY` + `AI_MODEL_REPORT`/`AI_MODEL_CHAT` |

Switching only changes `AI_PROVIDER` in `.env` — zero code changes. Use `AI_MODEL_REPORT` / `AI_MODEL_CHAT` to override default model names.
> The default Pollinations uses a free small model — fair Chinese, possibly truncated output. **For full, accurate long-form readings, switch to the free `glm` (grab one key) or local `ollama`.**

### CLI demo (optional — verify casting + report)

```bash
# birth info: year month day hour minute gender(男/女)
node scripts/report-demo.mjs 1990 6 15 14 0 男
```

### Tests

```bash
npm test            # all workspace tests
```

## Project Structure

```
packages/
  knowledge/   @numerology/knowledge  Structured rules: climate-adjusting gods / patterns / Ten Gods / sihua (the moat)
  engine/      @numerology/engine     Pure TS: birth info → dual chart → standard chart JSON (no UI / no network)
  ai/          @numerology/ai         Chart JSON + rules → context pack → AI provider (report / chat / hour inference)
apps/
  web/         @numerology/web        Next.js frontend
```

`engine` and `knowledge` are platform-agnostic — the key to a low-cost "web first, mini-program later" path.

## Tech Stack

- **Language/build**: TypeScript (strict), npm workspaces
- **Casting libraries** (battle-tested, not hand-rolled): [`iztro`](https://github.com/SylarLong/iztro) (Zi Wei), [`lunar-javascript`](https://github.com/6tail/lunar-javascript) (BaZi / calendar)
- **AI**: pluggable providers (defaults to free GLM-4-Flash; also Gemini / Groq / Claude / any OpenAI-compatible endpoint). All but Claude go through the OpenAI-compatible protocol; the Claude path adds prompt caching
- **Frontend**: Next.js 14 + React 18

## Knowledge Base

The classical source texts are public domain (Qiong Tong Bao Jian / Di Tian Sui / San Ming Tong Hui / Zi Wei Dou Shu Quan Shu). They are **distilled into structured rules**, not dumped as raw text for RAG. See [`docs/knowledge-base.md`](docs/knowledge-base.md).

## Disclaimer

This tool is for **cultural learning and self-reflection only**. All interpretations are **tendency-based references, not destiny predictions**, and do not constitute medical, legal, financial, or any other professional advice. Make your own decisions.

## License

MIT
