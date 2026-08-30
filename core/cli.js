#!/usr/bin/env node
import { runInit } from './commands/init.js'
import { runStatus } from './commands/status.js'
import { runCreate } from './commands/create.js'
import { runReady } from './commands/ready.js'
import { runAdvance } from './commands/advance.js'
import { runDone, runBlock } from './commands/done.js'
import { runReorder } from './commands/reorder.js'
import { runStart, runStop, runLoopStatus } from './commands/loop.js'
import { runLink, runVerify } from './commands/link.js'

const USAGE = `LoopYourself — an Agent todo system aligned with Linear terminology.

Usage:
  loopyourself init                     Initialize .loopyourself/ in this repository
  loopyourself create <title>           Create an issue in the Backlog pool
  loopyourself ready <LY-001|all>       Admit issue(s) into the workflow (USER ONLY)
  loopyourself advance <LY-001> [--review-fail]
                                         Ready -> Todo -> In Progress -> In Review
  loopyourself done <LY-001>            In Review -> Done (review passed & resolved)
  loopyourself block <LY-001>           Circuit breaker: mark Blocked, skip issue
  loopyourself start | stop | loop      Control the unattended loop
  loopyourself reorder <ids...>         Re-sequence the Active pool (USER)
  loopyourself link <team> [project]    Record the Linear scope in config
  loopyourself verify                   Push preflight: statusMap completeness
  loopyourself status                   Show the two-pool board

Data lives in .loopyourself/ (committed to git by default).
`

async function main() {
  const [cmd, ...args] = process.argv.slice(2)
  switch (cmd) {
    case 'init':
      return runInit(process.cwd(), args)
    case 'create':
      return runCreate(process.cwd(), args)
    case 'ready':
      return runReady(process.cwd(), args)
    case 'advance':
      return runAdvance(process.cwd(), args)
    case 'done':
      return runDone(process.cwd(), args)
    case 'block':
      return runBlock(process.cwd(), args)
    case 'start':
      return runStart(process.cwd(), args)
    case 'stop':
      return runStop(process.cwd(), args)
    case 'loop':
      return runLoopStatus(process.cwd(), args)
    case 'reorder':
      return runReorder(process.cwd(), args)
    case 'link':
      return runLink(process.cwd(), args)
    case 'verify':
      return runVerify(process.cwd(), args)
    case 'status':
      return runStatus(process.cwd(), args)
    case undefined:
    case 'help':
    case '--help':
    case '-h':
      process.stdout.write(USAGE)
      return
    default:
      process.stderr.write(`Unknown command: ${cmd}\n\n`)
      process.stdout.write(USAGE)
      process.exitCode = 1
  }
}

main().catch((err) => {
  process.stderr.write(`error: ${err.message}\n`)
  process.exitCode = 1
})
