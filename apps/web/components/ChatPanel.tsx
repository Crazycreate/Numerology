"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { BirthInput } from "@numerology/engine";
import { streamPost } from "@/lib/streamClient";

interface Turn { role: "user" | "assistant"; content: string }

const SUGGESTIONS = [
  "我的事业是稳定受薪还是变动型？",
  "未来三年哪一年最关键？",
  "我适合创业吗？什么时候？",
  "感情上我该注意什么？",
];

export function ChatPanel({ input }: { input: BirthInput }) {
  const [log, setLog] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    setError("");
    setDraft("");
    const history = log;
    setLog((l) => [...l, { role: "user", content: q }, { role: "assistant", content: "" }]);
    setBusy(true);
    try {
      await streamPost("/api/chat", { input, history, question: q }, (full) => {
        setLog((l) => {
          const next = [...l];
          next[next.length - 1] = { role: "assistant", content: full };
          return next;
        });
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "对话失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h2 className="section-title">就这张命盘追问</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        回答与报告基于同一命盘与大运,口径一致。
      </p>

      {log.length === 0 ? (
        <div className="suggest">
          {SUGGESTIONS.map((s) => (
            <button key={s} className="chip" onClick={() => ask(s)} disabled={busy}>{s}</button>
          ))}
        </div>
      ) : (
        <div className="chat-log">
          {log.map((t, i) => (
            <div key={i} className={`bubble ${t.role}`}>
              {t.role === "assistant" ? (
                <div className={`prose ${busy && i === log.length - 1 ? "cursor" : ""}`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {t.content || "思考中…"}
                  </ReactMarkdown>
                </div>
              ) : (
                t.content
              )}
            </div>
          ))}
        </div>
      )}

      {error ? <p className="notice">{error}</p> : null}

      <form
        className="chat-input"
        onSubmit={(e) => { e.preventDefault(); ask(draft); }}
      >
        <input
          value={draft}
          placeholder="输入你的问题…"
          onChange={(e) => setDraft(e.target.value)}
          disabled={busy}
        />
        <button className="btn" type="submit" disabled={busy || !draft.trim()}>
          {busy ? "…" : "问"}
        </button>
      </form>
    </div>
  );
}
