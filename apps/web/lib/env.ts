import { readFileSync } from "node:fs";
import { join } from "node:path";

let loaded = false;

/**
 * 把仓库根目录 .env 里的变量灌进 process.env(只灌尚未设置的)。
 * 多 provider:不同 provider 用不同 key(GLM_API_KEY / GEMINI_API_KEY / GROQ_API_KEY /
 * ANTHROPIC_API_KEY 等),所以这里不针对单一 key 早退,统一加载即可;
 * 具体 provider 的 key 缺失会在解读层(@numerology/ai)调用时给出明确报错。
 * 仅服务端调用。
 */
export function ensureEnv(): void {
  if (loaded) return;
  loaded = true;

  const candidates = [
    join(process.cwd(), ".env"),
    join(process.cwd(), "..", "..", ".env"),
  ];
  for (const path of candidates) {
    try {
      const raw = readFileSync(path, "utf-8");
      for (const line of raw.split("\n")) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && m[1] && !process.env[m[1]]) {
          process.env[m[1]] = m[2]!.replace(/^["']|["']$/g, "");
        }
      }
    } catch {
      /* 该路径无 .env,继续尝试下一个 */
    }
  }
}
