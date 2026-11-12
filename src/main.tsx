import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import App from './App.tsx'
import { I18nProvider } from './i18n/I18nProvider'
import { initGA4, initMetaPixel } from './lib/marketing'

const ga4Id = import.meta.env.VITE_GA4_ID as string | undefined
const metaPixelId = import.meta.env.VITE_META_PIXEL_ID as string | undefined
if (ga4Id) initGA4(ga4Id)
if (metaPixelId) initMetaPixel(metaPixelId)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <I18nProvider>
          <App />
        </I18nProvider>
      </BrowserRouter>
    </HelmetProvider>
    <Analytics />
  </StrictMode>,
)
