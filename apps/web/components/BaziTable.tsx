"use client";

import type { BaziChart, ZiweiChart } from "@numerology/engine";

/** 中宫:八字四柱 + 紫微基本信息。 */
export function BaziTable({ bazi, ziwei }: { bazi: BaziChart; ziwei: ZiweiChart }) {
  const P = bazi.fourPillars;
  const cols = [
    { label: "年", p: P.year },
    { label: "月", p: P.month },
    { label: "日", p: P.day, day: true },
    { label: "时", p: P.hour },
  ];
  return (
    <>
      <table className="bazi">
        <thead>
          <tr>{cols.map((c) => <th key={c.label}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          <tr>
            {cols.map((c) => (
              <td key={c.label}>
                <div className={`gz ${c.day ? "daymaster" : ""}`}>{c.p.ganZhi}</div>
              </td>
            ))}
          </tr>
          <tr>
            {cols.map((c) => (
              <td key={c.label} className="muted" style={{ fontSize: "0.7rem" }}>
                {c.day ? "日主" : c.p.shiShenGan}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <div className="kv"><span className="k">日主</span><span>{bazi.dayMaster}（{bazi.dayWuXing}）· 月令 {bazi.monthBranch}</span></div>
        <div className="kv"><span className="k">调候</span><span>{bazi.tiaohou.useGods.join("、")}{bazi.tiaohou.reviewed ? "" : "（待校对）"}</span></div>
        <div className="kv"><span className="k">命/身</span><span>{ziwei.soulPalaceBranch} / {ziwei.bodyPalaceBranch} · {ziwei.fiveElementsClass}</span></div>
        <div className="kv"><span className="k">命主</span><span>{ziwei.soul} · 身主 {ziwei.body}</span></div>
      </div>
    </>
  );
}
