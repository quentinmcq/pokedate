import { expect, test } from '@playwright/test'
import { fillDate, gotoHydrated, readSharedLink, revealDate } from './helpers'

test.describe('Duel', () => {
  test('oppose deux dates et désigne un vainqueur', async ({ page }) => {
    await gotoHydrated(page, '/duel')
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
    await gotoHydrated(page, '/duel?pa=235&pb=578&na=Quentin&nb=L%C3%A9a')
    await expect(page.locator('#verdict')).toBeVisible()
    const copied = await readSharedLink(page)
    await page.getByRole('button', { name: /Partager le duel/ }).click()
    const text = await copied()
    expect(text).toContain('/duel?pa=235&pb=578')
    expect(text).not.toMatch(/\d{4}-\d{2}-\d{2}/)
  })

  test('un duel partagé montre le résultat, puis propose la revanche', async ({ page }) => {
    await gotoHydrated(page, '/duel?pa=235&pb=578&na=Quentin&nb=L%C3%A9a')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText("Duel d'anniversaires")
    const rematch = page.getByRole('form', { name: 'Ta revanche ?' })
    await expect(rematch).toBeVisible()
    const verdictBox = await page.locator('#verdict').boundingBox()
    const rematchBox = await rematch.boundingBox()
    expect(verdictBox!.y).toBeLessThan(rematchBox!.y)
  })

  test('« Défier » pré-remplit ma date', async ({ page }) => {
    await revealDate(page, '17', '10', '2026')
    await page.getByRole('link', { name: 'Défier', exact: true }).click()
    await expect(page).toHaveURL(/\/duel\?a=2026-10-17/)
    const side = page.locator('.duel-form__side').first()
    await expect(side.getByLabel('Jour')).toHaveValue('17')
  })

  test('tronque les prénoms trop longs venus de l’URL', async ({ page }) => {
    await gotoHydrated(page, `/duel?pa=1&pb=4&na=${'A'.repeat(200)}`)
    await expect(page.locator('.fighter__player').first()).toHaveText('A'.repeat(20))
  })

  test('ignore des numéros de Pokémon invalides', async ({ page }) => {
    await gotoHydrated(page, '/duel?pa=0&pb=99999')
    await expect(page.locator('.duel-result')).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText("Duel d'anniversaires")
  })
})

