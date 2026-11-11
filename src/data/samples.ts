import type { ReferencePhoto } from '../types/search'

/** Demo-only sample references. Marked clearly as Demo in the UI. */
export const SAMPLE_ITEMS: Array<{
  id: string
  name: string
  colour: string
  description: string
  photo: ReferencePhoto
}> = [
  {
    id: 'sample-wallet',
    name: 'Black wallet',
    colour: 'Black',
    description: 'Folded leather wallet',
    photo: {
      id: 'sample-wallet-photo',
      dataUrl: '/samples/wallet.jpg',
      source: 'sample',
      croppedDataUrl: '/samples/wallet.jpg',
    },
  },
  {
    id: 'sample-keys',
    name: 'House keys',
    colour: 'Silver',
    description: 'Keyring with two keys',
    photo: {
      id: 'sample-keys-photo',
      dataUrl: '/samples/keys.jpg',
      source: 'sample',
      croppedDataUrl: '/samples/keys.jpg',
    },
  },
  {
    id: 'sample-earbuds',
    name: 'Earbuds case',
    colour: 'White',
    description: 'Compact charging case',
    photo: {
      id: 'sample-earbuds-photo',
      dataUrl: '/samples/earbuds.jpg',
      source: 'sample',
      croppedDataUrl: '/samples/earbuds.jpg',
    },
  },
]
