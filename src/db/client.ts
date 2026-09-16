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

export function getDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new DatabaseUnavailableError();

  if (!database) {
    database = drizzle(neon(connectionString), { schema });
  }

  return database;
}
