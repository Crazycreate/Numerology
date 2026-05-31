import { favorableDirections, type ChartResult, type FortuneAnalysis } from "@numerology/engine";

/** 上下文包:命盘事实 + 注意事项,供报告与对话共享同一份"真相"。 */
export interface ContextPack {
  /** 喂给模型的紧凑命盘事实(Markdown) */
  markdown: string;
  /** 精度/可信度边界提示(真太阳时、未校对数据等) */
  caveats: string[];
}

/**
 * 命盘 JSON(+ 可选动态运势) → 紧凑上下文包。纯函数,不调用网络/AI,可单测。
 * 报告与对话共用此包,确保两者基于同一命盘事实,不自相矛盾。
 */
export function buildContextPack(chart: ChartResult, fortune?: FortuneAnalysis): ContextPack {
  const { input, bazi: b, ziwei: z, meta } = chart;
  const caveats: string[] = [];

  if (!meta.trueSolarTimeApplied) {
    caveats.push(
      "出生时间按时钟时间起盘,未做真太阳时校正;若出生时刻接近时辰交界,时柱/命宫可能有偏差,解读时辰相关结论请留有余地。",
    );
  }

  const favDirs = favorableDirections(b.tiaohou.useGods);
  const favLine = favDirs
    .map((d) => `${d.wuxing}(${d.gans.join("")})→${d.direction}・宜${d.color}`)
    .join(";");
  const solarLine = meta.trueSolarTimeApplied
    ? `已校正(经度 ${meta.correction?.longitude}°,偏移 ${meta.correction?.offsetMinutes} 分钟)`
    : "未校正(按时钟时间起盘)";
  if (!b.tiaohou.reviewed) {
    caveats.push(
      `调候用神数据(${b.tiaohou.useGods.join("")})来自古籍诀文提取,尚未逐条人工校对,作为参考而非定论。`,
    );
  }

  const P = b.fourPillars;
  const pillar = (name: string, p: typeof P.year) =>
    `| ${name} | ${p.ganZhi} | ${p.shiShenGan || "—(日主)"} | ${p.hideGan.join("")} | ${p.shiShenZhi.join(" ")} | ${p.xingYun} | ${p.ziZuo} | ${p.xunKong} | ${p.naYin} |`;
  const shenShaLine = ([name, p]: [string, typeof P.year]) =>
    p.shenSha.length ? `  - ${name}柱(${p.ganZhi}): ${p.shenSha.join("、")}` : "";
  const shenShaBlock = (
    [["年", P.year], ["月", P.month], ["日", P.day], ["时", P.hour]] as [string, typeof P.year][]
  )
    .map(shenShaLine)
    .filter(Boolean)
    .join("\n");

  const daYun = b.daYun
    .filter((d) => d.ganZhi.trim().length === 2)
    .slice(0, 8)
    .map((d) => `${d.ganZhi}(${d.startAge}岁起/${d.startYear}年)`)
    .join("、");

  const palaceLine = (name: string) => {
    const p = z.palaces.find((x) => x.name === name);
    if (!p) return `${name}:—`;
    const stars = [...p.majorStars, ...p.minorStars]
      .map((s) => s.name + (s.brightness ? `(${s.brightness})` : "") + (s.mutagen ? `[${s.mutagen}]` : ""))
      .join(" ");
    const adj = p.adjectiveStars.map((s) => s.name).join(" ");
    return `${name}(${p.heavenlyStem}${p.earthlyBranch}): ${stars || "空宫"}${adj ? " · 杂曜:" + adj : ""}`;
  };

  const ORDER = [
    "命宫", "兄弟", "夫妻", "子女", "财帛", "疾厄",
    "迁移", "仆役", "官禄", "田宅", "福德", "父母",
  ];

  const markdown = `# 命盘事实(确定性排盘结果,勿改动数字)

## 基本信息
- 公历:${input.year}-${input.month}-${input.day} ${input.hour}:${String(input.minute ?? 0).padStart(2, "0")} ${input.gender}
- 农历:${b.lunarDate}
- 真太阳时:${solarLine}

## 八字四柱
| 柱 | 干支 | 天干十神 | 藏干 | 藏干十神 | 星运 | 自坐 | 空亡 | 纳音 |
|---|---|---|---|---|---|---|---|---|
${pillar("年", P.year)}
${pillar("月", P.month)}
${pillar("日", P.day)}
${pillar("时", P.hour)}
${shenShaBlock ? "\n神煞:\n" + shenShaBlock : ""}

- 日主(日元):${b.dayMaster}(${b.dayWuXing})
- 月令:${b.monthBranch}
- 调候用神(穷通宝鉴):${b.tiaohou.useGods.join("、")}${b.tiaohou.reviewed ? "" : "(待校对)"}
- 喜用神方位(开运参考,由用神五行推):${favLine || "—"}
- 起运:${b.startLuck.description}(${b.startLuck.solarDate})
- 大运:${daYun}

## 紫微斗数
- 命宫:${z.soulPalaceBranch} | 身宫:${z.bodyPalaceBranch} | ${z.fiveElementsClass}
- 命主:${z.soul} | 身主:${z.body}
- 命宫三方四正(判格局的依据):本宫${z.soulSanFang.palaceNames.self} + 对宫${z.soulSanFang.palaceNames.opposite} + 三合${z.soulSanFang.palaceNames.trine.join("/")};四宫合看主星:${z.soulSanFang.majorStars.join("、")}
- 十二宫主星(含生年四化标注):
${ORDER.map((n) => "  - " + palaceLine(n)).join("\n")}
${fortune ? "\n" + renderFortune(fortune) : ""}`;

  return { markdown, caveats };
}

