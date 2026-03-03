// Vite Configuration for QuickBox Development
// This configuration allows the dev server to access client media folders
// outside the project root directory during development.

export default {
  server: {
    fs: {
      // Allow serving files from outside the project root
      // This is specific to THIS Vite instance and does not affect other projects
      allow: [
        // Default: current project directory
        '.',
        // Allow access to ALL project folders under this parent directory
        // This allows QuickBox to access any project's media folder
        'D:/Datafiles5/_Projects and Ideas/_Active 2024'
      ]
    }
  }
}
