import { pgTable, text, serial, integer, boolean, timestamp, uniqueIndex, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  discriminator: text("discriminator").notNull(),
  balance: integer("balance").notNull().default(1000),
  level: integer("level").notNull().default(0),
  xp: integer("xp").notNull().default(0),
  gamesPlayed: integer("games_played").notNull().default(0),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  lastDaily: timestamp("last_daily"),
  lastWork: timestamp("last_work"),
  avatar: text("avatar").default("https://cdn.discordapp.com/embed/avatars/0.png"),
});

export const gameHistory = pgTable("game_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  gameType: text("game_type").notNull(), // 'blackjack', 'coinflip', 'daily', 'work', etc.
  betAmount: integer("bet_amount"),
  outcome: text("outcome").notNull(), // 'win', 'loss', 'reward'
  winAmount: integer("win_amount"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  gameData: jsonb("game_data"),
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  awarded: timestamp("awarded").notNull().defaultNow(),
  xpAwarded: integer("xp_awarded").notNull().default(100),
});

export const leaderboard = pgTable("leaderboard", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  balance: integer("balance").notNull(),
  level: integer("level").notNull(),
  wins: integer("wins").notNull(),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

// Schemas for insert operations
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  discriminator: true,
  avatar: true,
});

export const insertGameHistorySchema = createInsertSchema(gameHistory).pick({
  userId: true,
  gameType: true,
  betAmount: true,
  outcome: true,
  winAmount: true,
  gameData: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).pick({
  userId: true,
  title: true,
  description: true,
  xpAwarded: true,
});

export const updateUserSchema = z.object({
  balance: z.number().optional(),
  level: z.number().optional(),
  xp: z.number().optional(),
  gamesPlayed: z.number().optional(),
  wins: z.number().optional(),
  losses: z.number().optional(),
  lastDaily: z.date().optional(),
  lastWork: z.date().optional(),
});

// Types for insert operations
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertGameHistory = z.infer<typeof insertGameHistorySchema>;
export type GameHistory = typeof gameHistory.$inferSelect;

export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;

export type UpdateUser = z.infer<typeof updateUserSchema>;

// Command cooldown constants (in milliseconds)
export const COOLDOWNS = {
  DAILY: 24 * 60 * 60 * 1000, // 24 hours
  WORK: 10 * 60 * 1000, // 10 minutes
  VOTE: 12 * 60 * 60 * 1000, // 12 hours
};

// Game types
export type BlackjackCard = {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  value: 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
  numericValue: number;
};

export type BlackjackGameState = {
  playerHand: BlackjackCard[];
  dealerHand: BlackjackCard[];
  playerValue: number;
  dealerValue: number;
  betAmount: number;
  status: 'active' | 'player_won' | 'dealer_won' | 'push' | 'player_blackjack';
  userId: number;
};

export type CoinflipGameState = {
  choice: 'heads' | 'tails';
  result: 'heads' | 'tails' | null;
  betAmount: number;
  status: 'active' | 'won' | 'lost';
  userId: number;
};
