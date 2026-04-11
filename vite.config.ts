import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    chunkSizeWarningLimit: 550,
    rollupOptions: {
      output: {
        manualChunks: {
          'recharts': ['recharts', 'react', 'react-dom'],
          'data': [
            './src/data/screws.ts',
            './src/data/materials.ts',
            './src/data/washers.ts',
            './src/data/nuts.ts',
            './src/data/friction.ts',
            './src/data/receivers.ts',
          ],
          'calc': [
            './src/calc/torque.ts',
            './src/calc/jointStiffness.ts',
            './src/calc/operatingState.ts',
            './src/calc/preloadRealism.ts',
            './src/calc/surfacePressure.ts',
            './src/calc/threadStripping.ts',
            './src/domain/useCase/computeResults.ts',
          ],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
});
