/** Runtime assets served from `public/picture/` */
export function pictureAsset(name: string): string {
  return `/picture/${name}`
}

export const PICTURE = {
  logo: pictureAsset('logo.png'),
  landingHero: pictureAsset('landing-hero.png'),
  dashboardCvBanner: pictureAsset('dashboard-cv-banner.png'),
  dashboardInterviewBanner: pictureAsset('dashboard-interview-banner.png'),
  dashboardPremiumBanner: pictureAsset('dashboard-premium-banner.svg'),
  aboutHero: pictureAsset('about-hero.png'),
  aboutMission: pictureAsset('about-mission.png'),
  authLanding: pictureAsset('auth-landing.png'),
} as const
