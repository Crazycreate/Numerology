import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

/**
 * 多 provider 解读层:排盘永远本地确定性计算、不花钱;只有 AI 解读/对话走这里。
 * 通过 AI_PROVIDER 环境变量切换。默认 glm(智谱 GLM-4-Flash,完全免费),
 * 也可用 gemini / groq / anthropic / custom(任意 OpenAI 兼容端点)。
 *
 * 设计:除 Anthropic 外都走 OpenAI 兼容协议(同一段代码),靠 baseURL + 模型名区分。
 */

/** system 由若干文本块组成;cache:true 的块在 Anthropic 上打 prompt cache,其它 provider 忽略。 */
export interface SystemBlock {
  text: string;
  cache?: boolean;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Usage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
}

export type ModelKind = "report" | "chat";

export interface CompletionRequest {
  /** report → 选更强模型;chat → 选更快模型 */
  kind: ModelKind;
  system: SystemBlock[];
  messages: ChatMessage[];
  maxTokens: number;
}

/** 按请求覆盖 provider/key(BYOK):任一缺省则回落到环境变量/默认。 */
export interface ProviderOptions {
  provider?: string;
  apiKey?: string;
  model?: string;
  baseURL?: string;
}

interface ProviderDef {
  kind: "anthropic" | "openai";
  label: string;
  /** 依次尝试的环境变量名,第一个有值的作为 API key */
  keys: string[];
  baseURL?: string;
  models: Record<ModelKind, string>;
  /** 免费申请地址(报错时提示用户) */
  signup?: string;
  /** 是否免费额度 */
  free: boolean;
  /** 本地/无需 API key(如 Ollama):缺 key 不报错,传占位符即可 */
  noKey?: boolean;
}

const PROVIDERS: Record<string, ProviderDef> = {
  pollinations: {
    kind: "openai",
    label: "Pollinations(免费·免 key·开箱即用)",
    keys: ["POLLINATIONS_TOKEN"],
    baseURL: process.env.POLLINATIONS_BASE_URL || "https://text.pollinations.ai/openai",
    models: { report: "openai", chat: "openai" },
    signup: "https://pollinations.ai/",
    free: true,
    noKey: true,
  },
  ollama: {
    kind: "openai",
    label: "本地 Ollama(免费·无需 key)",
    keys: ["OLLAMA_API_KEY"],
    baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1",
    models: { report: "qwen2.5:32b", chat: "qwen2.5:32b" },
    signup: "https://ollama.com/download",
    free: true,
    noKey: true,
  },
  glm: {
    kind: "openai",
    label: "智谱 GLM-4-Flash(免费)",
    keys: ["GLM_API_KEY", "ZHIPU_API_KEY"],
    baseURL: "https://open.bigmodel.cn/api/paas/v4",
    models: { report: "glm-4-flash", chat: "glm-4-flash" },
    signup: "https://open.bigmodel.cn/",
    free: true,
  },
  gemini: {
    kind: "openai",
    label: "Google Gemini 2.0 Flash(免费额度)",
    keys: ["GEMINI_API_KEY", "GOOGLE_API_KEY"],
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    models: { report: "gemini-2.0-flash", chat: "gemini-2.0-flash" },
    signup: "https://aistudio.google.com/apikey",
    free: true,
  },
  groq: {
    kind: "openai",
    label: "Groq Llama-3.3-70B(免费)",
    keys: ["GROQ_API_KEY"],
    baseURL: "https://api.groq.com/openai/v1",
    models: { report: "llama-3.3-70b-versatile", chat: "llama-3.3-70b-versatile" },
    signup: "https://console.groq.com/keys",
    free: true,
  },
  anthropic: {
    kind: "anthropic",
    label: "Anthropic Claude(付费)",
    keys: ["ANTHROPIC_API_KEY"],
    models: { report: "claude-opus-4-8", chat: "claude-sonnet-4-6" },
    signup: "https://console.anthropic.com/",
    free: false,
  },
};

// 默认免 key 在线模型,开箱即用(别人 clone 即可跑;想要更好中文质量再切 glm 等)。
const DEFAULT_PROVIDER = "pollinations";

