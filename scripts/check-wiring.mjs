#!/usr/bin/env node
/**
 * Phase 9A — Simple wiring integrity scan.
 *
 * Scans app source for:
 * - href values pointing at staff workspaces from portal app
 * - button elements without onClick, href, or disabled (heuristic)
 *
 * Run: node scripts/check-wiring.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APPS_DIR = join(ROOT, 'apps');

const STAFF_WORKSPACE_PATTERNS = [
  /WORKSPACE_URLS\.(admin|crm|billing|desk|services)/,
  /localhost:1700[5-8]/,
  /localhost:17010/,
  /NEXT_PUBLIC_(ADMIN|CRM|BILLING|DESK|SERVICES)_URL/,
];

const PORTAL_FORBIDDEN_URL_PATTERNS = [
  /\/api\/v1\/wholesale\b/,
  /\/api\/v1\/services\/wholesale\b/,
  /\/api\/v1\/energy\/fidelity\b/,
  /\/api\/v1\/admin\b/,
  /\/api\/v1\/platform\b/,
  /\/api\/v1\/reports\b/,
  /itsi-mobile-wholesale/i,
];

const SKIP_DIRS = new Set(['node_modules', '.next', 'dist', '.turbo']);

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, files);
    else if (/\.(tsx?|jsx?)$/.test(entry)) files.push(full);
  }
  return files;
}

function scanFile(path) {
  const rel = relative(ROOT, path).replace(/\\/g, '/');
  const text = readFileSync(path, 'utf8');
  const issues = [];

  if (rel.startsWith('apps/portal/')) {
    for (const pat of STAFF_WORKSPACE_PATTERNS) {
      if (pat.test(text)) {
        issues.push({ kind: 'portal-staff-link', detail: `Portal app references staff workspace pattern: ${pat}` });
        break;
      }
    }
    for (const pat of PORTAL_FORBIDDEN_URL_PATTERNS) {
      if (pat.test(text)) {
        issues.push({ kind: 'portal-forbidden-api', detail: `Portal app references staff/wholesale API pattern: ${pat}` });
        break;
      }
    }
  }

  const buttonRe = /<button\b[^>]*>[\s\S]*?<\/button>/gi;
  let m;
  while ((m = buttonRe.exec(text)) !== null) {
    const tag = m[0].split('>')[0] + '>';
    if (tag.includes('type="submit"')) continue;
    if (tag.includes('onClick') || tag.includes('disabled')) continue;
    if (/\{['"][^'"]+['"]\s*\.map/.test(text.slice(Math.max(0, m.index - 200), m.index + 50))) {
      issues.push({ kind: 'suspect-button', detail: 'Button in map without onClick or disabled' });
    }
  }

  return issues.length ? { file: rel, issues } : null;
}

const files = walk(APPS_DIR);
const findings = files.map(scanFile).filter(Boolean);

console.log('Phase 13 Portal Wiring Scan\n');

if (findings.length === 0) {
  console.log('No issues flagged.');
  process.exit(0);
}

for (const f of findings) {
  console.log(`\n${f.file}`);
  for (const issue of f.issues) {
    console.log(`  [${issue.kind}] ${issue.detail}`);
  }
}

console.log(`\n${findings.length} file(s) flagged. Review manually — heuristic only.`);
process.exit(findings.length > 0 ? 1 : 0);
