import { castChart, analyzeFortune } from "@numerology/engine";
import { streamReport, streamReportSection } from "@numerology/ai";
import { parseBirthInput } from "@/lib/birth";
import { ensureEnv } from "@/lib/env";
import { streamToResponse } from "@/lib/stream";
import { parseAi } from "@/lib/aiOpts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** 流式生成命盘解读报告(动静结合)。 */
export async function POST(req: Request): Promise<Response> {
  try {
    ensureEnv();
    const body = (await req.json()) as { input?: unknown; ai?: unknown; section?: unknown };
    const input = parseBirthInput(body.input);
    const chart = castChart(input);
    const fortune = analyzeFortune(input, { yearsBack: 5, yearsAhead: 8 });
    const ai = parseAi(body);
    const section = typeof body.section === "string" && body.section.trim() ? body.section.trim() : undefined;
    // section 存在 → 只生成该节(分段模式,每节 <60s,绕开 Vercel 函数上限);缺省 → 整篇(CLI 兼容)。
    const stream = section
      ? streamReportSection(chart, section, { fortune, ai })
      : streamReport(chart, { fortune, ai });
    return streamToResponse(stream);
  } catch (err) {
    const message = err instanceof Error ? err.message : "报告生成失败";
    return Response.json({ error: message }, { status: 400 });
  }
}
