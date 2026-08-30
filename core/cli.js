#!/usr/bin/env node
import { runInit } from './commands/init.js'
import { runStatus } from './commands/status.js'

const USAGE = `LoopYourself — an Agent todo system aligned with Linear terminology.

Usage:
  loopyourself init              Initialize .loopyourself/ in this repository
  loopyourself status            Show the two-pool board

Data lives in .loopyourself/ (committed to git by default).
`

async function main() {
  const [cmd, ...args] = process.argv.slice(2)
  switch (cmd) {
    case 'init':
      return runInit(process.cwd(), args)
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
