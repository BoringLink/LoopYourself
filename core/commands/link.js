import { join } from 'node:path'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { loadConfig } from '../lib/linearmap.js'

// Link: record the Linear Scope (team + project) that ALL Linear operations must
// stay within — prevents drift (ADR: Linear Scope).
export function runLink(cwd, args) {
  const [team, project] = args
  if (!team) {
    process.stderr.write('usage: loopyourself link <team-name-or-id> [project-name-or-id]\n')
    process.exitCode = 1
    return
  }
  const config = loadConfig(cwd)
  config.linear = {
    ...(config.linear ?? {}),
    team,
    project: project ?? null,
    statusMap: config.linear?.statusMap ?? {},
  }
  const file = join(cwd, '.loopyourself', 'config.json')
  writeFileSync(file, JSON.stringify(config, null, 2) + '\n')
  const lines = [
    `Linked Linear scope: team "${team}"${project ? `, project "${project}"` : ' (no project)'}`,
    'All Linear creates/updates from this system stay within this scope.',
    '',
    'statusMap is now MANDATORY before any push. Fill it in config.json, e.g.:',
    JSON.stringify({ linear: { statusMap: { Ready: 'Todo', 'In Review': 'In Review' } } }, null, 2),
  ]
  process.stdout.write(lines.join('\n') + '\n')
}

// Verify: push preflight — statusMap must fully cover pushable statuses.
export function runVerify(cwd) {
  const config = loadConfig(cwd)
  if (!config.linear) {
    process.stdout.write('linear: not linked (local-only mode)\n')
    return
  }
  const { validateStatusMap } = awaitImport()
  const { ok, errors } = validateStatusMap(config)
  if (ok) {
    process.stdout.write('statusMap: complete — push preflight passes\n')
  } else {
    process.stdout.write('statusMap: INCOMPLETE — pushes will be refused:\n  ' + errors.join('\n  ') + '\n')
    process.exitCode = 1
  }
}

function awaitImport() {
  // small indirection to keep this file import-clean for tree-shaking in adapters
  // eslint-disable-next-line
  return { validateStatusMap: (cfg) => validateStatusMapImpl(cfg) }
}

import { validateStatusMap as validateStatusMapImpl } from '../lib/linearmap.js'
