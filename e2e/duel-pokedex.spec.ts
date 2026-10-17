import { expect, test } from '@playwright/test'
import { fillDate, readSharedLink, revealDate } from './helpers'

test.describe('Duel', () => {
  test('oppose deux dates et désigne un vainqueur', async ({ page }) => {
    await page.goto('/duel')
    await page.getByLabel('Prénom du joueur 1').fill('Quentin')
    await page.getByLabel('Prénom du joueur 2').fill('Léa')
    await fillDate(page, '.duel-form__side >> nth=0', '12', '03', '1995')
    await fillDate(page, '.duel-form__side >> nth=1', '25', '07', '1998')
    await page.getByRole('button', { name: /Lancer le combat/ }).click()

    await expect(page.locator('#verdict')).toHaveText('Léa gagne avec Méios !')
    await expect(page.locator('.fighter--win')).toContainText('Méios')
    await expect(page).toHaveURL(/pa=235&pb=578/)
    expect(page.url()).not.toMatch(/1995|1998/)
  })

  test('le lien du duel ne contient aucune date', async ({ page }) => {
    await page.goto('/duel?pa=235&pb=578&na=Quentin&nb=L%C3%A9a')
    await expect(page.locator('#verdict')).toBeVisible()
    const copied = await readSharedLink(page)
    await page.getByRole('button', { name: /Partager le duel/ }).click()
    const text = await copied()
    expect(text).toContain('/duel?pa=235&pb=578')
    expect(text).not.toMatch(/\d{4}-\d{2}-\d{2}/)
  })

  test('« Défier un ami » pré-remplit ma date', async ({ page }) => {
    await revealDate(page, '17', '10', '2026')
    await page.getByRole('link', { name: /Défier un ami/ }).click()
    await expect(page).toHaveURL(/\/duel\?a=2026-10-17/)
    const side = page.locator('.duel-form__side').first()
    await expect(side.getByLabel('Jour')).toHaveValue('17')
  })

  test('tronque les prénoms trop longs venus de l’URL', async ({ page }) => {
    await page.goto(`/duel?pa=1&pb=4&na=${'A'.repeat(200)}`)
    await expect(page.locator('.fighter__player').first()).toHaveText('A'.repeat(20))
  })

  test('ignore des numéros de Pokémon invalides', async ({ page }) => {
    await page.goto('/duel?pa=0&pb=99999')
    await expect(page.locator('.duel-result')).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText("Duel d'anniversaires")
  })
})

test.describe('Pokédex', () => {
  test('garde les Pokémon découverts, même après rechargement', async ({ page }) => {
    await page.goto('/pokedex')
    await expect(page.getByText('Ton Pokédex est vide.')).toBeVisible()

    await revealDate(page, '17', '10', '2026')
    await page.goto('/pokedex')
    await expect(page.locator('.dex-stats')).toContainText('1 / 1025')
    await page.reload()
    const cell = page.locator('.dex-cell', { hasText: 'Muplodocus' })
    await expect(cell).toBeVisible()
    await cell.click()
    await expect(page).toHaveURL('/pokemon/706-muplodocus')
  })

  test('peut afficher les 1025 cases', async ({ page }) => {
    await page.goto('/pokedex')
    await page.getByLabel('Afficher seulement les découverts').uncheck()
    await expect(page.locator('.dex-grid > li')).toHaveCount(1025)
  })
})