/** 渲染动态运势(大运/流年 + 紫微大限/流年四化飞宫)。 */
function renderFortune(f: FortuneAnalysis): string {
  const u = (b: boolean) => (b ? "✓引动用神" : "");
  const cur = (b: boolean) => (b ? " 【当前运】" : "");

  const daYun = f.bazi.daYun
    .map(
      (d) =>
        `  - ${d.ganZhi}(${d.startAge}-${d.endAge}岁/${d.startYear}-${d.endYear}) ` +
        `天干${d.ganShiShen}、支藏${d.hideShiShen.map((h) => h.gan + h.shiShen).join("")} ${u(d.suppliesUseGod)}${cur(d.isCurrent)}`,
    )
    .join("\n");

  const liuNian = f.bazi.liuNian
    .map((y) => `${y.year}(${y.age}岁)${y.ganZhi}·${y.ganShiShen}${y.suppliesUseGod ? "✓" : ""}${y.isReference ? "【参考年/今年】" : y.isPast ? "(已过)" : ""}`)
    .join(" | ");

  const sihua = (s: { type: string; star: string; intoPalace: string }[]) =>
    s.map((x) => `${x.type}→${x.star}(入${x.intoPalace})`).join(" ");

  const yearly = f.ziwei.yearly
    .map((y) => `  - ${y.year} ${y.heavenlyStem}${y.earthlyBranch}(行${y.palaceName}):${sihua(y.sihua)}`)
    .join("\n");

  return `## 动态运势(动静结合的关键——运在一生中占主导)
> 喜用神(调候):${f.bazi.useGods.join("")}${f.bazi.useGodsReviewed ? "" : "(待校对)"}。"引动用神"=该运/年补益命局(补救信号);反之多为受困或需谨慎。

### 八字大运(相对日主${f.bazi.dayMaster})
${daYun}

### 八字流年(含已过年份,供回看验证)
  ${liuNian}

### 紫微大限四化(飞入本命宫)
  - 大限 ${f.ziwei.decadal.heavenlyStem}${f.ziwei.decadal.earthlyBranch}(行${f.ziwei.decadal.palaceName}):${sihua(f.ziwei.decadal.sihua)}

### 紫微流年四化(飞入本命宫,化忌冲宫尤需留意)
${yearly}
`;
}
