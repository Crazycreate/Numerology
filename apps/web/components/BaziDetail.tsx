"use client";

import type { BaziChart, Pillar } from "@numerology/engine";

const COLS: { key: keyof BaziChart["fourPillars"]; label: string }[] = [
  { key: "year", label: "年柱" },
  { key: "month", label: "月柱" },
  { key: "day", label: "日柱" },
  { key: "hour", label: "时柱" },
];

function Row({ label, render, pillars }: {
  label: string;
  pillars: Pillar[];
  render: (p: Pillar, isDay: boolean) => React.ReactNode;
}) {
  return (
    <tr>
      <th className="rowlabel">{label}</th>
      {pillars.map((p, i) => <td key={i}>{render(p, i === 2)}</td>)}
    </tr>
  );
}

export function BaziDetail({ bazi }: { bazi: BaziChart }) {
  const ps = COLS.map((c) => bazi.fourPillars[c.key]);
  return (
    <div className="card">
      <h2 className="section-title"><span className="sys-chip is-a">八字</span>四柱详盘</h2>
      <div className="bazi-detail-wrap">
        <table className="bazi-detail">
          <thead>
            <tr>
              <th></th>
              {COLS.map((c) => <th key={c.key} className="colhead">{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            <Row label="主星" pillars={ps} render={(p, d) => (
              <span className="shishen">{d ? "元男/元女" : p.shiShenGan}</span>
            )} />
            <Row label="天干" pillars={ps} render={(p) => <span className="big-gan">{p.gan}</span>} />
            <Row label="地支" pillars={ps} render={(p) => <span className="big-zhi">{p.zhi}</span>} />
            <Row label="藏干" pillars={ps} render={(p) => (
              <div className="canggan">
                {p.hideGan.map((g, i) => (
                  <div key={g}>
                    <span className="cg-gan">{g}</span>
                    <span className="cg-ss">{p.shiShenZhi[i] ?? ""}</span>
                  </div>
                ))}
              </div>
            )} />
            <Row label="星运" pillars={ps} render={(p) => p.xingYun} />
            <Row label="自坐" pillars={ps} render={(p) => p.ziZuo} />
            <Row label="空亡" pillars={ps} render={(p) => p.xunKong} />
            <Row label="纳音" pillars={ps} render={(p) => <span className="muted">{p.naYin}</span>} />
            <Row label="神煞" pillars={ps} render={(p) => (
              <div className="shensha">
                {p.shenSha.length ? p.shenSha.map((s) => <span key={s}>{s}</span>) : <span className="muted">—</span>}
              </div>
            )} />
          </tbody>
        </table>
      </div>
      <p className="muted" style={{ marginTop: "0.6rem" }}>
        星运＝日主在各支的十二长生;自坐＝各柱天干在本支的长生。神煞为常用标准集,流派定义或有差异,仅供参考。
      </p>
    </div>
  );
}
