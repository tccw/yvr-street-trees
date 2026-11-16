import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDebug =
    process.argv.includes('--debug') ||
    process.env.VITE_DEBUG === 'true' ||
    mode === 'debug'

  return {
    plugins: [react()],
    define: {
      __APP_DEBUG__: JSON.stringify(isDebug),
    },
  }
})
