"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { BirthInput } from "@numerology/engine";
import { streamPost } from "@/lib/streamClient";
import { printReport } from "@/lib/exportPdf";
import { loadAi } from "@/lib/aiSettings";

/** 分段定义:key 对应引擎 REPORT_SEGMENTS / FORTUNE_SEGMENTS,label 用于占位标题。 */
export interface ReportSeg {
  key: string;
  label: string;
}

interface Props {
  input: BirthInput;
  endpoint: string;
  title: string;
  description: string;
  buttonLabel: string;
  /** 传入则启用「分段并行」:各节并发请求、按序就位,绕开 Vercel 60s 上限。不传则整篇一次生成。 */
  segments?: readonly ReportSeg[];
}

type State = "idle" | "streaming" | "done" | "error";

/** 通用流式报告卡:点按钮 → 调指定 endpoint → 逐字渲染 Markdown。支持分段并行。 */
export function StreamedReport({ input, endpoint, title, description, buttonLabel, segments }: Props) {
  const [text, setText] = useState("");
  const [state, setState] = useState<State>("idle");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState("");
  const startedFor = useRef<string>("");
  const proseRef = useRef<HTMLDivElement>(null);

  const exportPdf = () => {
    const html = proseRef.current?.innerHTML;
    if (!html) return;
    const d = input;
    const meta = `${d.year}-${d.month}-${d.day} ${String(d.hour).padStart(2, "0")}:${String(d.minute ?? 0).padStart(2, "0")} ${d.gender}`;
    printReport(title, html, meta);
  };

  const key = JSON.stringify(input);
  if (startedFor.current && startedFor.current !== key && state !== "streaming") {
    startedFor.current = "";
    if (text) setText("");
    if (progress) setProgress(null);
    if (state !== "idle") setState("idle");
  }

  // 按固定顺序拼接各节;未到/吐空/失败的节给占位,保证顺序与可读性。
  const combine = (segs: readonly ReportSeg[], slots: Slot[]): string =>
    segs
      .map((seg, i) => {
        const sl = slots[i];
        if (sl.text.trim()) return sl.text;
        if (sl.status === "error") return `## ${seg.label}\n\n_(本节生成失败:${sl.err})_`;
        if (sl.status === "done") return `## ${seg.label}\n\n_(当前模型未给出本节内容)_`;
        return `## ${seg.label}\n\n_(生成中…)_`;
      })
      .join("\n\n");

  const generateSegmented = async (segs: readonly ReportSeg[]) => {
    setError("");
    setText("");
    setState("streaming");
    startedFor.current = key;
    const ai = loadAi();
    const slots: Slot[] = segs.map(() => ({ text: "", status: "streaming", err: "" }));
    setProgress({ done: 0, total: segs.length });
    setText(combine(segs, slots));
    let settled = 0;
    const bump = () => setProgress({ done: ++settled, total: segs.length });

    await Promise.all(
      segs.map((seg, i) =>
        streamPost(endpoint, { input, ai, section: seg.key }, (full) => {
          slots[i] = { ...slots[i], text: full };
          setText(combine(segs, slots));
        })
          .then(() => {
            slots[i] = { ...slots[i], status: "done" };
          })
          .catch((e: unknown) => {
            slots[i] = { ...slots[i], status: "error", err: e instanceof Error ? e.message : "失败" };
          })
          .finally(() => {
            bump();
            setText(combine(segs, slots));
          }),
      ),
    );
    setProgress(null);
    setState("done");
  };

  const generateSingle = async () => {
    setText("");
    setError("");
    setState("streaming");
    startedFor.current = key;
    try {
      await streamPost(endpoint, { input, ai: loadAi() }, (full) => setText(full));
      setState("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成失败");
      setState("error");
    }
  };

  const generate = () => (segments && segments.length ? generateSegmented(segments) : generateSingle());

  return (
    <div className="card">
      <h2 className="section-title">{title}</h2>
      {state === "idle" ? (
        <>
          <p className="muted" style={{ marginTop: 0 }}>{description}</p>
          <button className="btn" onClick={generate}>{buttonLabel}</button>
        </>
      ) : null}

      {state === "streaming" && progress ? (
        <p className="muted" style={{ marginTop: 0 }}>
          分段并行生成 · 已完成 <strong>{progress.done}/{progress.total}</strong> 节,各节就位即显…
        </p>
      ) : null}

      {error ? <p className="notice">{error}(请确认服务端已按 .env.example 配置好 AI provider 与对应 API key)</p> : null}

      {text ? (
        <div ref={proseRef} className={`prose ${state === "streaming" ? "cursor" : ""}`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
        </div>
      ) : state === "streaming" ? (
        <p className="muted">正在生成(详实优先,需稍候)…</p>
      ) : null}

      {state === "done" || state === "error" ? (
        <div style={{ marginTop: "1rem", display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <button className="btn ghost" onClick={generate}>重新生成</button>
          {state === "done" ? (
            <button className="btn ghost" onClick={exportPdf}>导出 PDF</button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

interface Slot {
  text: string;
  status: "streaming" | "done" | "error";
  err: string;
}
