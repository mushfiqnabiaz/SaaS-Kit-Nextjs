import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./models/postgres/schema.ts",
  out: "./models/postgres/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/saas_boilerplate",
  },
});
