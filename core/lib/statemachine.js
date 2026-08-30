// State machine: legal transitions only (see CONTEXT.md / ADR-0003).
export const TRANSITIONS = {
  Backlog: ['Ready'],
  Ready: ['Todo'],
  Todo: ['In Progress'],
  'In Progress': ['In Review', 'Canceled'],
  'In Review': ['Done', 'In Progress', 'Canceled'],
  Blocked: ['In Progress'],
  Done: [],
  Canceled: [],
}

export function canTransition(from, to) {
  return (TRANSITIONS[from] ?? []).includes(to)
}
