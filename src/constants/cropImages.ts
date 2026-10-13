import { ImageSourcePropType } from 'react-native';

export const DEFAULT_CROP_IMAGE =
  'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=600';

export function getCropImageSource(name?: string, imageUrl?: string): ImageSourcePropType {
  if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:'))) {
    return { uri: imageUrl };
  }

  return { uri: DEFAULT_CROP_IMAGE };
}

export function getCropImage(name?: string, imageUrl?: string): string {
  if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:'))) {
    return imageUrl;
  }
  return DEFAULT_CROP_IMAGE;
}

export const CROP_ASSETS: Record<string, ImageSourcePropType> = {};
