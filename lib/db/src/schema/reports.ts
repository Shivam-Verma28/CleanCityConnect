import {
  pgTable,
  serial,
  text,
  integer,
  doublePrecision,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const reportsTable = pgTable(
  "reports",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    imagePath: text("image_path").notNull(),
    locationLabel: text("location_label").notNull(),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    description: text("description").notNull(),
    status: text("status").notNull().default("pending"),
    pointsAwarded: integer("points_awarded").notNull().default(0),
    adminNote: text("admin_note"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    decidedByUserId: integer("decided_by_user_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userIdx: index("reports_user_idx").on(table.userId),
    statusIdx: index("reports_status_idx").on(table.status),
  }),
);

export type Report = typeof reportsTable.$inferSelect;
