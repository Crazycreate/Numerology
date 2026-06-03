import { castChart, analyzeFortune } from "@numerology/engine";
import { streamFortuneReport, streamFortuneSection } from "@numerology/ai";
import { parseBirthInput } from "@/lib/birth";
import { ensureEnv } from "@/lib/env";
import { streamToResponse } from "@/lib/stream";
import { parseAi } from "@/lib/aiOpts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** 流式生成《大运流年深析》(八字 × 紫微合参,逐步逐年)。 */
export async function POST(req: Request): Promise<Response> {
  try {
    ensureEnv();
    const body = (await req.json()) as { input?: unknown; ai?: unknown; section?: unknown; lens?: unknown };
    const input = parseBirthInput(body.input);
    const chart = castChart(input);
    const fortune = analyzeFortune(input, { yearsBack: 5, yearsAhead: 8 });
    const ai = parseAi(body);
    const section = typeof body.section === "string" && body.section.trim() ? body.section.trim() : undefined;
    const lens = body.lens === "bazi" || body.lens === "ziwei" ? body.lens : "both";
    // section 存在 → 只生成该节(分段模式,每节 <60s);缺省 → 整篇(CLI 兼容)。
    const stream = section
      ? streamFortuneSection(chart, section, { fortune, ai, lens })
      : streamFortuneReport(chart, { fortune, ai });
    return streamToResponse(stream);
  } catch (err) {
    const message = err instanceof Error ? err.message : "大运流年深析生成失败";
    return Response.json({ error: message }, { status: 400 });
  }
}
