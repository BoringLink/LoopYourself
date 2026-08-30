import { loadConfig, validateStatusMap } from '../lib/linearmap.js'
import { writeJson, dataPaths } from '../lib/fsutil.js'

// Link: record the Linear Scope (team + project) that ALL Linear operations must
// stay within — prevents drift (Linear Scope, CONTEXT.md).
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
  writeJson(dataPaths(cwd).config, config)
  const lines = [
    `Linked Linear scope: team "${team}"${project ? `, project "${project}"` : ' (no project)'}`,
    'All Linear creates/updates from this system stay within this scope.',
    '',
    'statusMap is MANDATORY before any push. Fill it in config.json, e.g.:',
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
  const { ok, errors } = validateStatusMap(config)
  if (ok) {
    process.stdout.write('statusMap: complete — push preflight passes\n')
  } else {
    process.stdout.write('statusMap: INCOMPLETE — pushes will be refused:\n  ' + errors.join('\n  ') + '\n')
    process.exitCode = 1
  }
}
