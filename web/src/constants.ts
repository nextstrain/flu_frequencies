export const PROJECT_NAME = 'Frequencies' as const
export const PROJECT_DESCRIPTION = 'Pathogen variant frequencies' as const
export const COPYRIGHT_YEAR_START = 2023 as const
export const COMPANY_NAME = 'Nextstrain' as const
export const TEAM_NAME = 'nextstrain' as const

export const DOMAIN = process.env.DOMAIN ?? ''
export const DOMAIN_STRIPPED = process.env.DOMAIN_STRIPPED ?? ''
export const URL_FAVICON = `${DOMAIN}/favicon.ico`
export const SOCIAL_IMAGE_WIDTH = '1200'
export const SOCIAL_IMAGE_HEIGHT = '630'
export const URL_MANIFEST_JSON = `${DOMAIN}/manifest.json`

export const URL_GITHUB = 'https://github.com/nextstrain/flu_frequencies' as const
export const URL_GITHUB_FRIENDLY = 'github.com/nextstrain/flu_frequencies' as const
export const URL_GITHUB_ISSUES = 'https://github.com/nextstrain/flu_frequencies/issues' as const
export const URL_GITHUB_ISSUES_FRIENDLY = 'github.com/nextstrain/flu_frequencies/issues' as const

export const TWITTER_USERNAME_RAW = 'richardneher' as const
export const TWITTER_USERNAME_FRIENDLY = `@${TWITTER_USERNAME_RAW}`
export const TWITTER_HASHTAGS = [PROJECT_NAME]
export const TWITTER_RELATED = [TWITTER_USERNAME_RAW]

export const FACEBOOK_HASHTAG = PROJECT_NAME
