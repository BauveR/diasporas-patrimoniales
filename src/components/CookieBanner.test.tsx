import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import i18n from '../i18n/config'
import { CookieBanner } from './CookieBanner'

describe('CookieBanner', () => {
  beforeEach(() => localStorage.clear())
  afterEach(async () => { await i18n.changeLanguage('es') })

  it('en francés, con el enlace a la privacidad en /fr', async () => {
    await i18n.changeLanguage('fr')
    render(<MemoryRouter initialEntries={['/fr']}><CookieBanner /></MemoryRouter>)
    expect(screen.getByText(/Ce site n'utilise pas de cookies/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Politique de confidentialité' })).toHaveAttribute('href', '/fr/privacidad')
    expect(screen.getByRole('button', { name: 'Accepter' })).toBeInTheDocument()
  })
})
