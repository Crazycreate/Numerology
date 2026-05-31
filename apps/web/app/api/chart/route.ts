import { castChart, analyzeFortune } from "@numerology/engine";
import { parseBirthInput } from "@/lib/birth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 排盘:出生信息 → 八字+紫微双盘 + 动态运势。确定性,不调 AI。 */
export async function POST(req: Request): Promise<Response> {
  try {
    const input = parseBirthInput(await req.json());
    const chart = castChart(input);
    const fortune = analyzeFortune(input, { yearsAhead: 8 });
    return Response.json({ chart, fortune });
  } catch (err) {
    const message = err instanceof Error ? err.message : "排盘失败";
    return Response.json({ error: message }, { status: 400 });
  }
}
