/// <reference types="node" />
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

/**
  Parse a .dev.vars file (KEY=VALUE format) and merge entries into process.env.
  Existing process.env values take precedence — only missing keys are added.
  Blank lines and lines starting with # are ignored.
**/
export async function loadDevVars(): Promise<void> {
  const file_path = join(import.meta.dirname, '..', '..', '.dev.vars')
  const content = await readFile(file_path, 'utf-8').catch(() => '')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq_index = trimmed.indexOf('=')
    if (eq_index === -1) continue
    const key = trimmed.slice(0, eq_index).trim()
    const value = trimmed.slice(eq_index + 1).trim()
    if (key && !(key in process.env)) {
      process.env[key] = value
    }
  }
}
