import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://nishon.com.np",
  output: "static",
  build: {
    format: "file"
  }
});
