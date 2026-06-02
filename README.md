# 命理 · Numerology

**[English](README.en.md) | [中文](README.md)**

> 🔗 **在线体验(免安装、默认免费模型):** https://numerology-web-nine.vercel.app/
> 排盘即时出;AI 解读默认走免费模型,也可在「⚙ AI 设置」填自己的 API key 换更强模型。

AI 辅助的中国命理工具:**八字四柱 + 紫微斗数**。帮助人们了解自己的性格倾向与人生格局,定位为**传统文化 + 自我反思工具**,而非宿命论预测。

## 核心设计原则

> **排盘要"算",解读才"用 AI"。**

- **排盘(起盘)是确定性计算**:公历/农历→干支、节气定月、真太阳时校正、安星、四化、十神、大运起运。有唯一正确答案,绝不交给 LLM。
- **AI 只做解读层**:把结构化命盘 + 命中的规则,合成个性化、可溯源的叙事与对话。

## 功能

- 🧮 **双盘排盘**:八字四柱(十神/藏干/星运/自坐/空亡/神煞/纳音)+ 紫微斗数(十二宫全要素、四化、四套十二神、大限小限、三方四正)
- 🌙 **历法**:公历 / 农历(含闰月)输入;出生地省→市二级联动做**真太阳时校正**
- 🔮 **动静结合解读**:大运流年十神 + 引动喜用神、紫微大限/流年四化飞宫,运为主导
- 📜 **三份 AI 产出**:命盘格局解读、大运流年深析(回看 + 前瞻)、就命盘对话追问;均流式、带 prompt caching
- 🕰️ **时辰推断**:不知出生时辰时,AI 据已知人生事实比对当日 12 时辰命盘反推
- 📄 **导出 PDF**

## 快速开始

### 前置要求

- Node.js **≥ 18.17**
- **AI 解读层默认开箱即用、无需任何 key**:默认连免费在线的 [Pollinations](https://pollinations.ai/),clone 完直接能跑(排盘本就不需要 key)。想要更好的中文质量,再切到免费的 [智谱 GLM-4-Flash](https://open.bigmodel.cn/) 等。详见下方「配置 AI provider」。

### 安装与运行

```bash
# 1. 克隆
git clone https://github.com/Crazycreate/Numerology.git
cd Numerology

# 2. 安装依赖(npm workspaces 单仓)
npm install

# 3. 构建核心包(排盘 + 知识库 + AI 层)
npm run build -w @numerology/knowledge -w @numerology/engine -w @numerology/ai

# 4. 启动 Web —— 默认 Pollinations,无需任何 key 即可出 AI 报告
npm run dev -w @numerology/web
# 打开 http://localhost:3000

# (可选)想换更好的模型:cp .env.example .env,改 AI_PROVIDER 即可
```

### 配置 AI provider

排盘不花钱、不需要 key;只有 **AI 解读 / 对话**走 provider。在 `.env` 用 `AI_PROVIDER` 选一家:

| provider | 费用 | 需要 key | 中文质量 | 说明 / 申请 |
|----------|------|---------|---------|------------|
| `pollinations`(默认) | **免费** | **否** | 一般 | 开箱即用、在线小模型;匿名层会限速、输出偏短 |
| `ollama` | 免费 | 否 | 取决于模型 | 本地运行、不联网;需先装 [Ollama](https://ollama.com/) 并 `ollama pull qwen2.5:32b` |
| `glm` | 免费 | 是 | 强 | 推荐升级项,国内直连:[open.bigmodel.cn](https://open.bigmodel.cn/) → `GLM_API_KEY` |
| `gemini` | 免费额度 | 是 | 不错 | [aistudio.google.com](https://aistudio.google.com/apikey) → `GEMINI_API_KEY` |
| `groq` | 免费 | 是 | 偏弱、极快 | [console.groq.com](https://console.groq.com/keys) → `GROQ_API_KEY` |
| `anthropic` | 付费 | 是 | 最高 | [console.anthropic.com](https://console.anthropic.com/) → `ANTHROPIC_API_KEY` |
| `custom` | 取决于端点 | 看情况 | — | 任意 OpenAI 兼容服务(OpenRouter / DeepSeek / 本地 Ollama 等):`AI_BASE_URL` + `AI_API_KEY` + `AI_MODEL_REPORT`/`AI_MODEL_CHAT` |

切换只改 `.env` 的 `AI_PROVIDER`,代码零改动。可用 `AI_MODEL_REPORT` / `AI_MODEL_CHAT` 覆盖默认模型名。
> 默认的 Pollinations 用的是免费小模型,中文质量一般、输出可能被截短;**想要完整、准确的长篇命理报告,建议切到免费的 `glm`(申请一把 key)或本地 `ollama`。**

### 命令行试跑(可选,验证排盘 + 报告)

```bash
# 出生信息:年 月 日 时 分 性别
node scripts/report-demo.mjs 1990 6 15 14 0 男
```

### 测试

```bash
npm test            # 全部 workspace 测试
```

## 项目结构

```
packages/
  knowledge/   @numerology/knowledge  结构化规则:调候用神 / 格局 / 十神 / 四化(护城河)
  engine/      @numerology/engine     纯 TS:出生信息 → 排双盘 → 标准命盘 JSON(无 UI / 无网络)
  ai/          @numerology/ai         命盘 JSON + 规则 → 上下文包 → AI provider(报告 / 对话 / 时辰推断)
apps/
  web/         @numerology/web        Next.js 前端
```

`engine` 与 `knowledge` 与平台无关,是"先 Web 后小程序"成本最低的关键。

## 技术栈

- **语言/构建**:TypeScript(strict)、npm workspaces
- **排盘库**(成熟开源,不自研):[`iztro`](https://github.com/SylarLong/iztro)(紫微)、[`lunar-javascript`](https://github.com/6tail/lunar-javascript)(八字/历法)
- **AI**:多 provider 可切换(默认免费 GLM-4-Flash;另支持 Gemini / Groq / Claude / 任意 OpenAI 兼容端点)。除 Claude 外统一走 OpenAI 兼容协议;Claude 路径带 prompt caching
- **前端**:Next.js 14 + React 18

## 知识库来源

古籍原文属公有领域(穷通宝鉴 / 滴天髓 / 三命通会 / 紫微斗数全书)。
**蒸馏成结构化规则**,而非原文堆叠做 RAG。详见 [`docs/knowledge-base.md`](docs/knowledge-base.md)。

## 免责声明

本工具仅供**传统文化学习与自我反思**之用。所有解读均为基于命理的**倾向性参考,非宿命预测**,不构成医疗、法律、投资等任何专业建议,决策请以自身判断为准。

## License

MIT
