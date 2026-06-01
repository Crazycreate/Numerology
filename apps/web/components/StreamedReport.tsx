"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { BirthInput } from "@numerology/engine";
import { streamPost } from "@/lib/streamClient";
import { printReport } from "@/lib/exportPdf";
import { loadAi } from "@/lib/aiSettings";

interface Props {
  input: BirthInput;
  endpoint: string;
  title: string;
  description: string;
  buttonLabel: string;
}

/** 通用流式报告卡:点按钮 → 调指定 endpoint → 逐字渲染 Markdown。 */
export function StreamedReport({ input, endpoint, title, description, buttonLabel }: Props) {
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "streaming" | "done" | "error">("idle");
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
    if (state !== "idle") setState("idle");
  }

  const generate = async () => {
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

  return (
    <div className="card">
      <h2 className="section-title">{title}</h2>
      {state === "idle" ? (
        <>
          <p className="muted" style={{ marginTop: 0 }}>{description}</p>
          <button className="btn" onClick={generate}>{buttonLabel}</button>
        </>
      ) : null}

      {error ? <p className="notice">{error}(请确认服务端已按 .env.example 配置好 AI provider 与对应 API key)</p> : null}

      {text ? (
        <div ref={proseRef} className={`prose ${state === "streaming" ? "cursor" : ""}`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
        </div>
      ) : state === "streaming" ? (
        <p className="muted">正在生成(Opus 深度推理,详实优先,需稍候)…</p>
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
