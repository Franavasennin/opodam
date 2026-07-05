import { useEffect } from 'react'

const BASE_URL = 'https://opodam.netlify.app'

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(path: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', `${BASE_URL}${path}`)
}

/**
 * Actualiza title, meta description, canonical y Open Graph/Twitter en client-side.
 * No sustituye al prerender (Googlebot ejecuta JS con retraso; buscadores de IA no lo hacen),
 * pero da señales correctas para navegación SPA y para crawlers que sí renderizan.
 */
export function useSeo(opts: { title: string; description: string; path?: string; image?: string }) {
  const { title, description, path, image } = opts

  useEffect(() => {
    const fullTitle = title.includes('OpoDAM') ? title : `${title} · OpoDAM`
    document.title = fullTitle

    setMeta('name', 'description', description)
    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:type', 'website')
    setMeta('property', 'og:site_name', 'OpoDAM')
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', fullTitle)
    setMeta('name', 'twitter:description', description)

    const ogImage = `${BASE_URL}${image ?? '/og.png'}`
    setMeta('property', 'og:image', ogImage)
    setMeta('name', 'twitter:image', ogImage)

    const currentPath = path ?? (typeof window !== 'undefined' ? window.location.pathname : '/')
    setCanonical(currentPath)
    setMeta('property', 'og:url', `${BASE_URL}${currentPath}`)
  }, [title, description, path, image])
}
