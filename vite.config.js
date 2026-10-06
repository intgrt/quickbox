// Vite Configuration for QuickBox Development
// Optional Vite configuration. npm run dev uses dev-server.cjs instead.
// External media access is opt-in and limited to one explicitly named folder.

export default {
  server: {
    host: '127.0.0.1',
    port: 5174,
    strictPort: true,
    fs: {
      // Allow serving files from outside the project root
      // This is specific to THIS Vite instance and does not affect other projects
      allow: [
        // Default: current project directory
        '.',
        ...(process.env.QUICKBOX_MEDIA_ROOT ? [process.env.QUICKBOX_MEDIA_ROOT] : [])
      ]
    }
  }
}
