/**
 * Automated defect triage.
 *
 * Reads the Playwright JSON report and turns failures into Jira-ready bug drafts:
 *   - groups the same failure across browsers/projects into ONE defect (no duplicates)
 *   - classifies the category (functional, accessibility, performance, visual, network, flaky)
 *   - assigns severity/priority from an explicit, documented rubric
 *   - flags different tests that fail with the same error signature (likely one root cause)
 *   - writes one Markdown draft per defect plus a summary and a Slack payload
 *
 * Usage:  npx tsx scripts/triage-failures.ts [reportPath] [outDir]
 *         (defaults: test-results/results.json -> bug-reports/)
 *
 * The output is a DRAFT. The `bug-report` Claude Code skill (.claude/skills/bug-report)
 * refines it, and a human reviews it before anything is filed.
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type Attachment = { name: string; contentType: string; path?: string };
type TestResult = {
  status: string;
  retry: number;
  error?: { message?: string };
  errors?: { message?: string }[];
  attachments?: Attachment[];
};
type TestEntry = {
  projectName: string;
  status: 'expected' | 'unexpected' | 'flaky' | 'skipped';
  results: TestResult[];
};
type Spec = { title: string; file: string; line: number; tags?: string[]; tests: TestEntry[] };
type Suite = { title: string; file?: string; specs?: Spec[]; suites?: Suite[] };
type Report = { suites: Suite[] };

export type Category = 'functional' | 'accessibility' | 'performance' | 'visual' | 'network' | 'flaky';
export const SEVERITIES = ['Low', 'Minor', 'Medium', 'Major', 'Critical'] as const;
export type Severity = (typeof SEVERITIES)[number];

export type Defect = {
  id: string;
  title: string;
  file: string;
  line: number;
  category: Category;
  severity: Severity;
  priority: 'Highest' | 'High' | 'Medium' | 'Low';
  projects: string[];
  message: string;
  signature: string;
  expected?: string;
  received?: string;
  evidence: Attachment[];
  flaky: boolean;
  tags: string[];
};

const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');
const CORE_FLOW = /(login|cart|checkout)/i;

const stripAnsi = (text: string) => text.replace(ANSI, '');

/** First meaningful line of the error, with volatile parts (numbers, timings) normalised. */
export function signatureOf(message: string): string {
  const firstLine = stripAnsi(message).split('\n').map((l) => l.trim()).find(Boolean) ?? 'unknown error';
  return firstLine.replace(/\d+(\.\d+)?/g, 'N').slice(0, 160);
}

export function categoryOf(spec: Pick<Spec, 'file' | 'tags' | 'title'>, flaky: boolean): Category {
  if (flaky) return 'flaky';
  const tags = spec.tags ?? [];
  const haystack = `${spec.file} ${spec.title}`.toLowerCase();
  if (tags.includes('a11y') || haystack.includes('accessibility')) return 'accessibility';
  if (tags.includes('perf') || haystack.includes('performance')) return 'performance';
  if (tags.includes('visual') || haystack.includes('visual')) return 'visual';
  if (tags.includes('network') || haystack.includes('network')) return 'network';
  return 'functional';
}

/**
 * Severity rubric (documented in docs/ai-workflow.md):
 *   functional on a core flow (login, cart, checkout) or tagged @smoke -> Critical
 *   other functional or network resilience                             -> Major
 *   accessibility, performance                                         -> Medium
 *   visual                                                             -> Minor
 *   flaky (passed on retry)                                            -> Low
 * Failing in 3 or more projects bumps the severity by one level.
 */
export function severityOf(category: Category, spec: Pick<Spec, 'file' | 'tags' | 'title'>, projectCount: number): Severity {
  const tags = spec.tags ?? [];
  let base: Severity;
  switch (category) {
    case 'functional':
      base = tags.includes('smoke') || CORE_FLOW.test(`${spec.file} ${spec.title}`) ? 'Critical' : 'Major';
      break;
    case 'network':
      base = 'Major';
      break;
    case 'accessibility':
    case 'performance':
      base = 'Medium';
      break;
    case 'visual':
      base = 'Minor';
      break;
    default:
      base = 'Low';
  }
  const bumped = category !== 'flaky' && projectCount >= 3 ? SEVERITIES.indexOf(base) + 1 : SEVERITIES.indexOf(base);
  return SEVERITIES[Math.min(bumped, SEVERITIES.length - 1)];
}