/** 当前生效的 provider 名(小写)。opts 可按请求覆盖(BYOK)。 */
export function activeProviderName(opts?: ProviderOptions): string {
  const name = (opts?.provider || process.env.AI_PROVIDER || DEFAULT_PROVIDER).trim().toLowerCase();
  if (name !== "custom" && !PROVIDERS[name]) {
    throw new Error(`未知 AI provider="${name}"。可选:${Object.keys(PROVIDERS).join(" / ")} / custom`);
  }
  return name;
}

function resolveDef(name: string, opts?: ProviderOptions): ProviderDef {
  if (name === "custom") {
    const baseURL = opts?.baseURL || process.env.AI_BASE_URL;
    if (!baseURL) throw new Error("custom 需要 baseURL(任意 OpenAI 兼容端点)");
    const model = opts?.model || process.env.AI_MODEL_REPORT || process.env.AI_MODEL_CHAT;
    if (!model) throw new Error("custom 需要模型名(model)");
    return {
      kind: "openai",
      label: `自定义(${baseURL})`,
      keys: ["AI_API_KEY"],
      baseURL,
      models: { report: model, chat: model },
      free: false,
      noKey: !(opts?.apiKey || process.env.AI_API_KEY),
    };
  }
  const def = PROVIDERS[name]!;
  return opts?.baseURL ? { ...def, baseURL: opts.baseURL } : def;
}

function apiKeyFor(def: ProviderDef, opts?: ProviderOptions): string {
  if (opts?.apiKey && opts.apiKey.trim()) return opts.apiKey.trim();
  for (const k of def.keys) {
    const v = process.env[k];
    if (v && v.trim()) return v.trim();
  }
  if (def.noKey) return "not-needed";
  throw new Error(
    `缺少 ${def.label} 的 API key。请在设置里填入,或在 .env 配置 ${def.keys[0]}` +
      (def.signup ? `(申请:${def.signup})` : ""),
  );
}

function modelFor(def: ProviderDef, kind: ModelKind, opts?: ProviderOptions): string {
  if (opts?.model && opts.model.trim()) return opts.model.trim();
  const override = kind === "report" ? process.env.AI_MODEL_REPORT : process.env.AI_MODEL_CHAT;
  return (override && override.trim()) || def.models[kind];
}

/** 给前端/日志看的一行摘要,不含任何 key。 */
export function providerSummary(opts?: ProviderOptions): string {
  const name = activeProviderName(opts);
  const def = resolveDef(name, opts);
  return `${name}(${def.label}) · report=${modelFor(def, "report", opts)} · chat=${modelFor(def, "chat", opts)}`;
}

const TIMEOUT = 15 * 60 * 1000;
function makeAnthropic(apiKey: string): Anthropic {
  return new Anthropic({ apiKey, timeout: TIMEOUT, maxRetries: 2 });
}
function makeOpenAI(apiKey: string, baseURL?: string): OpenAI {
  return new OpenAI({ apiKey, baseURL, timeout: TIMEOUT, maxRetries: 2 });
}

// ── Anthropic 适配 ────────────────────────────────────────────────────────
function toAnthropicSystem(system: SystemBlock[]): Anthropic.TextBlockParam[] {
  return system.map((b) =>
    b.cache
      ? { type: "text", text: b.text, cache_control: { type: "ephemeral" } }
      : { type: "text", text: b.text },
  );
}

function fromAnthropicUsage(u: Anthropic.Usage): Usage {
  return {
    inputTokens: u.input_tokens,
    outputTokens: u.output_tokens,
    cacheCreationTokens: u.cache_creation_input_tokens ?? 0,
    cacheReadTokens: u.cache_read_input_tokens ?? 0,
  };
}

// ── OpenAI 兼容适配 ───────────────────────────────────────────────────────
function toOpenAIMessages(
  system: SystemBlock[],
  messages: ChatMessage[],
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const systemText = system.map((b) => b.text).join("\n\n");
  return [
    { role: "system", content: systemText },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];
}

function fromOpenAIUsage(u: OpenAI.Completions.CompletionUsage | undefined): Usage {
  return {
    inputTokens: u?.prompt_tokens ?? 0,
    outputTokens: u?.completion_tokens ?? 0,
    cacheCreationTokens: 0,
    cacheReadTokens: 0,
  };
}

