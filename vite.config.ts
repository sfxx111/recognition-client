import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import { resolve } from "path"
import fs from 'fs'

const https = {
  key: fs.readFileSync(resolve(__dirname, 'cert/localhost-key.pem')),
  cert: fs.readFileSync(resolve(__dirname, 'cert/localhost.pem')),
}

const base = process.env.VITE_BASE || "/"

export default defineConfig({
  base,
  plugins: [vue()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  server: {
    port: 443,
    https,
    proxy: {
      "/api": {
        // target: "http://127.0.0.1:8000", //本地后端
         target: "https://8.152.101.217/api/test/", //测试后端
        // target: "http://8.152.101.217/api/master/", //正式后端
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
})
