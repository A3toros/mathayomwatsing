import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: './index.html',
      output: {
        // Manual chunk splitting for role-based lazy loading
        manualChunks: {
          // Shared utilities (loaded by all roles)
          'shared': [
            'src/shared/auth.js',
            'src/shared/ui.js', 
            'src/shared/utils.js',
            'src/shared/debug.js',
            'src/shared/form-state.js'
          ],
          // Student chunk (lazy loaded for students only)
          'student': [
            'src/student/index.js',
            'src/student/student.js'
          ],
          // Teacher chunk (lazy loaded for teachers only)
          'teacher': [
            'src/teacher/index.js',
            'src/teacher/teacher.js',
            'src/teacher/teacher-subjects.js',
            'src/teacher/teacher-tests.js',
            'src/teacher/teacher-results.js'
          ],
          // Admin chunk (lazy loaded for admins only)
          'admin': [
            'src/admin/index.js',
            'src/admin/admin.js',
            'src/admin/admin-users.js',
            'src/admin/admin-content.js',
            'src/admin/admin-panel.js'
          ]
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
