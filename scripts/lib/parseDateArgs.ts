/**
  Shared CLI argument parsing utilities for scripts
**/

export class parseDateArgs {
  readonly #from: Date | undefined
  readonly #to: Date | undefined

  constructor() {
    this.#from = this.#parse('from')
    this.#to = this.#parse('to')

    if (this.#from && this.#to && this.#to < this.#from) {
      console.error('--to must be after --from')
      process.exit(1)
    }

    // Set to end of day so the date is inclusive
    if (this.#to) this.#to.setHours(23, 59, 59, 999)
  }

  from(): Date | undefined {
    return this.#from
  }

  to(): Date | undefined {
    return this.#to
  }

  #parse(name: string): Date | undefined {
    const idx = process.argv.indexOf(`--${name}`)
    const value = idx !== -1 ? process.argv[idx + 1] : undefined
    if (!value) return undefined
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      console.error(`--${name} must be in YYYY-MM-DD format, got: ${value}`)
      process.exit(1)
    }
    return new Date(value)
  }
}
