/**
 * Turns the k6 --summary-export JSON into a Markdown table (GitHub job summary) and a Slack
 * payload. Limits come from perf/k6/thresholds.json, the same file the k6 script uses, so the
 * report and the pass/fail gate can never disagree.
 *
 * Usage: npx tsx scripts/k6-summary.ts [summaryPath] [outDir]
 *        (defaults: perf/k6/summary.json -> perf/k6/)
 * Exit code 1 when any limit is breached, so a workflow can gate on it.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type Limit = { stat: string; max: number; unit: string; label: string };
type MetricStats = Record<string, number>;
type Summary = { metrics: Record<string, MetricStats | { values: MetricStats }> };

export type Row = { metric: string; label: string; stat: string; value?: number; max: number; unit: string; ok: boolean };

/** k6 exports either flat stats or `{ values: {...} }` depending on version; accept both. */
const statsOf = (metric: MetricStats | { values: MetricStats } | undefined): MetricStats | undefined =>
  metric && 'values' in metric ? (metric.values as MetricStats) : (metric as MetricStats | undefined);

export function evaluate(summary: Summary, limits: Record<string, Limit>): Row[] {
  // If the browser never started, k6 exports the web vitals as 0: no iteration means no measurement
  const ran = (statsOf(summary.metrics.iterations)?.count ?? 0) > 0;
  return Object.entries(limits).map(([metric, limit]) => {
    const value = ran ? statsOf(summary.metrics[metric])?.[limit.stat] : undefined;
    return {
      metric,
      label: limit.label,
      stat: limit.stat,
      value,
      max: limit.max,
      unit: limit.unit,
      // A metric that was not measured is a failure: silence must not look like a pass
      ok: value !== undefined && value < limit.max,
    };
  });
}

const fmt = (n: number | undefined, unit: string) =>
  n === undefined ? 'not measured' : `${Number(n.toFixed(3))}${unit ? ` ${unit}` : ''}`;

export function toMarkdown(rows: Row[]): string {
  const lines = rows.map((r) =>
    `| ${r.label} | ${r.stat} | ${fmt(r.value, r.unit)} | < ${r.max}${r.unit ? ` ${r.unit}` : ''} | ${r.ok ? 'PASS' : 'FAIL'} |`);
  return `## k6 browser performance\n\n| Metric | Stat | Measured | Limit | Result |\n| --- | --- | --- | --- | --- |\n${lines.join('\n')}\n`;
}

export function toSlack(rows: Row[], runUrl?: string): { text: string } {
  const failed = rows.filter((r) => !r.ok);
  const head = failed.length
    ? `:warning: k6 performance: ${failed.length} of ${rows.length} limits breached`
    : `:white_check_mark: k6 performance: all ${rows.length} limits met`;
  const detail = rows.map((r) => `- ${r.label} ${r.stat}: ${fmt(r.value, r.unit)} (limit ${r.max}) ${r.ok ? 'ok' : 'FAIL'}`).join('\n');
  return { text: `${head}\n${detail}${runUrl ? `\n${runUrl}` : ''}` };
}

function main() {
  const summaryPath = process.argv[2] ?? 'perf/k6/summary.json';
  const outDir = process.argv[3] ?? 'perf/k6';
  if (!existsSync(summaryPath)) {
    console.error(`k6 summary not found: ${summaryPath}. Run k6 with --summary-export first.`);
    process.exit(1);
  }
  const limits = JSON.parse(readFileSync(join(__dirname, '..', 'perf', 'k6', 'thresholds.json'), 'utf8')) as Record<string, Limit>;
  const rows = evaluate(JSON.parse(readFileSync(summaryPath, 'utf8')) as Summary, limits);
  const runUrl = process.env.GITHUB_SERVER_URL && process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : undefined;

  const markdown = toMarkdown(rows);
  writeFileSync(join(outDir, 'summary.md'), markdown);
  writeFileSync(join(outDir, 'slack-payload.json'), JSON.stringify(toSlack(rows, runUrl), null, 2));
  console.log(markdown);
  process.exit(rows.every((r) => r.ok) ? 0 : 1);
}

if (require.main === module) main();
