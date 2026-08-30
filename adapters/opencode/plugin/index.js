// LoopYourself OpenCode adapter.
// Install: opencode plugin @loopyourself/opencode-plugin
// (writes the package into opencode.json "plugin" array; auto-installed on startup)
import { Plugin } from '@opencode-ai/plugin'

const LOOP_COMMANDS = {
  'loopyourself/init': {
    description: 'Initialize LoopYourself in this repository',
    template: 'Run `npx loopyourself init` and show its output. If the user mentions a Linear team, also run `loopyourself link <team> [project]` and remind them to fill statusMap in .loopyourself/config.json before any Linear push.',
  },
  'loopyourself/start': {
    description: 'Start the unattended agent loop (Ready -> Done)',
    template: 'Start the LoopYourself unattended loop. Run `loopyourself start`, then follow the loop protocol: pick the Active pool head via `loopyourself status` (NEVER admit Backlog issues yourself), execute the issue obeying repository conventions (AGENTS.md), run the SubAgent review gate before committing (advance with --review-fail on failure, block after maxRounds), push state to Linear via MCP per docs/linear-protocol.md when linked, and continue until the pool empties or the circuit breaker stops the loop. Report a summary at the end.',
  },
  'loopyourself/stop': {
    description: 'Stop the unattended loop',
    template: 'Run `loopyourself stop` and report the board state via `loopyourself status`.',
  },
  'loopyourself/status': {
    description: 'Show the LoopYourself two-pool board',
    template: 'Run `loopyourself status` and `loopyourself loop`, then summarize the two pools, WIP usage, and any Blocked issues.',
  },
  'loopyourself/ready': {
    description: 'USER ONLY — admit Backlog issue(s) into the workflow',
    template: 'This command represents the USER\'s review decision. Confirm which issue(s) to admit, then run `loopyourself ready <LY-001|all>`. Never run this on the agent\'s own initiative during a loop.',
  },
  'loopyourself/pull': {
    description: 'Pull issue updates from Linear (user-initiated)',
    template: 'Only run when the user explicitly asks. Fetch issues in the configured Linear scope via Linear MCP, apply the pull protocol from docs/linear-protocol.md (map by state TYPE; new issues land as Backlog, never auto-admitted), then show the updated board via `loopyourself status`.',
  },
  'loopyourself/reorder': {
    description: 'USER — re-sequence the Active pool execution order',
    template: 'Ask for or accept the desired order, then run `loopyourself reorder LY-003 LY-001 ...` and show the resulting order.',
  },
}

export const LoopYourselfPlugin: Plugin = async ({ project, client }) => {
  return {
    // Inject the seven /loopyourself/ commands at config time.
    config: async (cfg) => {
      cfg.command = { ...(cfg.command ?? {}), ...LOOP_COMMANDS }
      return cfg
    },

    // Continue the unattended loop when the agent goes idle mid-loop.
    event: async (event) => {
      if (event.type !== 'session.idle') return
      try {
        const state = await readLoopState(project)
        if (!state?.running) return
        await client.session.chat({
          sessionID: event.properties.sessionID,
          agent: 'build',
          text: 'Continue the LoopYourself unattended loop: pick the next Ready issue from the Active pool and proceed per the loop protocol (see /loopyourself/start). Never admit Backlog issues. Stop when the pool is empty or the circuit breaker fires.',
        })
      } catch {
        // loop state missing or unreadable — nothing to continue
      }
    },
  }
}

async function readLoopState(project) {
  const { existsSync, readFileSync } = await import('node:fs')
  const { join } = await import('node:path')
  const file = join(project?.path ?? process.cwd(), '.loopyourself', 'loop.json')
  if (!existsSync(file)) return null
  return JSON.parse(readFileSync(file, 'utf8'))
}
