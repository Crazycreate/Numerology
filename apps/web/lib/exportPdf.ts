/** 打印用样式:印刷级排版,沿用水墨/朱砂视觉。 */
const PRINT_CSS = `
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #2b2622; background: #fff;
    font-family: "Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif; line-height: 1.75; }
  .doc { max-width: 760px; margin: 0 auto; }
  .doc-head { text-align: center; border-bottom: 2px solid #9b3b2f; padding-bottom: 10px; margin-bottom: 20px; }
  .doc-head .seal { display: inline-block; background: #9b3b2f; color: #fbf6ee;
    font-family: serif; font-size: 18px; padding: 2px 10px; border-radius: 4px; }
  .doc-head h1 { font-family: "Songti SC","STSong","SimSun",serif; font-size: 22px; margin: 8px 0 2px; letter-spacing: .1em; }
  .doc-head .meta { color: #8a8178; font-size: 12px; }
  h1,h2,h3,h4 { font-family: "Songti SC","STSong","SimSun",serif; break-after: avoid; }
  h1 { font-size: 20px; } h2 { font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-top: 20px; }
  h3 { font-size: 14px; color: #9b3b2f; }
  p, li { orphans: 3; widows: 3; }
  blockquote { border-left: 3px solid #c89b3c; background: #f7f1e6; margin: 10px 0; padding: 6px 12px; color: #5b554d; font-size: 13px; }
  table { border-collapse: collapse; width: 100%; font-size: 12px; margin: 10px 0; }
  th, td { border: 1px solid #ddd; padding: 4px 6px; text-align: left; }
  strong { color: #1f1b18; }
  .doc-foot { margin-top: 24px; padding-top: 10px; border-top: 1px solid #eee;
    color: #8a8178; font-size: 11px; text-align: center; }
`;

function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
}

/**
 * 把一段已渲染的报告 HTML 导出为 PDF(经浏览器打印对话框「另存为 PDF」)。
 * 文字保持可选可搜索,排版独立干净。
 */
export function printReport(title: string, contentHtml: string, meta?: string): void {
  const w = window.open("", "_blank", "width=900,height=1000");
  if (!w) {
    alert("浏览器拦截了弹出窗口,请允许后重试导出。");
    return;
  }
  w.document.write(
    `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">` +
      `<title>${escapeHtml(title)}</title><style>${PRINT_CSS}</style></head><body>` +
      `<div class="doc"><div class="doc-head"><span class="seal">命</span>` +
      `<h1>${escapeHtml(title)}</h1>${meta ? `<div class="meta">${escapeHtml(meta)}</div>` : ""}</div>` +
      `${contentHtml}` +
      `<div class="doc-foot">本报告为传统文化与自我反思用途,结论均为倾向性参考,非宿命预测,决策权始终在你自己手中。</div>` +
      `</div></body></html>`,
  );
  w.document.close();
  w.focus();
  const trigger = () => { try { w.print(); } catch { /* 用户可手动打印 */ } };
  w.onload = trigger;
  setTimeout(trigger, 500); // onload 偶尔不触发时兜底
}
