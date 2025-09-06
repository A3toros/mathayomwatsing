import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html',
        matching: './matching-test-student.html'
      },
      output: {
        // Let Vite automatically handle chunk splitting for dynamic imports
        manualChunks: (id) => {
          // Group shared utilities
          if (id.includes('src/shared/')) {
            return 'shared';
          }
          // Group student modules
          if (id.includes('src/student/')) {
            return 'student';
          }
          // Group teacher modules
          if (id.includes('src/teacher/')) {
            return 'teacher';
          }
          // Group admin modules
          if (id.includes('src/admin/')) {
            return 'admin';
          }
        }
      }
    }
  },
  server: {
    port: 5173,
    host: true
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  esbuild: {
    target: 'es2020'
  }
})
