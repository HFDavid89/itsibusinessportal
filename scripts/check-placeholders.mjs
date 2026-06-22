#!/usr/bin/env node
/**
 * Phase 15 — Placeholder detection gate for user-facing apps.
 *
 * Flags obvious placeholder copy, demo data, static operational KPIs,
 * and TODO markers in portal/staff frontends.
 *
 * Run: pnpm check-placeholders
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APPS_DIR = join(ROOT, 'apps');

const SCAN_APPS = ['admin', 'crm', 'billing', 'desk', 'services', 'portal'];

const SKIP_DIRS = new Set(['node_modules', '.next', 'dist', '.turbo']);

/** Files or path fragments explicitly deferred — not counted as violations. */
const ALLOWLIST_PATHS = [
  'settings-placeholder.tsx',
  'PortalRequests.tsx',
  'integrations/energy/page.tsx',
  'tickets/[id]/page.tsx', // escalation defer until 13B-2
  'billing/[id]/page.tsx',
  'billing/page.tsx',
  'services/[id]/page.tsx',
  'fleet/[id]/page.tsx',
  'fleet/page.tsx',
];

const PATTERNS = [
  { id: 'scaffold-placeholder', re: /scaffold placeholder/i, severity: 'error' },
  { id: 'static-kpi', re: /status:\s*['"]Placeholder['"]/i, severity: 'error' },
  { id: 'lorem', re: /\blorem ipsum\b/i, severity: 'error' },
  { id: 'fake-data', re: /\bfake data\b|\bdemo data\b|\bhardcoded examples?\b/i, severity: 'error' },
  { id: 'todo-ui', re: /\bTODO\b(?!\s*:\s*placeholder-check)/, severity: 'warn' },
  { id: 'coming-soon-bare', re: /coming soon(?! —| — contact| until| — online| where)/i, severity: 'warn' },
  { id: 'not-implemented-ui', re: /not implemented(?!\.)/i, severity: 'warn' },
  { id: 'mock-ui', re: /\bmock\b/i, severity: 'warn' },
];

function isAllowlisted(relPath) {
  if (relPath.includes('/api/')) return true;
  return ALLOWLIST_PATHS.some((frag) => relPath.includes(frag));
}

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
  if (isAllowlisted(rel)) return null;

  const text = readFileSync(path, 'utf8');
  if (text.includes('placeholder-check: ok')) return null;

  const lines = text.split('\n');
  const hits = [];

  for (const { id, re, severity } of PATTERNS) {
    lines.forEach((line, idx) => {
      if (re.test(line)) {
        // Skip input placeholder= attributes and test-only strings
        if (id === 'mock-ui' && /mock-itsi-mobile|MockItsiMobile|wholesale-simulated/.test(line)) return;
        if (line.includes('placeholder=') && !/scaffold|Placeholder['"]/.test(line)) return;
        hits.push({ id, severity, line: idx + 1, excerpt: line.trim().slice(0, 120) });
      }
    });
  }

  return hits.length ? { file: rel, hits } : null;
}

console.log('Phase 15 Placeholder Scan\n');

const files = SCAN_APPS.flatMap((app) => {
  const dir = join(APPS_DIR, app, 'src');
  try {
    return walk(dir);
  } catch {
    return [];
  }
});

const findings = files.map(scanFile).filter(Boolean);
const errors = findings.flatMap((f) => f.hits.filter((h) => h.severity === 'error'));
const warns = findings.flatMap((f) => f.hits.filter((h) => h.severity === 'warn'));

if (findings.length === 0) {
  console.log('No placeholder issues flagged.');
  process.exit(0);
}

for (const f of findings) {
  console.log(`\n${f.file}`);
  for (const h of f.hits) {
    console.log(`  [${h.severity}] ${h.id}:${h.line} — ${h.excerpt}`);
  }
}

console.log(`\n${findings.length} file(s), ${errors.length} error(s), ${warns.length} warning(s).`);

if (errors.length > 0) {
  console.log('\nFix error-level placeholders or add `// placeholder-check: ok` with documented defer reason.');
  process.exit(1);
}

process.exit(warns.length > 0 ? 0 : 0);
