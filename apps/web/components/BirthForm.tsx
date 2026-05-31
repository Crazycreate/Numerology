"use client";

import { useState } from "react";
import type { BirthInput } from "@numerology/engine";
import type { BirthFormValue, Calendar } from "@/lib/formTypes";
import { LocationPicker } from "@/components/LocationPicker";

interface Props {
  loading: boolean;
  onSubmit: (input: BirthFormValue) => void;
  /** 预填值(测试期用) */
  defaults?: BirthInput | null;
}

/** 必填字段 */
const FIELDS = [
  { key: "year", label: "年", min: 1900, max: 2100 },
  { key: "month", label: "月", min: 1, max: 12 },
  { key: "day", label: "日", min: 1, max: 31 },
  { key: "hour", label: "时(0-23)", min: 0, max: 23 },
] as const;

export function BirthForm({ loading, onSubmit, defaults }: Props) {
  const str = (n: number | undefined): string => (n === undefined ? "" : String(n));
  const [v, setV] = useState<Record<string, string>>({
    year: str(defaults?.year), month: str(defaults?.month), day: str(defaults?.day),
    hour: str(defaults?.hour), minute: str(defaults?.minute),
  });
  const [gender, setGender] = useState<"男" | "女">(defaults?.gender ?? "男");
  const [calendar, setCalendar] = useState<Calendar>("solar");
  const [isLeapMonth, setIsLeapMonth] = useState(false);
  const [longitude, setLongitude] = useState<string>(
    defaults?.longitude !== undefined ? String(defaults.longitude) : "",
  );
  const [error, setError] = useState<string>("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const nums: Record<string, number> = {};
    for (const f of FIELDS) {
      const n = Number(v[f.key]);
      if (v[f.key] === "" || !Number.isInteger(n) || n < f.min || n > f.max) {
        setError(`请填写有效的「${f.label}」`);
        return;
      }
      nums[f.key] = n;
    }
    let minute = 0;
    if (v.minute !== "") {
      const m = Number(v.minute);
      if (!Number.isInteger(m) || m < 0 || m > 59) {
        setError("「分」请填 0-59,或留空");
        return;
      }
      minute = m;
    }
    const out: BirthFormValue = {
      year: nums.year!, month: nums.month!, day: nums.day!,
      hour: nums.hour!, minute, gender,
      calendar,
      ...(calendar === "lunar" && isLeapMonth ? { isLeapMonth: true } : {}),
    };
    if (longitude !== "") out.longitude = Number(longitude);
    onSubmit(out);
  };

  const dateHint = calendar === "lunar" ? "(农历)" : "(公历)";

  return (
    <form className="card" onSubmit={submit}>
      <h2 className="section-title">输入出生信息</h2>
      <div className="cal-toggle">
        <button type="button" className={calendar === "solar" ? "active" : ""} onClick={() => setCalendar("solar")}>公历(阳历)</button>
        <button type="button" className={calendar === "lunar" ? "active" : ""} onClick={() => setCalendar("lunar")}>农历(阴历)</button>
        {calendar === "lunar" ? (
          <label className="leap-check">
            <input type="checkbox" checked={isLeapMonth} onChange={(e) => setIsLeapMonth(e.target.checked)} />
            闰月
          </label>
        ) : null}
      </div>
      <div className="form-grid">
        {FIELDS.map((f) => (
          <div className="field" key={f.key}>
            <label htmlFor={f.key}>{f.key === "year" ? `年${dateHint}` : f.label}</label>
            <input
              id={f.key} type="number" inputMode="numeric"
              min={f.key === "year" ? f.min : undefined} max={f.key === "year" ? f.max : undefined}
              value={v[f.key]}
              onChange={(e) => setV((s) => ({ ...s, [f.key]: e.target.value }))}
            />
          </div>
        ))}
        <div className="field">
          <label htmlFor="minute">分（可留空）</label>
          <input
            id="minute" type="number" inputMode="numeric" min={0} max={59}
            value={v.minute}
            onChange={(e) => setV((s) => ({ ...s, minute: e.target.value }))}
          />
        </div>
        <div className="field">
          <label htmlFor="gender">性别</label>
          <select id="gender" value={gender} onChange={(e) => setGender(e.target.value as "男" | "女")}>
            <option value="男">男</option>
            <option value="女">女</option>
          </select>
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>出生地(真太阳时校正,省→市)</label>
          <LocationPicker value={longitude} onChange={setLongitude} />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "1.1rem" }}>
        <button className="btn" type="submit" disabled={loading}>
          {loading ? "排盘中…" : "排盘"}
        </button>
        {error ? <span className="notice">{error}</span> : (
          <span className="muted">
            {calendar === "lunar" ? "农历会自动转阳历起盘;时辰按时钟时间填。" : "性别决定大运顺逆与紫微部分布局,请如实填写。"}
          </span>
        )}
      </div>
    </form>
  );
}
