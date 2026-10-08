import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  // Load .env.local into process.env for the API middleware only — not exposed to the client bundle.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "tend-api",
        configureServer(server) {
          server.middlewares.use("/api/ai", async (req, res) => {
            const { handleAi } = await server.ssrLoadModule("/server/handler.ts");
            return handleAi(req, res);
          });
        },
      },
    ],
  };
});