test.describe('Pokédex', () => {
  test('garde les Pokémon découverts, même après rechargement', async ({ page }) => {
    await gotoHydrated(page, '/pokedex')
    await expect(page.getByText('Ton Pokédex est vide.')).toBeVisible()

    await revealDate(page, '17', '10', '2026')
    await gotoHydrated(page, '/pokedex')
    await expect(page.locator('.dex-stats')).toContainText('1 / 1025')
    await page.reload()
    const cell = page.locator('.dex-cell', { hasText: 'Muplodocus' })
    await expect(cell).toBeVisible()
    await cell.click()
    await expect(page).toHaveURL('/pokemon/706-muplodocus')
  })

  test('un Pokédex vide invite à révéler son premier Pokémon', async ({ page }) => {
    await gotoHydrated(page, '/pokedex')
    await expect(page.getByRole('progressbar')).toHaveCount(0)
    await expect(page.getByLabel('Masquer les Pokémon jamais vus')).toHaveCount(0)
    await page.getByRole('link', { name: 'Révéler mon premier Pokémon' }).click()
    await expect(page).toHaveURL('/')
  })

  test('enregistre le tirage même si on quitte la page avant que la carte s’affiche', async ({ page }) => {
    await gotoHydrated(page, '/')
    await page.route('**/api/pokemon/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 4000))
      await route.continue()
    })
    await page.getByRole('button', { name: /Au hasard/ }).click()
    await expect(page).toHaveURL(/hasard=1/)
    await page
      .getByRole('navigation', { name: 'Navigation principale' })
      .getByRole('link', { name: /Pokédex/ })
      .click()
    await expect(page).toHaveURL('/pokedex')
    await expect(page.locator('.dex-stats')).toContainText('1 vu')
  })

  test('une fiche consultée compte comme vue, pas comme attrapée', async ({ page }) => {
    await gotoHydrated(page, '/pokemon/25-pikachu')
    await gotoHydrated(page, '/pokedex')
    await expect(page.locator('.dex-stats')).toContainText('0 / 1025 attrapés')
    await expect(page.locator('.dex-stats')).toContainText('1 vu')
    await expect(page.locator('.dex-cell--seen')).toContainText('Pikachu')
  })

  test('transfère le Pokédex vers un autre appareil', async ({ page, browser, baseURL }) => {
    await revealDate(page, '17', '10', '2026')
    await gotoHydrated(page, '/pokedex')
    await page.getByRole('button', { name: 'Transférer mon Pokédex' }).click()
    await expect(page.getByRole('img', { name: /QR code/ })).toBeVisible()
    const copied = await readSharedLink(page)
    await page.getByRole('button', { name: 'Copier le lien' }).click()
    const transferLink = await copied()
    expect(transferLink).toMatch(/\/pokedex#transfert=1\.[\w-]+$/)

    const otherDevice = await browser.newContext({ baseURL })
    const otherPage = await otherDevice.newPage()
    await gotoHydrated(otherPage, transferLink.replace(/^https?:\/\/[^/]+/, ''))
    await expect(otherPage.getByRole('region', { name: "Un Pokédex t'attend" })).toContainText('1 Pokémon attrapé')
    await otherPage.getByRole('button', { name: 'Ajouter à mon Pokédex' }).click()
    await expect(otherPage.locator('.dex-stats')).toContainText('1 / 1025 attrapés')
    await expect(otherPage).toHaveURL(/\/pokedex$/)
    await otherDevice.close()
  })

  test('fête le premier objectif et le montre dans le Pokédex', async ({ page }) => {
    await revealDate(page, '17', '10', '2026')
    await expect(page.locator('.toast--visible')).toContainText('Objectif atteint : Premier Pokémon !', {
      timeout: 6000,
    })
    await gotoHydrated(page, '/pokedex')
    await expect(page.getByRole('heading', { name: 'Tes objectifs' })).toBeVisible()
    await expect(page.locator('.goals__summary')).toContainText('1 / 22 objectifs atteints')
  })

  test('peut afficher les 1025 cases', async ({ page }) => {
    await revealDate(page, '17', '10', '2026')
    await gotoHydrated(page, '/pokedex')
    await page.getByLabel('Masquer les Pokémon jamais vus').uncheck()
    await expect(page.locator('.dex-grid > li')).toHaveCount(1025)
  })
})

test.describe('Navigation', () => {
  test('l’onglet Défis réunit le duel et le tournoi', async ({ page }) => {
    await gotoHydrated(page, '/')
    const mainNav = page.getByRole('navigation', { name: 'Navigation principale' })
    await expect(mainNav.getByRole('link')).toHaveText([/Mon Pokémon/, /Défis/, /Pokédex/, /Tirages/])
    await mainNav.getByRole('link', { name: 'Défis' }).click()
    await expect(page).toHaveURL('/duel')
    await page.getByRole('navigation', { name: 'Type de défi' }).getByRole('link', { name: 'Tournoi' }).click()
    await expect(page).toHaveURL('/tournoi')
    await expect(mainNav.getByRole('link', { name: 'Défis' })).toHaveAttribute('aria-current', 'page')
    await mainNav.getByRole('link', { name: /Pokédex/ }).click()
    await expect(page).toHaveURL('/pokedex')
    await mainNav.getByRole('link', { name: 'Défis' }).click()
    await expect(page).toHaveURL('/tournoi')
  })

  test('le curseur de section va droit vers la page choisie', async ({ page }) => {
    await gotoHydrated(page, '/pokedex')
    await page.evaluate(() => {
      const sectionSwitch = document.querySelector<HTMLElement>('.section-switch')!
      const positions: string[] = []
      Object.assign(window, { indicatorPositions: positions })
      new MutationObserver(() => positions.push(sectionSwitch.style.getPropertyValue('--active-index'))).observe(
        sectionSwitch,
        { attributeFilter: ['style'] },
      )
    })
    await page
      .getByRole('navigation', { name: 'Vue du Pokédex' })
      .getByRole('link', { name: 'Tous les Pokémon' })
      .click()
    await expect(page).toHaveURL('/pokemon')
    await expect(page.locator('.gen-block')).toHaveCount(9)
    expect(
      await page.evaluate(() => (window as unknown as { indicatorPositions: string[] }).indicatorPositions),
    ).toEqual(['1'])
  })
})

