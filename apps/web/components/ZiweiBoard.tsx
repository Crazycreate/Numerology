"use client";

import { useState } from "react";
import type { ZiweiChart, ZiweiPalace, ZiweiStar } from "@numerology/engine";

/** 地支 → 传统紫微盘 4×4 网格坐标 [row, col]。 */
const GRID: Record<string, [number, number]> = {
  巳: [1, 1], 午: [1, 2], 未: [1, 3], 申: [1, 4],
  辰: [2, 1], 酉: [2, 4],
  卯: [3, 1], 戌: [3, 4],
  寅: [4, 1], 丑: [4, 2], 子: [4, 3], 亥: [4, 4],
};

const RING = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

/** 某地支的三方四正地支集合(本宫 + 对宫 + 两三合)。 */
function sanFangBranches(branch: string): { self: string; opposite: string; trine: string[] } {
  const i = RING.indexOf(branch);
  return {
    self: branch,
    opposite: RING[(i + 6) % 12]!,
    trine: [RING[(i + 4) % 12]!, RING[(i + 8) % 12]!],
  };
}

function StarSpan({ star, kind }: { star: ZiweiStar; kind: "major" | "minor" }) {
  return (
    <span className={`star ${kind}`}>
      {star.name}
      {star.brightness ? <span className="bri">{star.brightness}</span> : null}
      {star.mutagen ? <span className={`hua ${star.mutagen}`}>{star.mutagen}</span> : null}
    </span>
  );
}

function Palace({
  p, highlight, onSelect,
}: {
  p: ZiweiPalace;
  highlight: "self" | "opposite" | "trine" | null;
  onSelect: (branch: string) => void;
}) {
  const [row, col] = GRID[p.earthlyBranch] ?? [1, 1];
  const cls = [
    "palace",
    p.isSoulPalace ? "soul" : "",
    p.isBodyPalace ? "body" : "",
    highlight ? `hl-${highlight}` : "",
  ].filter(Boolean).join(" ");
  return (
    <div
      className={cls}
      style={{ gridRow: row, gridColumn: col }}
      onClick={() => onSelect(p.earthlyBranch)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") onSelect(p.earthlyBranch); }}
    >
      <div className="pname">
        <span>{p.name}</span>
        <span className="gz">{p.heavenlyStem}{p.earthlyBranch}</span>
      </div>
      <div className="stars">
        {p.majorStars.map((s) => <StarSpan key={s.name} star={s} kind="major" />)}
        {p.minorStars.map((s) => <StarSpan key={s.name} star={s} kind="minor" />)}
      </div>
      {p.adjectiveStars.length ? (
        <div className="adj">{p.adjectiveStars.map((s) => s.name).join(" ")}</div>
      ) : null}
      <div className="pmeta">
        <span className="decadal">{p.decadal.range[0]}–{p.decadal.range[1]}</span>
        <span>{p.changsheng12}·{p.boshi12}</span>
        <span className="faint">{p.jiangqian12}·{p.suiqian12}</span>
      </div>
      {p.isBodyPalace ? <span className="tag">身</span> : null}
      {highlight === "self" ? <span className="sfsz-badge">本宫</span> : null}
      {highlight === "opposite" ? <span className="sfsz-badge">对宫</span> : null}
      {highlight === "trine" ? <span className="sfsz-badge">三合</span> : null}
    </div>
  );
}

export function ZiweiBoard({ ziwei, center }: { ziwei: ZiweiChart; center: React.ReactNode }) {
  const [selected, setSelected] = useState<string>(ziwei.soulPalaceBranch);
  const sf = sanFangBranches(selected);
  const highlightOf = (branch: string): "self" | "opposite" | "trine" | null => {
    if (branch === sf.self) return "self";
    if (branch === sf.opposite) return "opposite";
    if (sf.trine.includes(branch)) return "trine";
    return null;
  };
  const selName = ziwei.palaces.find((p) => p.earthlyBranch === selected)?.name ?? "";
  const relNames = [sf.opposite, ...sf.trine]
    .map((b) => ziwei.palaces.find((p) => p.earthlyBranch === b)?.name)
    .filter(Boolean)
    .join("、");

  return (
    <>
      <div className="ziwei-board">
        {ziwei.palaces.map((p) => (
          <Palace key={p.index} p={p} highlight={highlightOf(p.earthlyBranch)} onSelect={setSelected} />
        ))}
        <div className="board-center">{center}</div>
      </div>
      <p className="muted sfsz-hint">
        点击任意宫查看其<strong>三方四正</strong>(本宫朱框 · 对宫 · 两三合宫高亮)。
        当前:<strong style={{ color: "var(--cinnabar)" }}>{selName}</strong> 的三方四正 = {selName}（本）+ {relNames}。
      </p>
    </>
  );
}
