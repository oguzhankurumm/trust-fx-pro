import { defineConfig } from "prisma/config";
import path from "node:path";
import { config } from "dotenv";

// Load .env file for Prisma CLI (Next.js loads .env.local at runtime)
config({ path: path.resolve(process.cwd(), ".env") });
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});
