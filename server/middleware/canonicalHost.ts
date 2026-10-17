export default defineEventHandler((event) => {
  const redirectUrl = canonicalRedirectUrl(getRequestURL(event), useRuntimeConfig(event).public.siteUrl)
  if (redirectUrl) return sendRedirect(event, redirectUrl, 301)
})