// ── 统一文本流接口(与 Anthropic MessageStream 的最小子集一致,web 端零改动) ──
export interface TextStream {
  on(event: "text", listener: (delta: string) => void): unknown;
  on(event: "error", listener: (err: unknown) => void): unknown;
  finalMessage(): Promise<unknown>;
  abort(): void;
}

type OpenAIChunkStream = AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;

/** 把 OpenAI 兼容的流式响应包成 Anthropic 风格的事件流。懒启动:首次 finalMessage() 才真正请求。 */
class OpenAITextStream implements TextStream {
  private textListeners: ((d: string) => void)[] = [];
  private errorListeners: ((e: unknown) => void)[] = [];
  private buffered: string[] = [];
  private fullText = "";
  private done: Promise<{ text: string }> | null = null;
  private aborter = new AbortController();

  constructor(private readonly open: (signal: AbortSignal) => Promise<OpenAIChunkStream>) {}

  on(event: "text" | "error", listener: (arg: never) => void): this {
    if (event === "text") {
      this.textListeners.push(listener as (d: string) => void);
      if (this.buffered.length) {
        for (const b of this.buffered) (listener as (d: string) => void)(b);
        this.buffered = [];
      }
    } else {
      this.errorListeners.push(listener as (e: unknown) => void);
    }
    return this;
  }

  private emitText(delta: string): void {
    this.fullText += delta;
    if (this.textListeners.length === 0) {
      this.buffered.push(delta);
    } else {
      for (const l of this.textListeners) l(delta);
    }
  }

  finalMessage(): Promise<{ text: string }> {
    if (!this.done) this.done = this.run();
    return this.done;
  }

  private async run(): Promise<{ text: string }> {
    try {
      const stream = await this.open(this.aborter.signal);
      for await (const chunk of stream) {
        const delta = chunk.choices?.[0]?.delta?.content;
        if (delta) this.emitText(delta);
      }
      return { text: this.fullText };
    } catch (err) {
      for (const l of this.errorListeners) l(err);
      throw err;
    }
  }

  abort(): void {
    this.aborter.abort();
  }
}

// ── 对外统一入口 ──────────────────────────────────────────────────────────

/** 非流式补全。opts 可传 BYOK(用户自带 provider/key)。 */
export async function chatComplete(
  req: CompletionRequest,
  opts?: ProviderOptions,
): Promise<{ text: string; usage: Usage }> {
  const name = activeProviderName(opts);
  const def = resolveDef(name, opts);
  const apiKey = apiKeyFor(def, opts);
  if (def.kind === "anthropic") {
    const res = await makeAnthropic(apiKey).messages.create({
      model: modelFor(def, req.kind, opts),
      max_tokens: req.maxTokens,
      system: toAnthropicSystem(req.system),
      messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
    });
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    return { text, usage: fromAnthropicUsage(res.usage) };
  }
  const res = await makeOpenAI(apiKey, def.baseURL).chat.completions.create({
    model: modelFor(def, req.kind, opts),
    max_tokens: req.maxTokens,
    messages: toOpenAIMessages(req.system, req.messages),
  });
  return {
    text: res.choices?.[0]?.message?.content ?? "",
    usage: fromOpenAIUsage(res.usage),
  };
}

/** 流式补全。opts 可传 BYOK。返回 Anthropic 风格事件流,供 web 端逐字渲染。 */
export function chatStream(req: CompletionRequest, opts?: ProviderOptions): TextStream {
  const name = activeProviderName(opts);
  const def = resolveDef(name, opts);
  const apiKey = apiKeyFor(def, opts);
  if (def.kind === "anthropic") {
    return makeAnthropic(apiKey).messages.stream({
      model: modelFor(def, req.kind, opts),
      max_tokens: req.maxTokens,
      system: toAnthropicSystem(req.system),
      messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
    }) as unknown as TextStream;
  }
  const client = makeOpenAI(apiKey, def.baseURL);
  const model = modelFor(def, req.kind, opts);
  const messages = toOpenAIMessages(req.system, req.messages);
  return new OpenAITextStream((signal) =>
    client.chat.completions.create({ model, max_tokens: req.maxTokens, stream: true, messages }, { signal }),
  );
}
