// Claude Code Stop hook (.claude/settings.json). When UI files have uncommitted changes, the
// turn may not end until check, build and the overflow tests pass. Exit 2 blocks the stop and
// feeds stderr back to the agent; exit 0 lets it through. Set CLAUDE_SKIP_STOP_GATE=1 to bypass.
import { execSync, spawnSync } from 'node:child_process';

const UI_PATHS = ['src/styles', 'src/components', 'src/layouts', 'src/views', 'DESIGN.md'];

let input = '';
try {
  input = (await new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', (c) => (data += c));
    process.stdin.on('end', () => resolve(data));
    setTimeout(() => resolve(data), 500);
  }));
} catch {
  input = '';
}
let payload = {};
try {
  payload = input ? JSON.parse(input) : {};
} catch {
  payload = {};
}
if (payload.stop_hook_active || process.env.CLAUDE_SKIP_STOP_GATE === '1') process.exit(0);

const changed = execSync(`git status --porcelain -- ${UI_PATHS.join(' ')}`, { encoding: 'utf8' }).trim();
if (!changed) process.exit(0);

const steps = [
  ['npm', ['run', 'check']],
  ['npx', ['astro', 'build', '--force']],
  ['node', ['scripts/check-tokens.mjs']],
  ['npx', ['playwright', 'test', '--grep', 'overflow', '--reporter=line']],
];
for (const [cmd, args] of steps) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  if (r.status !== 0) {
    console.error(`stop-gate: "${cmd} ${args.join(' ')}" failed. Fix it before finishing.\n` + String(r.stdout || '').slice(-3000) + String(r.stderr || '').slice(-3000));
    process.exit(2);
  }
}
process.exit(0);