test.describe('Tournoi', () => {
  test('classe 3 joueurs sans mettre leurs dates dans le lien', async ({ page }) => {
    await gotoHydrated(page, '/tournoi')
    const rows = page.locator('.players__row')
    const players = [
      ['Quentin', '12', '03', '1995'],
      ['Léa', '25', '07', '1998'],
      ['Max', '17', '10', '2026'],
    ] as const
    for (const [index, [name, day, month, year]] of players.entries()) {
      await rows
        .nth(index)
        .getByRole('textbox', { name: /Prénom/ })
        .fill(name)
      await fillDate(page, `.players__row >> nth=${index}`, day, month, year)
    }
    await page.getByRole('button', { name: /Lancer le tournoi/ }).click()

    await expect(page.locator('.ranking__row')).toHaveCount(3)
    await expect(page.locator('#ranking-title')).toContainText('gagne avec')
    await expect(page).toHaveURL(/p=235&p=578&p=706/)
    expect(page.url()).not.toMatch(/1995|1998|2026/)
    await expect(page.locator('.site-nav .pill')).toContainText('3')
  })

  test('remonte jusqu’au classement dès le premier lancement', async ({ page }) => {
    await page.route('**/api/pokemon/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      await route.continue()
    })
    await gotoHydrated(page, '/tournoi')
    const dates = [
      ['12', '03', '1995'],
      ['25', '07', '1998'],
      ['17', '10', '2026'],
    ] as const
    for (const [index, [day, month, year]] of dates.entries())
      await fillDate(page, `.players__row >> nth=${index}`, day, month, year)
    await page.getByRole('button', { name: /Lancer le tournoi/ }).click()
    await expect(page.locator('.ranking__row')).toHaveCount(3, { timeout: 8000 })
    await expect
      .poll(() =>
        page.evaluate(() => Math.round(document.querySelector('.tournament-result')!.getBoundingClientRect().top)),
      )
      .toBeLessThan(120)
  })

  test('ajoute et retire des joueurs entre 3 et 8', async ({ page }) => {
    await gotoHydrated(page, '/tournoi')
    await expect(page.getByRole('button', { name: /Retirer le joueur/ })).toHaveCount(0)
    const addPlayer = page.getByRole('button', { name: 'Ajouter un joueur' })
    for (let added = 0; added < 5; added++) await addPlayer.click()
    await expect(page.locator('.players__row')).toHaveCount(8)
    await expect(page.getByRole('button', { name: '8 joueurs maximum' })).toBeDisabled()
    await page.getByRole('button', { name: 'Retirer le joueur 8' }).click()
    await expect(page.locator('.players__row')).toHaveCount(7)
  })

  test('signale le joueur dont la date est fausse', async ({ page }) => {
    await gotoHydrated(page, '/tournoi')
    await page
      .locator('.players__row')
      .nth(1)
      .getByRole('textbox', { name: /Prénom/ })
      .fill('Léa')
    await fillDate(page, '.players__row >> nth=0', '01', '01', '2000')
    await fillDate(page, '.players__row >> nth=1', '31', '02', '2000')
    await page.getByRole('button', { name: /Lancer le tournoi/ }).click()
    await expect(page.getByRole('alert')).toHaveText("Léa : Le 31/02 n'existe pas… même chez les Pokémon.")
  })
})
