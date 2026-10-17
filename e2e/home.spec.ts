import { expect, test } from '@playwright/test'
import { fillDate, gotoHydrated, readSharedLink, revealDate, trackConsoleErrors } from './helpers'

test.describe('Mon Pokémon', () => {
  test('révèle le Pokémon d’une date', async ({ page }) => {
    const errors = trackConsoleErrors(page)
    await revealDate(page, '17', '10', '2026')

    await expect(page).toHaveURL(/\?date=2026-10-17$/)
    await expect(page.locator('.formula__num')).toHaveText('N° 706')
    await expect(page.getByRole('heading', { level: 2, name: /Muplodocus/ })).toBeVisible()
    await expect(page.getByText('Dragon').first()).toBeVisible()
    await expect(page.locator('.mon-card__art')).toHaveAttribute('src', '/sprites/art/706.webp')
    await expect(page.locator('.site-nav .pill')).toContainText('1')
    expect(errors).toEqual([])
  })

  test('affiche une erreur claire pour une date impossible', async ({ page }) => {
    await gotoHydrated(page, '/')
    await fillDate(page, '.hero', '31', '02', '2026')
    await page.getByRole('button', { name: 'Révéler mon Pokémon' }).click()
    await expect(page.getByRole('alert')).toContainText("n'existe pas")
    await expect(page.locator('.mon-card')).toHaveCount(0)
    await expect(page.getByLabel('Jour')).toHaveAttribute('aria-invalid', 'true')
  })

  test('accuse la partie fausse de la date', async ({ page }) => {
    await gotoHydrated(page, '/')
    await fillDate(page, '.hero', '20', '09', '0000')
    await page.getByRole('button', { name: 'Révéler mon Pokémon' }).click()
    await expect(page.getByRole('alert')).toHaveText("L'an 0 n'existe pas… même chez les Pokémon.")
    await expect(page.getByLabel('Année')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByLabel('Jour')).not.toHaveAttribute('aria-invalid')
    await expect(page.getByLabel('Année')).toBeFocused()
  })

  test('demande une année à 4 chiffres', async ({ page }) => {
    await gotoHydrated(page, '/')
    await fillDate(page, '.hero', '17', '10', '26')
    await page.getByRole('button', { name: 'Révéler mon Pokémon' }).click()
    await expect(page.getByRole('alert')).toContainText('4 chiffres')
  })

  test('remplit la date en la collant d’un coup', async ({ page }) => {
    await gotoHydrated(page, '/')
    await page.getByLabel('Jour').focus()
    await page.evaluate(() => {
      const event = new Event('paste', { bubbles: true, cancelable: true })
      Object.defineProperty(event, 'clipboardData', { value: { getData: () => '17/10/2026' } })
      document.activeElement!.dispatchEvent(event)
    })
    await expect(page.getByLabel('Jour')).toHaveValue('17')
    await expect(page.getByLabel('Mois')).toHaveValue('10')
    await expect(page.getByLabel('Année')).toHaveValue('2026')
  })

  test('le bouton « Aujourd’hui » révèle le Pokémon du jour', async ({ page }) => {
    await gotoHydrated(page, '/')
    await page.getByRole('button', { name: "Aujourd'hui" }).click()
    await expect(page).toHaveURL(/\?date=\d{4}-\d{2}-\d{2}$/)
    await expect(page.locator('.mon-card')).toBeVisible()
  })

  test('« Au hasard » montre un Pokémon sans l’attraper', async ({ page }) => {
    await gotoHydrated(page, '/')
    await page.getByRole('button', { name: /Au hasard/ }).click()
    await expect(page).toHaveURL(/\?date=\d{4}-\d{2}-\d{2}&hasard=1$/)
    await expect(page.locator('.mon-card')).toBeVisible()
    await expect(page.locator('.site-nav .pill')).toContainText('0')
  })

  test('le menu ramène au dernier Pokémon révélé', async ({ page }) => {
    await revealDate(page, '17', '10', '2026')
    await page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('link', { name: 'Défis' }).click()
    await expect(page).toHaveURL('/duel')
    await page
      .getByRole('navigation', { name: 'Navigation principale' })
      .getByRole('link', { name: 'Mon Pokémon' })
      .click()
    await expect(page).toHaveURL(/\?date=2026-10-17$/)
    await expect(page.getByRole('heading', { level: 2, name: /Muplodocus/ })).toBeVisible()
    await page.getByRole('link', { name: 'PokéDate, accueil' }).click()
    await expect(page).toHaveURL('/')
  })

  test('publie son tirage dans les derniers tirages', async ({ page }, testInfo) => {
    const nickname = `Test ${testInfo.project.name}-${Date.now() % 10000}`
    await revealDate(page, '17', '10', '2026')
    const publish = page.getByRole('region', { name: 'Publier dans les derniers tirages' })
    await publish.getByLabel('Ton pseudo').fill('C0nnard')
    await publish.getByRole('button', { name: /Publier Muplodocus/ }).click()
    await expect(publish.getByRole('alert')).toContainText('ne passe pas')

    await publish.getByLabel('Ton pseudo').fill(nickname)
    await publish.getByRole('button', { name: /Publier Muplodocus/ }).click()
    await expect(publish.getByRole('status')).toContainText("C'est publié")
    await publish.getByRole('link', { name: 'Voir les derniers tirages' }).click()
    await expect(page).toHaveURL('/tirages')
    await expect(page.locator('.draws__item').first()).toContainText(`${nickname} a tiré Muplodocus`)
  })

  test('« Au hasard » ne propose pas de publier', async ({ page }) => {
    await gotoHydrated(page, '/')
    await page.getByRole('button', { name: /Au hasard/ }).click()
    await expect(page.locator('.mon-card')).toBeVisible()
    await expect(page.getByRole('region', { name: 'Publier dans les derniers tirages' })).toHaveCount(0)
  })

  test('une date miroir fait apparaître un Pokémon rare', async ({ page }) => {
    await revealDate(page, '04', '04', '1990')
    const banner = page.locator('.banner')
    await expect(banner).toContainText('Ta date est une date miroir : 04/04')
    await banner.click()
    await expect(page).toHaveURL(/\/pokemon\/10\d\d-/)
  })

  test('une date shiny affiche la version chromatique', async ({ page }) => {
    await gotoHydrated(page, '/?date=1990-04-06')
    await expect(page.locator('.mon-card__shiny-badge')).toBeVisible()
    await expect(page.locator('.mon-card__art')).toHaveAttribute('src', /art-shiny/)
  })

  test('le lien partagé ne contient pas la date de naissance', async ({ page }) => {
    await revealDate(page, '17', '10', '2026')
    const copied = await readSharedLink(page)
    await page.getByRole('button', { name: /Partager/ }).click()
    const text = await copied()
    expect(text).toContain('/pokemon/706-muplodocus?partage=1')
    expect(text).not.toMatch(/2026|17\/10|date=/)
  })

  test('un lien partagé invite à tester sa propre date', async ({ page }) => {
    await gotoHydrated(page, '/pokemon/706-muplodocus?partage=1')
    const banner = page.locator('.banner--top')
    await expect(banner).toContainText('est tombé·e sur Muplodocus')
    await banner.click()
    await expect(page).toHaveURL('/')
    await expect(page.getByLabel('Jour')).toBeVisible()
  })

  test('la FAQ n’ouvre qu’une réponse à la fois', async ({ page }) => {
    await gotoHydrated(page, '/')
    const questions = page.locator('.faq details')
    await questions.nth(0).locator('summary').click()
    await expect(page.getByText(/Le 17\/10\/2026 donne 7, 0 et 6/)).toBeVisible()
    await questions.nth(1).locator('summary').click()
    await expect(questions.nth(1)).toHaveAttribute('open', '')
    await expect(questions.nth(0)).not.toHaveAttribute('open', '')
  })
})

test('le formulaire fonctionne même avant le chargement du JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/')
  await page.getByLabel('Jour').fill('17')
  await page.getByLabel('Mois').fill('10')
  await page.getByLabel('Année').fill('2026')
  await page.getByRole('button', { name: 'Révéler mon Pokémon' }).click()
  await expect(page).toHaveURL(/\?date=2026-10-17$/)
  await expect(page.getByRole('heading', { level: 2, name: /Muplodocus/ })).toBeVisible()
  await context.close()
})