const priorityOf = (severity: Severity): Defect['priority'] =>
  ({ Critical: 'Highest', Major: 'High', Medium: 'Medium', Minor: 'Low', Low: 'Low' } as const)[severity];

function* walk(suites: Suite[]): Generator<Spec> {
  for (const suite of suites) {
    yield* suite.specs ?? [];
    yield* walk(suite.suites ?? []);
  }
}

const slugify = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

export function buildDefects(report: Report): Defect[] {
  const grouped = new Map<string, Defect>();

  for (const spec of walk(report.suites)) {
    for (const test of spec.tests) {
      if (test.status !== 'unexpected' && test.status !== 'flaky') continue;
      const flaky = test.status === 'flaky';
      const failing = test.results.filter((r) => r.status !== 'passed' && r.status !== 'skipped');
      const last = failing[failing.length - 1];
      const message = stripAnsi(last?.error?.message ?? last?.errors?.[0]?.message ?? 'No error message captured');
      const signature = signatureOf(message);
      const key = `${spec.file}::${spec.title}::${signature}`;

      const existing = grouped.get(key);
      if (existing) {
        if (!existing.projects.includes(test.projectName)) existing.projects.push(test.projectName);
        continue;
      }

      const category = categoryOf(spec, flaky);
      grouped.set(key, {
        id: '',
        title: spec.title,
        file: spec.file,
        line: spec.line,
        category,
        severity: 'Low',
        priority: 'Low',
        projects: [test.projectName],
        message,
        signature,
        expected: message.match(/Expected[^:\n]*:\s*(.+)/)?.[1]?.trim(),
        received: message.match(/Received[^:\n]*:\s*(.+)/)?.[1]?.trim(),
        evidence: (last?.attachments ?? []).filter((a) => a.path),
        flaky,
        tags: (spec.tags ?? []).map((t) => t.replace(/^@/, '')),
      });
    }
  }

  const rank = (s: Severity) => SEVERITIES.indexOf(s);
  const defects = [...grouped.values()].map((d) => {
    const severity = severityOf(d.category, { file: d.file, tags: d.tags, title: d.title }, d.projects.length);
    return { ...d, severity, priority: priorityOf(severity) };
  });
  defects.sort((a, b) => rank(b.severity) - rank(a.severity) || a.title.localeCompare(b.title));
  defects.forEach((d, i) => { d.id = `BUG-${String(i + 1).padStart(3, '0')}`; });
  return defects;
}

/** Different tests failing with the same normalised error usually share one root cause. */
export function rootCauseClusters(defects: Defect[]): Defect[][] {
  const bySignature = new Map<string, Defect[]>();
  for (const d of defects) bySignature.set(d.signature, [...(bySignature.get(d.signature) ?? []), d]);
  return [...bySignature.values()].filter((group) => group.length > 1);
}

