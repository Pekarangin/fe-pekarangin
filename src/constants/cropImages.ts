import { ImageSourcePropType } from 'react-native';

export const DEFAULT_CROP_IMAGE =
  'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=600';

/**
 * Pemetaan gambar 15 komoditas pangan hasil kurasi AI & database Pekarang.in
 */
export const CROP_DEFAULT_IMAGES: Record<string, string> = {
  'cabai rawit': 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&q=80&w=600',
  'cabai merah': 'https://images.unsplash.com/photo-1526346698789-22fd84314424?auto=format&fit=crop&q=80&w=600',
  'bawang merah': 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&q=80&w=600',
  'tomat': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600',
  'bayam': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=600',
  'kangkung': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=600',
  'selada': 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?auto=format&fit=crop&q=80&w=600',
  'sawi': 'https://images.unsplash.com/photo-1550950158-d0d960dff51b?auto=format&fit=crop&q=80&w=600',
  'wortel': 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&q=80&w=600',
  'terong': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=600',
  'kacang panjang': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=600',
  'mentimun': 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=format&fit=crop&q=80&w=600',
  'pare': 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&q=80&w=600',
  'kemangi': 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&q=80&w=600',
  'daun bawang': 'https://images.unsplash.com/photo-1587049352847-4a222e784d38?auto=format&fit=crop&q=80&w=600',
};

function resolveCropImageUrl(name?: string, imageUrl?: string): string {
  if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:'))) {
    return imageUrl;
  }

  if (name) {
    const key = name.toLowerCase().trim();
    if (CROP_DEFAULT_IMAGES[key]) {
      return CROP_DEFAULT_IMAGES[key];
    }
    for (const [k, url] of Object.entries(CROP_DEFAULT_IMAGES)) {
      if (key.includes(k) || k.includes(key)) {
        return url;
      }
    }
  }

  return DEFAULT_CROP_IMAGE;
}

export function getCropImageSource(name?: string, imageUrl?: string): ImageSourcePropType {
  const url = resolveCropImageUrl(name, imageUrl);
  return { uri: url };
}

export function getCropImage(name?: string, imageUrl?: string): string {
  return resolveCropImageUrl(name, imageUrl);
}

export const CROP_ASSETS: Record<string, ImageSourcePropType> = {};
