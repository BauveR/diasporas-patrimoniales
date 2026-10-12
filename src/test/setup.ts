import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
// Los componentes traducidos (useTranslation) necesitan i18n iniciado; en
// español por defecto, como la web.
import '../i18n/config'

afterEach(cleanup)
