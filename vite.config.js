import path from "path"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "favicon.ico", "robots.txt", "apple-touch-icon.png"],
      manifest: {
        name: "Toko IFA",
        short_name: "Toko IFA",
        description: "Toko Sembako Ifa",
        theme_color: "#ffffff",
        icons: [
          {
            src: "/src/assets/ShopIcon.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/src/assets/ShopIcon.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "/src/assets/ShopIcon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  }
})
