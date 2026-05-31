# 命理 · Numerology

**[English](README.en.md) | [中文](README.md)**

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
- 一个 [Anthropic API Key](https://console.anthropic.com/)(用于 AI 解读层;仅排盘可不需要)

### 安装与运行

```bash
# 1. 克隆
git clone https://github.com/Crazycreate/Numerology.git
cd Numerology

# 2. 安装依赖(npm workspaces 单仓)
npm install

# 3. 配置密钥
cp .env.example .env
# 编辑 .env,填入 ANTHROPIC_API_KEY=sk-ant-...

# 4. 构建核心包(排盘 + 知识库 + AI 层)
npm run build -w @numerology/knowledge -w @numerology/engine -w @numerology/ai

# 5. 启动 Web
npm run dev -w @numerology/web
# 打开 http://localhost:3000
```

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
  ai/          @numerology/ai         命盘 JSON + 规则 → 上下文包 → Claude(报告 / 对话 / 时辰推断)
apps/
  web/         @numerology/web        Next.js 前端
```

`engine` 与 `knowledge` 与平台无关,是"先 Web 后小程序"成本最低的关键。

## 技术栈

- **语言/构建**:TypeScript(strict)、npm workspaces
- **排盘库**(成熟开源,不自研):[`iztro`](https://github.com/SylarLong/iztro)(紫微)、[`lunar-javascript`](https://github.com/6tail/lunar-javascript)(八字/历法)
- **AI**:[`@anthropic-ai/sdk`](https://github.com/anthropics/anthropic-sdk-typescript),报告用 Opus、对话用 Sonnet,带 prompt caching
- **前端**:Next.js 14 + React 18

## 知识库来源

古籍原文属公有领域(穷通宝鉴 / 滴天髓 / 三命通会 / 紫微斗数全书)。
**蒸馏成结构化规则**,而非原文堆叠做 RAG。详见 [`docs/knowledge-base.md`](docs/knowledge-base.md)。

## 免责声明

本工具仅供**传统文化学习与自我反思**之用。所有解读均为基于命理的**倾向性参考,非宿命预测**,不构成医疗、法律、投资等任何专业建议,决策请以自身判断为准。

## License

MIT
