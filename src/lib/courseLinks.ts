import type { CourseRecommendation } from '../types'

// Only exact course pages checked against the publisher may be linked here.
// Review date: 2026-11-01. AI-provided URLs, titles and ratings are untrusted.
const verifiedCourses = [
  {
    title: 'Data Engineering Zoomcamp',
    platform: 'datatalks.club',
    url: 'https://github.com/DataTalksClub/data-engineering-zoomcamp',
  },
]

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase('en-US')
}

export function verifiedCourseUrl(course: Pick<CourseRecommendation, 'title' | 'platform'>): string | null {
  const match = verifiedCourses.find(item =>
    normalized(course.title) === normalized(item.title) &&
    normalized(course.platform).includes(item.platform),
  )
  return match?.url ?? null
}

export function courseDisplayTitle(course: Pick<CourseRecommendation, 'title' | 'platform' | 'skill'>): string {
  return verifiedCourseUrl(course) ? course.title : `Tìm hiểu ${course.skill}`
}
