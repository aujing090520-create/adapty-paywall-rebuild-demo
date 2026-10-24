import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: { include: ['react-best-gradient-color-picker'] },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (/\/node_modules\/(?:@tiptap\/|prosemirror-|(?:orderedmap|rope-sequence|w3c-keyname|linkifyjs|fast-equals)\/)/.test(id)) return 'text-editor';
          if (/\/node_modules\/(opentype\.js|string\.prototype\.codepointat|tiny-inflate)\//.test(id)) return 'font-parser';
          if (id.includes('/node_modules/fflate/')) return 'zip-parser';
          if (id.endsWith('/builder/tablerCatalog.json')) return 'icon-catalog';
          if (/\/node_modules\/(react-best-gradient-color-picker|html2canvas|css-line-break|text-segmentation|base64-arraybuffer|utrie|lodash\.throttle)\//.test(id)) return 'color-picker';
          if (id.includes('/node_modules/')) return 'vendor';
          if (id.includes('/templates/') || /\/revenueCat[^/]+\.(js|json)$/.test(id)) return 'templates';
        },
      },
    },
  },
});
