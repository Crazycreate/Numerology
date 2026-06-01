import type { ProviderOptions } from "@numerology/ai";

/** 从请求体解析 BYOK 设置(用户自带 provider/key);仅透传、不落库、不记日志。 */
export function parseAi(body: unknown): ProviderOptions | undefined {
  const ai = (body as { ai?: Record<string, unknown> } | null)?.ai;
  if (!ai || typeof ai !== "object") return undefined;
  const s = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
  const opts: ProviderOptions = {
    provider: s(ai.provider),
    apiKey: s(ai.apiKey),
    model: s(ai.model),
    baseURL: s(ai.baseURL),
  };
  return opts.provider || opts.apiKey || opts.model || opts.baseURL ? opts : undefined;
}
