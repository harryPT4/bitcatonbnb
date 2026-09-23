import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";

let database: NeonHttpDatabase<typeof schema> | null = null;

export class DatabaseUnavailableError extends Error {
  constructor() {
    super("The leaderboard database is not configured");
    this.name = "DatabaseUnavailableError";
  }
}

export class DatabaseEnvironmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseEnvironmentError";
  }
}

function assertSafeDatabaseEnvironment() {
  const deploymentEnvironment = process.env.VERCEL_ENV;
  const databaseEnvironment = process.env.DATABASE_ENV;

  // Preview deployments fail closed unless their database is explicitly labelled preview.
  // Production currently has no DATABASE_ENV label, so this guard does not alter the live site.
  if (deploymentEnvironment === "preview" && databaseEnvironment !== "preview") {
    throw new DatabaseEnvironmentError("Preview deployment is not connected to the preview database");
  }

  // Once production is labelled, prevent it from accidentally using a non-production branch.
  if (deploymentEnvironment === "production" && databaseEnvironment && databaseEnvironment !== "production") {
    throw new DatabaseEnvironmentError("Production deployment is connected to a non-production database");
  }
}

export function getDatabase() {
  assertSafeDatabaseEnvironment();
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new DatabaseUnavailableError();

  if (!database) {
    database = drizzle(neon(connectionString), { schema });
  }

  return database;
}
