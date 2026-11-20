import { describe, expect, it } from 'vitest'
import {
  applyChanges, compactCv, defaultDecisions, describePath, emptyCv, filledSections,
  isCvEmpty, keywordCoverage, normalizeCv, setPath,
} from './cvStructured'
import type { CvChange, CvStructured } from '../types/cvStructured'

const base = (): CvStructured => ({
  ...emptyCv(),
  summary: 'Backend developer',
  experience: [
    { company: 'X', role: 'Dev', start: '', end: '', current: false, bullets: ['Built APIs'] },
    { company: 'Y', role: 'Intern', start: '', end: '', current: false, bullets: ['Tested'] },
  ],
  skills: { technical: ['Python'], soft: [], languages: [] },
})

const change = (id: string, path: string, after: string | string[], needs = false): CvChange => ({
  id, path, after, before: null, type: 'rephrase', addedKeywords: [], rationale: '', needsUserConfirmation: needs,
})

describe('cvStructured', () => {
  it('detects empty CV', () => {
    expect(isCvEmpty(emptyCv())).toBe(true)
    const cv = emptyCv()
    cv.skills.technical = ['Python']
    expect(isCvEmpty(cv)).toBe(false)
  })

  it('counts filled sections', () => {
    expect(filledSections(base())).toEqual({ filled: 3, total: 8 })
  })

  it('applies accepted, keeps rejected/undecided, uses edited value', () => {
    const changes = [
      change('c1', 'summary', 'New summary'),
      change('c2', 'skills.technical', ['Python', 'Docker']),
      change('c3', 'experience[0].bullets', ['Built REST APIs']),
      change('c4', 'personal.title', 'Backend Dev'),
    ]
    const out = applyChanges(base(), changes, {
      c1: { state: 'rejected' },
      c2: { state: 'edited', value: ['Python', 'Go'] },
      c3: { state: 'accepted' },
    })
    expect(out.summary).toBe('Backend developer')
    expect(out.skills.technical).toEqual(['Python', 'Go'])
    expect(out.experience[0].bullets).toEqual(['Built REST APIs'])
    expect(out.personal.title).toBe('')
  })

  it('setPath on one experience does not touch another', () => {
    const cv = base()
    setPath(cv, 'experience[0].bullets', ['changed'])
    expect(cv.experience[1].bullets).toEqual(['Tested'])
  })

  it('ignores stale paths instead of throwing', () => {
    const out = applyChanges(base(), [change('c1', 'experience[9].bullets', ['x'])], { c1: { state: 'accepted' } })
    expect(out.experience).toHaveLength(2)
  })

  it('compactCv drops blank bullets and empty items', () => {
    const cv = base()
    cv.experience[0].bullets = ['A', '  ', '']
    cv.projects = [{ name: '', role: '', tech: [], bullets: [''] }]
    const out = compactCv(cv)
    expect(out.experience[0].bullets).toEqual(['A'])
    expect(out.projects).toEqual([])
  })

  it('default decisions skip changes needing confirmation', () => {
    const d = defaultDecisions([change('c1', 'summary', 'x'), change('c2', 'skills.technical', ['y'], true)])
    expect(Object.keys(d)).toEqual(['c1'])
  })

  it('normalizes partial data', () => {
    const cv = normalizeCv({ personal: { fullName: 'A' }, experience: [{ company: 'X' }] })
    expect(cv.experience[0].bullets).toEqual([])
    expect(cv.skills.languages).toEqual([])
  })

  it('keyword coverage and path labels', () => {
    expect(keywordCoverage(base(), ['python', 'Docker', 'Python'])).toEqual({ hit: 1, total: 2 })
    expect(describePath('experience[0].bullets', base())).toBe('Kinh nghiệm · Dev – X')
  })
})
