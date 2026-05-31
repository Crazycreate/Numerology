# Numerology · 命理

**[English](README.en.md) | [中文](README.md)**

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
- An [Anthropic API key](https://console.anthropic.com/) (for the AI layer; chart casting alone doesn't need it)

### Install & Run

```bash
# 1. Clone
git clone https://github.com/Crazycreate/Numerology.git
cd Numerology

# 2. Install dependencies (npm workspaces monorepo)
npm install

# 3. Configure the key
cp .env.example .env
# Edit .env and set ANTHROPIC_API_KEY=sk-ant-...

# 4. Build core packages (engine + knowledge + AI)
npm run build -w @numerology/knowledge -w @numerology/engine -w @numerology/ai

# 5. Start the web app
npm run dev -w @numerology/web
# Open http://localhost:3000
```

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
  ai/          @numerology/ai         Chart JSON + rules → context pack → Claude (report / chat / hour inference)
apps/
  web/         @numerology/web        Next.js frontend
```

`engine` and `knowledge` are platform-agnostic — the key to a low-cost "web first, mini-program later" path.

## Tech Stack

- **Language/build**: TypeScript (strict), npm workspaces
- **Casting libraries** (battle-tested, not hand-rolled): [`iztro`](https://github.com/SylarLong/iztro) (Zi Wei), [`lunar-javascript`](https://github.com/6tail/lunar-javascript) (BaZi / calendar)
- **AI**: [`@anthropic-ai/sdk`](https://github.com/anthropics/anthropic-sdk-typescript) — Opus for reports, Sonnet for chat, with prompt caching
- **Frontend**: Next.js 14 + React 18

## Knowledge Base

The classical source texts are public domain (Qiong Tong Bao Jian / Di Tian Sui / San Ming Tong Hui / Zi Wei Dou Shu Quan Shu). They are **distilled into structured rules**, not dumped as raw text for RAG. See [`docs/knowledge-base.md`](docs/knowledge-base.md).

## Disclaimer

This tool is for **cultural learning and self-reflection only**. All interpretations are **tendency-based references, not destiny predictions**, and do not constitute medical, legal, financial, or any other professional advice. Make your own decisions.

## License

MIT
