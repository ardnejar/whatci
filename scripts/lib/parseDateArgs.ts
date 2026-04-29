/**
  Shared CLI argument parsing utilities for scripts
**/

export class parseDateArgs {
  private readonly from_date: Date | undefined
  private readonly to_date: Date | undefined

  constructor() {
    this.from_date = this.parse('from')
    this.to_date = this.parse('to')

    if (this.from_date && this.to_date && this.to_date < this.from_date) {
      console.error('--to must be after --from')
      process.exit(1)
    }

    // Set to end of day so the date is inclusive
    if (this.to_date) this.to_date.setHours(23, 59, 59, 999)
  }

  from(): Date | undefined {
    return this.from_date
  }

  to(): Date | undefined {
    return this.to_date
  }

  private parse(name: string): Date | undefined {
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
