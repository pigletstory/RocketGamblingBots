import { 
  users, type User, type InsertUser, type UpdateUser,
  gameHistory, type GameHistory, type InsertGameHistory,
  achievements, type Achievement, type InsertAchievement,
  leaderboard,
  BlackjackGameState,
  CoinflipGameState
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string, discriminator: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: UpdateUser): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Game history operations
  addGameHistory(gameHistory: InsertGameHistory): Promise<GameHistory>;
  getUserGameHistory(userId: number, limit?: number): Promise<GameHistory[]>;
  
  // Achievement operations
  addAchievement(achievement: InsertAchievement): Promise<Achievement>;
  getUserAchievements(userId: number): Promise<Achievement[]>;
  
  // Leaderboard operations
  getLeaderboard(sortBy: 'balance' | 'level' | 'wins', limit?: number): Promise<User[]>;
  
  // Game state operations
  saveBlackjackState(state: BlackjackGameState): Promise<void>;
  getBlackjackState(userId: number): Promise<BlackjackGameState | undefined>;
  
  saveCoinflipState(state: CoinflipGameState): Promise<void>;
  getCoinflipState(userId: number): Promise<CoinflipGameState | undefined>;
}

import { db } from './db';
import { eq, desc, and } from 'drizzle-orm';

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string, discriminator: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      and(
        eq(users.username, username),
        eq(users.discriminator, discriminator)
      )
    );
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, userData: UpdateUser): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Game history operations
  async addGameHistory(insertGameHistory: InsertGameHistory): Promise<GameHistory> {
    const [entry] = await db
      .insert(gameHistory)
      .values(insertGameHistory)
      .returning();
    return entry;
  }

  async getUserGameHistory(userId: number, limit: number = 10): Promise<GameHistory[]> {
    return await db
      .select()
      .from(gameHistory)
      .where(eq(gameHistory.userId, userId))
      .orderBy(desc(gameHistory.timestamp))
      .limit(limit);
  }

  // Achievement operations
  async addAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    const [achievement] = await db
      .insert(achievements)
      .values(insertAchievement)
      .returning();
    
    // Add XP to user for achievement
    const user = await this.getUser(insertAchievement.userId);
    if (user) {
      const xpToAdd = insertAchievement.xpAwarded ?? 100; // Default to 100 XP if not specified
      await this.updateUser(user.id, {
        xp: user.xp + xpToAdd
      });
    }
    
    return achievement;
  }

  async getUserAchievements(userId: number): Promise<Achievement[]> {
    return await db
      .select()
      .from(achievements)
      .where(eq(achievements.userId, userId));
  }

  // Leaderboard operations
  async getLeaderboard(sortBy: 'balance' | 'level' | 'wins' = 'balance', limit: number = 5): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users[sortBy]))
      .limit(limit);
  }

  // For game states, we'll store them in a local Map for now
  // In a real implementation, we might want to add these to the database schema
  private blackjackStates: Map<number, BlackjackGameState> = new Map();
  private coinflipStates: Map<number, CoinflipGameState> = new Map();
  
  async saveBlackjackState(state: BlackjackGameState): Promise<void> {
    this.blackjackStates.set(state.userId, state);
  }

  async getBlackjackState(userId: number): Promise<BlackjackGameState | undefined> {
    return this.blackjackStates.get(userId);
  }

  async saveCoinflipState(state: CoinflipGameState): Promise<void> {
    this.coinflipStates.set(state.userId, state);
  }

  async getCoinflipState(userId: number): Promise<CoinflipGameState | undefined> {
    return this.coinflipStates.get(userId);
  }
}

export const storage = new DatabaseStorage();
