import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { gotoHydrated, revealDate, trackConsoleErrors } from './helpers'

const PAGES = [
  '/',
  '/?date=1990-04-04',
  '/duel?pa=235&pb=578&na=Quentin&nb=L%C3%A9a',
  '/tournoi?p=235&p=578&p=706&n=Quentin&n=L%C3%A9a&n=Max&s=0&s=1&s=0',
  '/pokedex',
  '/pokemon',
  '/pokemon/133-evoli',
  '/mentions-legales',
]

test.describe('Sécurité', { tag: '@server' }, () => {
  test('envoie les en-têtes de sécurité', async ({ request }) => {
    const headers = (await request.get('/')).headers()
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'")
    expect(headers['content-security-policy']).toMatch(/script-src [^;]*'nonce-/)
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(headers['strict-transport-security']).toContain('max-age=31536000')
    expect(headers['permissions-policy']).toContain('camera=()')
  })

  test('n’interprète pas le code glissé dans les prénoms', async ({ page }) => {
    let dialog = false
    page.on('dialog', async (d) => {
      dialog = true
      await d.dismiss()
    })
    await gotoHydrated(
      page,
      '/duel?pa=1&pb=4&na=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E&nb=%22%3E%3Csvg%20onload%3Dalert(1)%3E',
    )
    await expect(page.locator('.fighter__player').first()).toContainText('<img src=x')
    expect(dialog).toBe(false)
    expect(await page.locator('img[src="x"], svg[onload]').count()).toBe(0)
  })

  for (const path of PAGES) {
    test(`ne contacte aucun site tiers et respecte la CSP : ${path}`, async ({ page, baseURL }) => {
      const errors = trackConsoleErrors(page)
      const external: string[] = []
      page.on('request', (r) => {
        if (!r.url().startsWith(baseURL!) && !r.url().startsWith('data:')) external.push(r.url())
      })
      await gotoHydrated(page, path)
      await page.waitForLoadState('networkidle')
      expect(external).toEqual([])
      expect(errors.filter((e) => /Content Security Policy|Refused to/i.test(e))).toEqual([])
    })
  }
})

test.describe('Accessibilité', () => {
  for (const path of PAGES) {
    test(`aucun problème grave détecté par axe : ${path}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await gotoHydrated(page, path)
      await page.waitForLoadState('networkidle')
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
      expect(serious.map((v) => `${v.id} : ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([])
    })
  }

  test('le formulaire se remplit entièrement au clavier', async ({ page }) => {
    await gotoHydrated(page, '/')
    await page.getByLabel('Jour').focus()
    await page.keyboard.type('17102026')
    await page.keyboard.press('Enter')
    await expect(page.locator('.formula__num')).toHaveText('N° 706')
  })
})

test.describe('Affichage', () => {
  for (const path of PAGES) {
    test(`pas de défilement horizontal : ${path}`, async ({ page }) => {
      await gotoHydrated(page, path)
      await page.waitForLoadState('networkidle')
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(overflow).toBeLessThanOrEqual(0)
    })
  }

  test('toutes les images de la carte se chargent', async ({ page }) => {
    await revealDate(page, '25', '12', '2001')
    const broken = await page
      .locator('img')
      .evaluateAll((imgs) =>
        (imgs as HTMLImageElement[]).filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src),
      )
    expect(broken).toEqual([])
  })
})

test.describe('Hydratation', { tag: '@server' }, () => {
  for (const path of [...PAGES, '/pokemon/2000-inconnu']) {
    test(`aucun écart serveur / navigateur avec un Pokédex déjà rempli : ${path}`, async ({ page }) => {
      await page.addInitScript(() =>
        localStorage.setItem('pokedate.dex', JSON.stringify({ 1: { shiny: false }, 25: { shiny: true }, 133: {} })),
      )
      const errors = trackConsoleErrors(page)
      await gotoHydrated(page, path)
      await expect(page.locator('.site-nav .pill')).toHaveText(/[1-9]/)
      expect(errors.filter((error) => /hydration/i.test(error))).toEqual([])
    })
  }
})
