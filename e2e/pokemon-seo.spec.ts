import { expect, test } from '@playwright/test'
import { gotoHydrated } from './helpers'

const meta = (name: string) => `meta[name="${name}"], meta[property="${name}"]`

test.describe('Fiches Pokémon', () => {
  test('redirige l’ancienne adresse vers l’adresse lisible', { tag: '@server' }, async ({ page }) => {
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

  test('renvoie une vraie 404 pour un Pokémon inexistant', { tag: '@server' }, async ({ page }) => {
    const response = await page.goto('/pokemon/2000-inconnu')
    expect(response?.status()).toBe(404)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Un Pokémon sauvage a fui…')
  })

  test('explique quelles dates donnent le Pokémon', async ({ page }) => {
    await gotoHydrated(page, '/pokemon/25-pikachu')
    const section = page.getByRole('region', { name: 'Quelles dates donnent Pikachu ?' })
    await expect(section).toContainText('le jour finit par 0 (10, 20 ou 30)')
    await expect(section).toContainText('le mois finit par 2 (février ou décembre)')
    await expect(section).toContainText('20/02/1995')
    await expect(section.locator('time')).toHaveAttribute('datetime', /^\d{4}-02-[123]0$/)
  })

  test('explique la date miroir d’un Pokémon bonus', async ({ page }) => {
    await gotoHydrated(page, '/pokemon/1010')
    await expect(page.getByRole('region', { name: /Quelles dates donnent/ })).toContainText('date miroir')
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

test.describe('Référencement', { tag: '@server' }, () => {
  test('chaque fiche a un titre, une description et une image d’aperçu', async ({ page }) => {
    await gotoHydrated(page, '/pokemon/706-muplodocus')
    await expect(page).toHaveTitle('Muplodocus (n° 706) : dates de naissance, types et stats · PokéDate')
    await expect(page.locator(meta('description'))).toHaveAttribute('content', /Muplodocus \(n°\s706\)/)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/pokemon\/706-muplodocus$/)
    await expect(page.locator(meta('og:image'))).toHaveAttribute('content', /\/sprites\/og\/706\.jpg$/)
    await expect(page.locator(meta('robots'))).toHaveAttribute('content', /^index/)
    const og = await page.request.get('/sprites/og/706.jpg')
    expect(og.headers()['content-type']).toBe('image/jpeg')
  })

  test('la fiche anglaise a son adresse, son titre et ses liens de langue', async ({ page }) => {
    await gotoHydrated(page, '/en/pokemon/706-goodra')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB')
    await expect(page).toHaveTitle('Goodra (no. 706): birth dates, types and stats · PokéDate')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/en\/pokemon\/706-goodra$/)
    await expect(page.locator('link[hreflang="fr"]')).toHaveAttribute('href', /\/pokemon\/706-muplodocus$/)
    await expect(page.locator(meta('og:image'))).toHaveAttribute('content', /\/sprites\/og-en\/706\.jpg$/)
  })

  test('les pages personnelles ne sont pas indexées', async ({ page }) => {
    await gotoHydrated(page, '/?date=2026-10-17')
    await expect(page.locator(meta('robots'))).toHaveAttribute('content', 'noindex, follow')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /pokedate\.fr\/?$/)
    await gotoHydrated(page, '/duel?pa=1&pb=4')
    await expect(page.locator(meta('robots'))).toHaveAttribute('content', 'noindex, follow')
  })

  test('l’accueil publie des données structurées valides', async ({ page }) => {
    await gotoHydrated(page, '/')
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents()
    const types = blocks.flatMap((b) => [JSON.parse(b)].flat().map((x: { '@type': string }) => x['@type']))
    expect(types).toEqual(expect.arrayContaining(['WebSite', 'WebApplication', 'FAQPage']))
  })

  test('le site est installable comme une appli', async ({ page, request }) => {
    await gotoHydrated(page, '/')
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest')
    const response = await request.get('/manifest.webmanifest')
    expect(response.headers()['content-type']).toContain('manifest+json')
    const manifest = await response.json()
    expect(manifest).toMatchObject({ name: 'PokéDate', start_url: '/', display: 'standalone' })
    for (const icon of manifest.icons) expect((await request.get(icon.src)).headers()['content-type']).toBe('image/png')
  })

  test('sitemap et robots.txt sont servis', async ({ request }) => {
    const sitemap = await request.get('/sitemap.xml')
    expect(sitemap.headers()['content-type']).toContain('application/xml')
    const xml = await sitemap.text()
    expect(xml.match(/<url>/g)).toHaveLength(2060)
    expect(xml).toContain('/pokemon/1025-')
    expect(xml).toContain('/en/pokemon/1025-')
    expect(xml).toContain('hreflang="en"')
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

test.describe('Mesure d’audience', () => {
  test('?stats=off exclut ce navigateur des statistiques', async ({ page }) => {
    await gotoHydrated(page, '/?stats=off')
    await expect(page.getByRole('status')).toContainText('ne sont plus comptées')
    await expect(page).toHaveURL('/')
    expect(await page.evaluate(() => localStorage.getItem('pokedate.stats-off'))).toBe('1')
    await gotoHydrated(page, '/?stats=on')
    await expect(page.getByRole('status')).toContainText('de nouveau comptées')
    expect(await page.evaluate(() => localStorage.getItem('pokedate.stats-off'))).toBeNull()
  })

  test('affiche l’activité du jour sur la page des tirages', async ({ page, request, baseURL }) => {
    const headers = { origin: baseURL!, 'cf-connecting-ip': `e2e-activity-${Date.now()}` }
    // The whole block reads the published draws: two Pikachu, one of them shiny, show every line.
    for (const shiny of [true, false])
      await request.post('/api/draws', { data: { pokemonId: 25, shiny, bonusPokemonId: null, nickname: '' }, headers })
    await gotoHydrated(page, '/tirages')
    const activity = page.getByRole('region', { name: "Aujourd'hui sur PokéDate" })
    await expect(activity).toContainText('Pokémon révélés')
    await expect(activity).toContainText('shiny')
    await expect(activity).toContainText('Le plus tiré cette semaine')
    await expect(activity.locator('.activity__count')).toHaveText(/^×([2-9]|\d{2,})$/)
    await expect(page.getByRole('heading', { name: 'Pokémon révélés' })).toBeVisible()
  })

  test('compte les actions connues et refuse le reste', { tag: '@server' }, async ({ request, baseURL }) => {
    const headers = { origin: baseURL! }
    expect((await request.post('/api/events', { data: { name: 'duel' }, headers })).status()).toBe(204)
    expect((await request.post('/api/events', { data: { name: 'nimportequoi' }, headers })).status()).toBe(400)
    const foreign = await request.post('/api/events', {
      data: { name: 'duel' },
      headers: { origin: 'https://evil.example' },
    })
    expect(foreign.status()).toBe(403)
  })
})
