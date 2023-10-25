// vite.config.ts
import { defineConfig } from "file:///Users/deka/Workspace/video-ir-services/app-frontend/node_modules/.pnpm/vite@4.4.9_@types+node@20.6.2_terser@5.22.0/node_modules/vite/dist/node/index.js";
import react from "file:///Users/deka/Workspace/video-ir-services/app-frontend/node_modules/.pnpm/@vitejs+plugin-react@4.0.4_vite@4.4.9/node_modules/@vitejs/plugin-react/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  },
  build: {
    emptyOutDir: true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvZGVrYS9Xb3Jrc3BhY2UvdmlkZW8taXItc2VydmljZXMvYXBwLWZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvZGVrYS9Xb3Jrc3BhY2UvdmlkZW8taXItc2VydmljZXMvYXBwLWZyb250ZW5kL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9kZWthL1dvcmtzcGFjZS92aWRlby1pci1zZXJ2aWNlcy9hcHAtZnJvbnRlbmQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3JlYWN0KCldLFxuICBzZXJ2ZXI6IHtcbiAgICBwcm94eToge1xuICAgICAgXCIvYXBpXCI6IHtcbiAgICAgICAgdGFyZ2V0OiBcImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMFwiLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICAgIHdzOiB0cnVlXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgZW1wdHlPdXREaXI6IHRydWUsXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBOFUsU0FBUyxvQkFBb0I7QUFDM1csT0FBTyxXQUFXO0FBR2xCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNqQixRQUFRO0FBQUEsSUFDTixPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsUUFDTixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxRQUFRO0FBQUEsUUFDUixJQUFJO0FBQUEsTUFDTjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxhQUFhO0FBQUEsRUFDZjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
