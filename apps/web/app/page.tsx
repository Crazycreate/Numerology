"use client";

import { useState } from "react";
import type { BirthInput, ChartResult } from "@numerology/engine";
import type { BirthFormValue } from "@/lib/formTypes";
import { BirthForm } from "@/components/BirthForm";
import { ZiweiBoard } from "@/components/ZiweiBoard";
import { BaziTable } from "@/components/BaziTable";
import { BaziDetail } from "@/components/BaziDetail";
import { StreamedReport } from "@/components/StreamedReport";
import { ChatPanel } from "@/components/ChatPanel";
import { TimeInferPanel } from "@/components/TimeInferPanel";
import { SettingsPanel } from "@/components/SettingsPanel";

type Mode = "known" | "infer";

// 分段并行:key 对应引擎 REPORT_SEGMENTS / FORTUNE_SEGMENTS,各节 <60s 绕开 Vercel 函数上限。
const REPORT_SEGS = [
  { key: "personality", label: "性格特质" },
  { key: "career", label: "事业方向" },
  { key: "wealth", label: "财富特点" },
  { key: "relationship", label: "感情婚姻" },
  { key: "health", label: "健康提示" },
  { key: "luck", label: "大运流年概览" },
  { key: "advice", label: "总体建议 · 开运参考" },
] as const;

const FORTUNE_SEGS = [
  { key: "overview", label: "一、当前总览" },
  { key: "dayun", label: "二、大运逐步精讲" },
  { key: "review", label: "三、回看校准" },
  { key: "future", label: "四、未来流年走向" },
  { key: "rhythm", label: "五、节奏与转折" },
  { key: "action", label: "六、行动建议" },
] as const;

export default function Home() {
  const [mode, setMode] = useState<Mode>("known");
  const [input, setInput] = useState<BirthInput | null>(null);
  const [chart, setChart] = useState<ChartResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (birth: BirthFormValue) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(birth),
      });
      const data = (await res.json()) as { chart?: ChartResult; error?: string };
      if (!res.ok || !data.chart) throw new Error(data.error ?? "排盘失败");
      setChart(data.chart);
      // 用服务端解析后的阳历输入(农历已转换),供后续报告/对话复用
      setInput(data.chart.input);
    } catch (e) {
      setError(e instanceof Error ? e.message : "排盘失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shell">
      <header className="masthead">
        <div className="seal">命</div>
        <h1>命 理</h1>
        <div className="sub">八 字 · 紫 微 · 合 参</div>
      </header>

      <div className="mode-switch">
        <button className={mode === "known" ? "active" : ""} onClick={() => setMode("known")}>
          我知道出生时辰
        </button>
        <button className={mode === "infer" ? "active" : ""} onClick={() => setMode("infer")}>
          不知道时辰 · AI 帮我推断
        </button>
      </div>

      {mode === "infer" ? (
        <TimeInferPanel
          onAdopt={(birth) => { setMode("known"); onSubmit(birth); }}
        />
      ) : (
        <BirthForm loading={loading} onSubmit={onSubmit} />
      )}

      <SettingsPanel />

      {error ? <p className="notice" style={{ textAlign: "center" }}>{error}</p> : null}

      {mode === "known" && chart && input ? (
        <div className="cross-flow">
          {/* 汇流·并置带:八字 ⇄ 紫微,同源合参 */}
          <div className="flow-systems">
            <div className="sys sys-a">
              <span className="sys-tag">八字</span>
              <span className="sys-sub">四柱 · 先天干支</span>
            </div>
            <div className="flow-x" aria-hidden>⇄</div>
            <div className="sys sys-b">
              <span className="sys-tag">紫微</span>
              <span className="sys-sub">星盘 · 十二宫</span>
            </div>
            <div className="flow-moment">同 一 出 生 时 刻 · 双 盘 合 参</div>
          </div>

          <div className="card" style={{ marginTop: "var(--space)" }}>
            <h2 className="section-title"><span className="sys-chip is-b">紫微</span>斗数命盘 · 中宫纳四柱</h2>
            <ZiweiBoard
              ziwei={chart.ziwei}
              center={<BaziTable bazi={chart.bazi} ziwei={chart.ziwei} />}
            />
            <p className="muted" style={{ marginTop: "0.8rem" }}>
              {chart.input.year}-{chart.input.month}-{chart.input.day}{" "}
              {String(chart.input.hour).padStart(2, "0")}:
              {String(chart.input.minute ?? 0).padStart(2, "0")} {chart.input.gender} ·{" "}
              {chart.bazi.lunarDate} ·{" "}
              {chart.meta.trueSolarTimeApplied
                ? `已按经度 ${chart.meta.correction?.longitude}° 做真太阳时校正(偏移 ${chart.meta.correction?.offsetMinutes} 分)`
                : "未做真太阳时校正"}
            </p>
            <p className="muted">
              每宫底部:大限岁数 · 长生十二神 · 博士十二神 · 将前/岁前十二神;命宫朱底、身宫描金。
            </p>
          </div>

          <div style={{ marginTop: "var(--space)" }}>
            <BaziDetail bazi={chart.bazi} />
          </div>

          {/* 汇流箭头:两盘 → 合参解读 */}
          <div className="flow-funnel" aria-hidden>
            <span className="ff-a" />
            <span className="ff-b" />
          </div>

          {/* 高潮:八字 × 紫微 合参解读 */}
          <div className="synthesis">
            <div className="synthesis-head">
              <span className="dot" />
              <h2>合参解读 · 八字 × 紫微</h2>
              <span className="who">两套体系相互印证 · 分歧如实标注</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space)" }}>
            <StreamedReport
              input={input}
              endpoint="/api/report"
              title="命盘格局解读"
              description="整合八字与紫微、判定命宫三方四正格局,刻画性格 / 事业 / 财富 / 感情 / 健康(先天底色)。分节并行生成,逐节就位。"
              buttonLabel="生成格局解读"
              segments={REPORT_SEGS}
            />
            <StreamedReport
              input={input}
              endpoint="/api/fortune"
              title="大运流年深析 · 八字 × 紫微合参"
              description="专题深入分析「运」的走向——这是命理的精华:逐步大运 + 逐年流年,八字十神/引动用神与紫微大限/流年四化全程合参,给出到年份的节奏与建议。分节并行生成,详实优先。"
              buttonLabel="生成大运流年深析"
              segments={FORTUNE_SEGS}
            />
            <ChatPanel input={input} />
            </div>
          </div>
        </div>
      ) : null}

      <p className="disclaimer">
        本工具为传统文化与自我反思用途,所有结论均为倾向性参考,非宿命预测,决策权始终在你自己手中。<br />
        涉及健康请以专业医疗意见为准;涉及财务请自行评估,不构成投资建议。
      </p>
    </div>
  );
}
