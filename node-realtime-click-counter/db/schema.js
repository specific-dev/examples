import { integer, pgTable } from "drizzle-orm/pg-core";

export const clicksTable = pgTable("clicks", {
  id: integer("id").primaryKey(),
  count: integer("count").notNull().default(0),
});
