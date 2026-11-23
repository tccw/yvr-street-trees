import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

const HTML_META: Record<string, { title: string; description: string }> = {
  metro: {
    title: 'Metro Van Tree Map',
    description:
      'An interactive map of over 210,000 public trees across Vancouver, New Westminster, and the City of North Vancouver.',
  },
  victoria: {
    title: 'Victoria Tree Map',
    description:
      'An interactive map of nearly 35,000 public and park trees across the City of Victoria.',
  },
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDebug =
    process.argv.includes('--debug') ||
    process.env.VITE_DEBUG === 'true' ||
    mode === 'debug'

  const city = process.env.VITE_CITY === 'victoria' ? 'victoria' : 'metro'
  const meta = HTML_META[city]

  return {
    plugins: [
      react(),
      {
        name: 'city-html-meta',
        transformIndexHtml(html) {
          return html
            .replace(/<title>.*?<\/title>/, `<title>${meta.title}</title>`)
            .replace(
              /(<meta\s+name="description"\s+content=")[^"]*(")/s,
              `$1${meta.description}$2`
            )
        },
      },
    ],
    define: {
      __APP_DEBUG__: JSON.stringify(isDebug),
    },
  }
})
