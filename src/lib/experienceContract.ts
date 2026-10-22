import type { ExperienceUnit } from '../types'

/**
 * Convert the UI's explicit unit selection to the only cross-service unit:
 * whole months. Callers must not infer a missing unit from a bare number.
 */
export function toMinExperienceMonths(
  value: number | undefined,
  unit: ExperienceUnit | undefined,
): number | undefined {
  if (value === undefined) return undefined
  if (!Number.isInteger(value) || value < 0) {
    throw new Error('Minimum experience must be a non-negative whole number')
  }
  if (unit === 'month') return value
  if (unit === 'year') return value * 12
  throw new Error('An explicit experience unit is required')
}
