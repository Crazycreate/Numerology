export interface AiSettings {
  provider: string;
  apiKey: string;
  model: string;
  baseURL: string;
}

export const DEFAULT_AI: AiSettings = { provider: "pollinations", apiKey: "", model: "", baseURL: "" };

const LS_KEY = "mingli.ai.v1";

/** 读取浏览器里保存的 AI 设置(随请求发送,服务端不保存)。 */
export function loadAi(): AiSettings {
  if (typeof window === "undefined") return DEFAULT_AI;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (raw) return { ...DEFAULT_AI, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return DEFAULT_AI;
}

export function saveAi(s: AiSettings): void {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}
