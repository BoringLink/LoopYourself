import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { STATUSES } from '../constants.js'

// StatusMap is MANDATORY after linking (ADR-0004): every pushable local status
// must map to a Linear workflow state name. No silent fallback, ever.
export const PUSHABLE_STATUSES = STATUSES.filter((s) => s !== 'Blocked')

export function loadConfig(cwd) {
  const file = join(cwd, '.loopyourself', 'config.json')
  if (!existsSync(file)) throw new Error('not initialized — run `loopyourself init` first')
  return JSON.parse(readFileSync(file, 'utf8'))
}

export function validateStatusMap(config) {
  const errors = []
  if (!config.linear) {
    errors.push('linear not linked — run `loopyourself link <team> [project]` first')
    return { ok: false, errors }
  }
  const map = config.linear.statusMap ?? {}
  for (const status of PUSHABLE_STATUSES) {
    if (!map[status] || typeof map[status] !== 'string' || map[status].trim() === '') {
      errors.push(
        `statusMap missing entry for "${status}" — add {"linear":{"statusMap":{"${status}":"<Linear state name>"}}} to .loopyourself/config.json`,
      )
    }
  }
  return { ok: errors.length === 0, errors }
}

// Resolve the Linear state name for a local status; throws with actionable guidance.
export function resolveLinearState(config, localStatus) {
  if (localStatus === 'Blocked') {
    throw new Error('Blocked is local-only and must never be pushed to Linear')
  }
  const { ok, errors } = validateStatusMap(config)
  if (!ok) {
    throw new Error(`statusMap validation failed:\n  ${errors.join('\n  ')}`)
  }
  const target = config.linear.statusMap[localStatus]
  if (!target) {
    throw new Error(`no statusMap entry for "${localStatus}" — refusing to push (no silent fallback)`)
  }
  return target
}
