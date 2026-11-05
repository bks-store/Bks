// Visuels du site. Pour mettre vos propres photos : déposez-les dans public/images/
// en gardant le même nom de fichier, ou changez le chemin ici.
// Les photos actuelles sont des visuels d'illustration (Unsplash), pas les produits réels de BKS.
import type { Product } from '../data/products'

export const IMAGES = {
  logo: {
    mark: '/images/brand/logo-bks-mark.png',
    monogram: '/images/brand/logo-bks-monogram.png',
    onDark: '/images/brand/logo-bks-3d-clean.png',
  },
  hero: '/images/hero/hero-main.jpg',
  categories: {
    sneakers: '/images/categories/sneakers.jpg',
    streetwear: '/images/categories/streetwear.jpg',
    nouveautes: '/images/categories/nouveautes.jpg',
  },
  brand: '/images/store/damien.jpg',
  store: '/images/store/boutique.jpg',
  instagram: [
    '/images/instagram/ig-1.jpg',
    '/images/instagram/ig-2.jpg',
    '/images/instagram/ig-3.jpg',
    '/images/instagram/ig-4.jpg',
    '/images/instagram/ig-5.jpg',
    '/images/instagram/ig-6.jpg',
  ],
  products: {
    'jordan-1-pink':      '/images/products/jordan-1-pink.jpg',
    'af1-black-tiffany':  '/images/products/af1-black-tiffany.jpg',
    'dunk-low-olive':     '/images/products/dunk-low-olive.jpg',
    'sb-dunk-safari':     '/images/products/sb-dunk-safari.jpg',
    'af1-world-tour':     '/images/products/af1-world-tour.jpg',
    'adidas-benito':      '/images/products/adidas-benito.jpg',
    'sb-dunk-purple':     '/images/products/sb-dunk-purple.jpg',
    'timberland-wheat':   '/images/products/timberland-wheat.jpg',
    'ugg-ultra-mini':     '/images/products/ugg-ultra-mini.jpg',
    'air-max-1-black-red':'/images/products/air-max-1-black-red.jpg',
    'dunk-low-grey':      '/images/products/dunk-low-grey.jpg',
    'nike-calm-mint':     '/images/products/nike-calm-mint.jpg',
    'gt-cut-black':       '/images/products/gt-cut-black.jpg',
    'nike-calm-beige':    '/images/products/nike-calm-beige.jpg',
    'af1-chinese-ny':     '/images/products/af1-chinese-ny.jpg',
  } as Record<string, string>,
}

// Transforme les URLs Supabase Storage vers l'API de rendu optimisé (resize + WebP)
export function optimizeStorageUrl(url: string, width = 600): string {
  if (!url?.includes('/storage/v1/object/public/')) return url
  return url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/') + `?width=${width}&quality=80`
}

export function productImage(product: Pick<Product, 'id' | 'images'>): string | undefined {
  const url = product.images[0] ?? IMAGES.products[product.id]
  return url ? optimizeStorageUrl(url) : undefined
}
