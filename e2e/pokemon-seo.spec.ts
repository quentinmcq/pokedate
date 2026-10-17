import { expect, test } from '@playwright/test'
import { gotoHydrated } from './helpers'

const meta = (name: string) => `meta[name="${name}"], meta[property="${name}"]`

test.describe('Fiches Pokémon', () => {
  test('redirige l’ancienne adresse vers l’adresse lisible', async ({ page }) => {
    const response = await page.goto('/pokemon/25')
    expect(response?.request().redirectedFrom()?.url()).toMatch(/\/pokemon\/25$/)
    await expect(page).toHaveURL('/pokemon/25-pikachu')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Pikachu')
  })

  test('navigue vers le Pokémon suivant et les évolutions', async ({ page }) => {
    await gotoHydrated(page, '/pokemon/25-pikachu')
    await page.getByRole('link', { name: /#26 →/ }).click()
    await expect(page).toHaveURL('/pokemon/26-raichu')
    await page.locator('.evo__link', { hasText: 'Pichu' }).click()
    await expect(page).toHaveURL('/pokemon/172-pichu')
  })

  test('renvoie une vraie 404 pour un Pokémon inexistant', async ({ page }) => {
    const response = await page.goto('/pokemon/2000-inconnu')
    expect(response?.status()).toBe(404)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Un Pokémon sauvage a fui…')
  })

  test('liste les 1025 Pokémon par génération', async ({ page }) => {
    await gotoHydrated(page, '/pokemon')
    await expect(page.locator('.gen-block')).toHaveCount(9)
    await expect(page.locator('.gen-block .dex-cell')).toHaveCount(1025)
  })

  test('cherche un Pokémon par son nom ou son type', async ({ page }) => {
    await gotoHydrated(page, '/pokemon')
    const search = page.getByRole('searchbox', { name: 'Rechercher un Pokémon' })
    await search.fill('evoli')
    await expect(page.locator('.dex-cell')).toHaveText([/Évoli/])
    await expect(page.locator('.dex-search__status')).toHaveText('1 Pokémon trouvé')

    await search.fill('')
    await page.getByLabel('Filtrer par type').selectOption({ label: 'Dragon' })
    await expect(page.locator('.dex-cell', { hasText: 'Muplodocus' })).toBeVisible()
    await expect(page.locator('.dex-cell', { hasText: 'Pikachu' })).toHaveCount(0)

    await search.fill('pikachu')
    await expect(page.getByText('Aucun Pokémon ne correspond à ta recherche.')).toBeVisible()
    await page.getByRole('button', { name: 'Tout afficher' }).click()
    await expect(page.locator('.dex-cell')).toHaveCount(1025)
  })
})

test.describe('Référencement', () => {
  test('chaque fiche a un titre, une description et une image d’aperçu', async ({ page }) => {
    await gotoHydrated(page, '/pokemon/706-muplodocus')
    await expect(page).toHaveTitle('Muplodocus (n° 706) : types, stats, faiblesses et évolutions · PokéDate')
    await expect(page.locator(meta('description'))).toHaveAttribute('content', /Muplodocus \(n° 706\)/)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/pokemon\/706-muplodocus$/)
    await expect(page.locator(meta('og:image'))).toHaveAttribute('content', /\/sprites\/og\/706\.jpg$/)
    await expect(page.locator(meta('robots'))).toHaveAttribute('content', /^index/)
    const og = await page.request.get('/sprites/og/706.jpg')
    expect(og.headers()['content-type']).toBe('image/jpeg')
  })

  test('les pages personnelles ne sont pas indexées', async ({ page }) => {
    await gotoHydrated(page, '/?date=2026-10-17')
    await expect(page.locator(meta('robots'))).toHaveAttribute('content', 'noindex, follow')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/$/)
    await gotoHydrated(page, '/duel?pa=1&pb=4')
    await expect(page.locator(meta('robots'))).toHaveAttribute('content', 'noindex, follow')
  })

  test('l’accueil publie des données structurées valides', async ({ page }) => {
    await gotoHydrated(page, '/')
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents()
    const types = blocks.flatMap((b) => [JSON.parse(b)].flat().map((x: { '@type': string }) => x['@type']))
    expect(types).toEqual(expect.arrayContaining(['WebSite', 'WebApplication', 'FAQPage']))
  })

  test('sitemap et robots.txt sont servis', async ({ request }) => {
    const sitemap = await request.get('/sitemap.xml')
    expect(sitemap.headers()['content-type']).toContain('application/xml')
    const xml = await sitemap.text()
    expect(xml.match(/<url>/g)).toHaveLength(1029)
    expect(xml).toContain('/pokemon/1025-')
    const robots = await (await request.get('/robots.txt')).text()
    expect(robots).toContain('Sitemap: ')
  })
})

test.describe('Mentions légales', () => {
  test('sont accessibles depuis le pied de page', async ({ page }) => {
    await gotoHydrated(page, '/')
    await page.getByRole('contentinfo').getByRole('link', { name: 'Mentions légales' }).click()
    await expect(page).toHaveURL('/mentions-legales')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mentions légales')
    await expect(page.getByText('Cloudflare, Inc.')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Données personnelles' })).toBeVisible()
  })
})
