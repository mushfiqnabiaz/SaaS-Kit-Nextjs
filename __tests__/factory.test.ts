import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("db factory", () => {
  const originalDriver = process.env.DB_DRIVER;

  beforeEach(() => {
    vi.resetModules();
    process.env.DB_DRIVER = originalDriver;
  });

  afterEach(() => {
    process.env.DB_DRIVER = originalDriver;
  });

  it("throws when DB_DRIVER is not set", async () => {
    delete process.env.DB_DRIVER;
    const { getUserRepository } = await import("@/lib/db/factory");
    expect(() => getUserRepository()).toThrow(/DB_DRIVER must be set/);
  });

  it("throws when DB_DRIVER is invalid", async () => {
    process.env.DB_DRIVER = "mysql";
    const { getUserRepository } = await import("@/lib/db/factory");
    expect(() => getUserRepository()).toThrow(/DB_DRIVER must be set/);
  });

  it("returns MongoUserRepository when DB_DRIVER=mongo", async () => {
    process.env.DB_DRIVER = "mongo";
    const { getUserRepository, resetDbFactories } = await import("@/lib/db/factory");
    resetDbFactories();
    const repo = getUserRepository();
    expect(repo.constructor.name).toBe("MongoUserRepository");
  });

  it("returns PostgresUserRepository when DB_DRIVER=postgres", async () => {
    process.env.DB_DRIVER = "postgres";
    const { getUserRepository, resetDbFactories } = await import("@/lib/db/factory");
    resetDbFactories();
    const repo = getUserRepository();
    expect(repo.constructor.name).toBe("PostgresUserRepository");
  });

  it("memoizes repository instances", async () => {
    process.env.DB_DRIVER = "mongo";
    const { getUserRepository, resetDbFactories } = await import("@/lib/db/factory");
    resetDbFactories();
    const a = getUserRepository();
    const b = getUserRepository();
    expect(a).toBe(b);
  });
});

describe.skip("db factory integration", () => {
  it("connects to MongoDB and lists users", async () => {
    // Run with: DB_DRIVER=mongo MONGODB_URI=... npx vitest run -t integration
  });

  it("connects to PostgreSQL and lists users", async () => {
    // Run with: DB_DRIVER=postgres DATABASE_URL=... npx vitest run -t integration
  });
});
