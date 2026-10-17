import { expect, type Page } from '@playwright/test'

export async function gotoHydrated(page: Page, path: string) {
  const response = await page.goto(path)
  await page.waitForFunction(() => {
    const root = document.getElementById('__nuxt') as
      | (HTMLElement & { __vue_app__?: { config: { globalProperties: { $nuxt?: { isHydrating?: boolean } } } } })
      | null
    return root?.__vue_app__?.config.globalProperties.$nuxt?.isHydrating === false
  })
  return response
}

export async function fillDate(page: Page, scope: string, d: string, m: string, y: string) {
  const field = page.locator(scope)
  await field.getByLabel('Jour').fill(d)
  await field.getByLabel('Mois').fill(m)
  await field.getByLabel('Année').fill(y)
}

export async function revealDate(page: Page, d: string, m: string, y: string) {
  await gotoHydrated(page, '/')
  await fillDate(page, '.hero', d, m, y)
  await page.getByRole('button', { name: 'Révéler mon Pokémon' }).click()
  await expect(page.locator('.mon-card')).toBeVisible()
  await expect(page.locator('.mon-card__stage--hidden')).toHaveCount(0, { timeout: 5000 })
}

export async function readSharedLink(page: Page) {
  await page.evaluate(() => {
    ;(window as unknown as { pokedateCopied: string }).pokedateCopied = ''
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true })
    navigator.clipboard.writeText = async (text: string) => {
      ;(window as unknown as { pokedateCopied: string }).pokedateCopied = text
    }
  })
  return async () => page.evaluate(() => (window as unknown as { pokedateCopied: string }).pokedateCopied)
}

export function trackConsoleErrors(page: Page) {
  const errors: string[] = []
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()))
  page.on('pageerror', (err) => errors.push(err.message))
  return errors
}
