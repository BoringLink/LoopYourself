// Canonical vocabulary — mirrors Linear workflow states (see CONTEXT.md).
export const DATA_DIR = '.loopyourself'
export const CONFIG_FILE = 'config.json'
export const BOARD_FILE = 'board.md'

export const DEFAULT_CONFIG = {
  wipLimit: 1,
  review: { maxRounds: 3 },
  loop: { maxConsecutiveBlocked: 2 },
  autoPush: false,
  linear: null,
  conventions: null,
}

// Status values aligned with Linear. Duplicate only exists on the Linear side.
export const STATUSES = [
  'Backlog',
  'Ready',
  'Todo',
  'In Progress',
  'In Review',
  'Done',
  'Canceled',
  'Blocked',
]

export const TERMINAL_STATUSES = ['Done', 'Canceled']
export const ACTIVE_POOL_STATUSES = ['Ready', 'Todo', 'In Progress', 'In Review', 'Blocked']
export const BACKLOG_POOL_STATUSES = ['Backlog']

export const BOARD_TEMPLATE = `# LoopYourself Board

## Active

<!-- ordered execution pool; membership is derived from issue status -->

## Backlog

<!-- requests awaiting user review; not part of any workflow -->
`
