import { ImageSourcePropType } from 'react-native';

export const CROP_ASSETS: Record<string, ImageSourcePropType> = {
  'bawang merah': require('../../assets/images/crops/bawang_merah.jpg'),
  'bayam': require('../../assets/images/crops/bayam.jpg'),
  'bayam hijau': require('../../assets/images/crops/bayam.jpg'),
  'cabai merah': require('../../assets/images/crops/cabai_merah.jpg'),
  'cabai rawit': require('../../assets/images/crops/cabai_rawit.jpg'),
  'daun bawang': require('../../assets/images/crops/daun_bawang.jpg'),
  'kacang panjang': require('../../assets/images/crops/kacang_panjang.jpg'),
  'kangkung': require('../../assets/images/crops/kangkung.jpg'),
  'kangkung darat': require('../../assets/images/crops/kangkung.jpg'),
  'kemangi': require('../../assets/images/crops/kemangi.jpg'),
  'daun kemangi': require('../../assets/images/crops/kemangi.jpg'),
  'mentimun': require('../../assets/images/crops/mentimun.jpg'),
  'timun': require('../../assets/images/crops/mentimun.jpg'),
  'pare': require('../../assets/images/crops/pare.jpg'),
  'peria': require('../../assets/images/crops/pare.jpg'),
  'sawi': require('../../assets/images/crops/sawi.jpg'),
  'sawi hijau': require('../../assets/images/crops/sawi.jpg'),
  'caisim': require('../../assets/images/crops/sawi.jpg'),
  'pakcoy': require('../../assets/images/crops/sawi.jpg'),
  'bok choy': require('../../assets/images/crops/sawi.jpg'),
  'selada': require('../../assets/images/crops/selada.jpg'),
  'selada hijau': require('../../assets/images/crops/selada.jpg'),
  'terong': require('../../assets/images/crops/terong.jpg'),
  'terong ungu': require('../../assets/images/crops/terong.jpg'),
  'terung': require('../../assets/images/crops/terong.jpg'),
  'tomat': require('../../assets/images/crops/tomat.jpg'),
  'tomat cherry': require('../../assets/images/crops/tomat.jpg'),
  'wortel': require('../../assets/images/crops/wortel.jpg'),
};

export function getCropImageSource(name?: string, fallbackUri?: string): ImageSourcePropType {
  if (!name && fallbackUri) {
    return { uri: fallbackUri };
  }
  const cleanName = (name || '').toLowerCase().trim();

  // 1. Direct key match
  if (CROP_ASSETS[cleanName]) {
    return CROP_ASSETS[cleanName];
  }

  // 2. Substring match
  for (const [key, asset] of Object.entries(CROP_ASSETS)) {
    if (cleanName.includes(key) || key.includes(cleanName)) {
      return asset;
    }
  }

  // 3. Fallback remote URI if provided
  if (fallbackUri) {
    return { uri: fallbackUri };
  }

  // 4. Default fallback asset
  return CROP_ASSETS['sawi'];
}

// For string-only URL compatibility
export function getCropImage(name?: string): string {
  return '';
}