export function renderDefect(d: Defect, base: string, cluster: Defect[] | undefined): string {
  const firstLine = d.signature.length > 90 ? `${d.signature.slice(0, 87)}...` : d.signature;
  const projectFlag = d.projects[0];
  const evidence = d.evidence.length
    ? d.evidence.map((a) => `- ${a.name}: \`${a.path}\``).join('\n')
    : '- No screenshot/trace attached (run with `--trace on` to capture one).';
  const related = cluster
    ? `\n- Possible common root cause with: ${cluster.filter((o) => o.id !== d.id).map((o) => `${o.id} (${o.title})`).join('; ')}`
    : '';

  return `# [${d.category[0].toUpperCase()}${d.category.slice(1)}] ${d.title}: ${firstLine}

| Field | Value |
| --- | --- |
| Type | Bug |
| Severity | ${d.severity} |
| Priority | ${d.priority} |
| Labels | automated-triage, ${d.category}, playwright |
| Environment | ${base} (projects: ${d.projects.join(', ')}) |
| Test | \`${d.file}:${d.line}\` |

## Description
The automated test "${d.title}" ${d.flaky ? 'failed and only passed after a retry (flaky)' : 'fails'} in ${d.projects.length} project(s).

## Steps to reproduce
1. \`npm ci && npx playwright install --with-deps\`
2. \`npx playwright test ${d.file} -g "${d.title.replace(/"/g, '\\"')}" --project=${projectFlag}\`
3. Compare with the expected and actual results below.

## Expected result
${d.expected ?? 'The test assertion passes.'}

## Actual result
${d.received ?? '(see error)'}

\`\`\`text
${d.message.split('\n').slice(0, 15).join('\n')}
\`\`\`

## Evidence
${evidence}

## Notes
- Draft generated by \`scripts/triage-failures.ts\`; review before filing.${related}
`;
}

export function renderSummary(defects: Defect[], clusters: Defect[][], total: number): string {
  if (!defects.length) return `# Triage summary\n\nNo failures in ${total} executed tests.\n`;
  const rows = defects
    .map((d) => `| ${d.id} | ${d.severity} | ${d.category} | ${d.title} | ${d.projects.join(', ')} |`)
    .join('\n');
  const causes = clusters.length
    ? `\n## Possible common root causes\n${clusters.map((c) => `- ${c.map((d) => d.id).join(', ')}: \`${c[0].signature}\``).join('\n')}\n`
    : '';
  return `# Triage summary

${defects.length} defect(s) from ${total} executed tests.

| ID | Severity | Category | Title | Projects |
| --- | --- | --- | --- | --- |
${rows}
${causes}`;
}

export function slackPayload(defects: Defect[], total: number, runUrl?: string): { text: string } {
  if (!defects.length) return { text: `:white_check_mark: Playwright: no failures in ${total} tests.` };
  const counts = SEVERITIES.slice().reverse()
    .map((s) => [s, defects.filter((d) => d.severity === s).length] as const)
    .filter(([, n]) => n > 0)
    .map(([s, n]) => `${n} ${s}`)
    .join(', ');
  const top = defects.slice(0, 5).map((d) => `- ${d.id} [${d.severity}] ${d.title}`).join('\n');
  return { text: `:rotating_light: Playwright triage: ${defects.length} defect(s) (${counts}) in ${total} tests.\n${top}${runUrl ? `\n${runUrl}` : ''}` };
}

function countTests(suites: Suite[]): number {
  return [...walk(suites)].reduce((sum, spec) => sum + spec.tests.length, 0);
}

function main() {
  const reportPath = process.argv[2] ?? 'test-results/results.json';
  const outDir = process.argv[3] ?? 'bug-reports';
  const base = process.env.BASE_URL ?? 'https://www.saucedemo.com';

  if (!existsSync(reportPath)) {
    console.error(`Report not found: ${reportPath}. Run the suite with the JSON reporter first (see playwright.config.ts).`);
    process.exit(1);
  }

  const report = JSON.parse(readFileSync(reportPath, 'utf8')) as Report;
  const defects = buildDefects(report);
  const clusters = rootCauseClusters(defects);
  const total = countTests(report.suites);

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  for (const d of defects) {
    const cluster = clusters.find((c) => c.some((o) => o.id === d.id));
    writeFileSync(join(outDir, `${d.id}-${slugify(d.title)}.md`), renderDefect(d, base, cluster));
  }
  const runUrl = process.env.GITHUB_SERVER_URL && process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : undefined;
  writeFileSync(join(outDir, 'summary.md'), renderSummary(defects, clusters, total));
  writeFileSync(join(outDir, 'slack-payload.json'), JSON.stringify(slackPayload(defects, total, runUrl), null, 2));

  console.log(renderSummary(defects, clusters, total));
  console.log(`Drafts written to ${outDir}/`);
}

if (require.main === module) main();
