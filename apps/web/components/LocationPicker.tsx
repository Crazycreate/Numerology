"use client";

import { useState } from "react";
import { PROVINCES } from "@/lib/locations";

interface Props {
  /** 当前选中的经度(字符串;"" 表示不指定) */
  value: string;
  onChange: (longitude: string) => void;
}

/** 省 → 市 二级联动选择器,选中后回传该市经度。 */
export function LocationPicker({ value, onChange }: Props) {
  const [province, setProvince] = useState("");
  const cities = PROVINCES.find((p) => p.province === province)?.cities ?? [];

  return (
    <div style={{ display: "flex", gap: "0.4rem" }}>
      <select
        aria-label="省/直辖市"
        value={province}
        onChange={(e) => { setProvince(e.target.value); onChange(""); }}
        style={{ flex: 1 }}
      >
        <option value="">不指定省</option>
        {PROVINCES.map((p) => <option key={p.province} value={p.province}>{p.province}</option>)}
      </select>
      <select
        aria-label="市"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={!province}
        style={{ flex: 1 }}
      >
        <option value="">{province ? "选城市" : "—"}</option>
        {cities.map((c) => <option key={c.name} value={c.longitude}>{c.name}</option>)}
      </select>
    </div>
  );
}
