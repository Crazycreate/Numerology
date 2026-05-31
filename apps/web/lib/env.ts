import { readFileSync } from "node:fs";
import { join } from "node:path";

let loaded = false;

/**
 * 确保 ANTHROPIC_API_KEY 等环境变量就绪。
 * 优先用进程已有的环境变量;否则尝试从仓库根目录的 .env 读取(复用同一把 key)。
 * 仅服务端调用。
 */
export function ensureEnv(): void {
  if (loaded) return;
  loaded = true;
  if (process.env.ANTHROPIC_API_KEY) return;

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
      if (process.env.ANTHROPIC_API_KEY) return;
    } catch {
      /* 该路径无 .env,继续尝试下一个 */
    }
  }
}
