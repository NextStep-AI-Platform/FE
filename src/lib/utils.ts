import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ScoreLevel } from '../types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getScoreLevel(score: number): ScoreLevel {
  if (score >= 85) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 55) return 'average'
  return 'poor'
}

export function getScoreColor(score: number): string {
  if (score >= 85) return 'text-green-400'
  if (score >= 70) return 'text-blue-400'
  if (score >= 55) return 'text-yellow-400'
  return 'text-red-400'
}

export function getScoreBarColor(score: number): string {
  if (score >= 70) return 'bg-blue-500'
  if (score >= 50) return 'bg-yellow-500'
  return 'bg-red-500'
}

export function getScoreLabel(score: number): { label: string; color: string; bg: string } {
  if (score >= 85) return { label: 'Xuất sắc', color: 'keep-accent text-green-400', bg: 'bg-green-600/15 border border-green-500/20' }
  if (score >= 70) return { label: 'Khá tốt', color: 'keep-accent text-blue-400', bg: 'bg-blue-600/15 border border-blue-500/20' }
  if (score >= 55) return { label: 'Trung bình', color: 'keep-accent text-amber-400', bg: 'bg-amber-500/15 border border-amber-500/20' }
  return { label: 'Cần cải thiện', color: 'keep-accent text-red-400', bg: 'bg-red-600/15 border border-red-500/20' }
}

export function getMatchColor(match: number): string {
  if (match >= 80) return 'text-green-400'
  if (match >= 60) return 'text-yellow-400'
  return 'text-red-400'
}

export function getMatchBg(match: number): string {
  if (match >= 80) return 'bg-green-900/20'
  if (match >= 60) return 'bg-yellow-900/20'
  return 'bg-red-900/20'
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function sanitizeScanTitle(part: string): string {
  return part
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_\u00C0-\u1EF9-]/g, '')
    .slice(0, 40) || 'Unknown'
}

export function buildScanTitle(role: string, company: string): string {
  return `CS_${sanitizeScanTitle(role)}_${sanitizeScanTitle(company)}`
}

export function formatScanDisplayTitle(title: string): string {
  const parts = title.split('_')
  if (parts[0] === 'CS' && parts.length >= 3) {
    return `CS · ${parts.slice(1, -1).join(' ')} · ${parts[parts.length - 1].replace(/_/g, ' ')}`
  }
  return title.replace(/_/g, ' · ')
}

export function formatExperienceRange(from: number, to: number): string {
  if (from === to) return `${from} năm`
  return `${from}–${to} năm`
}

export function validateExperienceRange(from: number, to: number): boolean {
  if (!Number.isFinite(from) || !Number.isFinite(to)) return false
  if (from < 0 || to < 0) return false
  return to >= from
}

export function getMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function addDays(date: Date, days: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

export function formatPlanExpiry(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('vi-VN')
}
