declare global {
  interface Window {
    cloudinary?: {
      openMediaLibrary: (
        options: { cloud_name: string; api_key: string; multiple?: boolean },
        callbacks: { insertHandler: (data: { assets: Array<{ secure_url: string }> }) => void }
      ) => void
    }
  }
}

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string
const CLOUD_KEY  = import.meta.env.VITE_CLOUDINARY_API_KEY  as string

export function openCloudinaryPicker(onSelect: (url: string) => void) {
  window.cloudinary?.openMediaLibrary(
    { cloud_name: CLOUD_NAME, api_key: CLOUD_KEY, multiple: false },
    { insertHandler: (data) => { if (data.assets[0]) onSelect(data.assets[0].secure_url) } }
  )
}
