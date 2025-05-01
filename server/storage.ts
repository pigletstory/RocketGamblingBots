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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private gameHistories: Map<number, GameHistory[]>;
  private achievements: Map<number, Achievement[]>;
  private blackjackStates: Map<number, BlackjackGameState>;
  private coinflipStates: Map<number, CoinflipGameState>;
  
  private userId: number;
  private gameHistoryId: number;
  private achievementId: number;

  constructor() {
    this.users = new Map();
    this.gameHistories = new Map();
    this.achievements = new Map();
    this.blackjackStates = new Map();
    this.coinflipStates = new Map();
    
    this.userId = 1;
    this.gameHistoryId = 1;
    this.achievementId = 1;

    // Add a default user
    this.createUser({
      username: "CasinoMaster",
      discriminator: "1234",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=48&h=48&q=80"
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string, discriminator: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username && user.discriminator === discriminator
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = {
      id,
      ...insertUser,
      balance: 1000,
      level: 0,
      xp: 0,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      lastDaily: null,
      lastWork: null,
    };
    this.users.set(id, user);
    this.gameHistories.set(id, []);
    this.achievements.set(id, []);
    return user;
  }

  async updateUser(id: number, userData: UpdateUser): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Game history operations
  async addGameHistory(insertGameHistory: InsertGameHistory): Promise<GameHistory> {
    const id = this.gameHistoryId++;
    const timestamp = new Date();
    
    const gameHistoryEntry: GameHistory = {
      id,
      ...insertGameHistory,
      timestamp,
    };
    
    const userGames = this.gameHistories.get(insertGameHistory.userId) || [];
    userGames.unshift(gameHistoryEntry); // Add new games to the beginning for easier retrieval
    this.gameHistories.set(insertGameHistory.userId, userGames);
    
    return gameHistoryEntry;
  }

  async getUserGameHistory(userId: number, limit: number = 10): Promise<GameHistory[]> {
    const userGames = this.gameHistories.get(userId) || [];
    return userGames.slice(0, limit);
  }

  // Achievement operations
  async addAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    const id = this.achievementId++;
    const awarded = new Date();
    
    const achievement: Achievement = {
      id,
      ...insertAchievement,
      awarded,
    };
    
    const userAchievements = this.achievements.get(insertAchievement.userId) || [];
    userAchievements.push(achievement);
    this.achievements.set(insertAchievement.userId, userAchievements);
    
    // Add XP to user for achievement
    const user = await this.getUser(insertAchievement.userId);
    if (user) {
      await this.updateUser(user.id, {
        xp: user.xp + insertAchievement.xpAwarded
      });
    }
    
    return achievement;
  }

  async getUserAchievements(userId: number): Promise<Achievement[]> {
    return this.achievements.get(userId) || [];
  }

  // Leaderboard operations
  async getLeaderboard(sortBy: 'balance' | 'level' | 'wins' = 'balance', limit: number = 5): Promise<User[]> {
    const allUsers = Array.from(this.users.values());
    
    return allUsers
      .sort((a, b) => b[sortBy] - a[sortBy])
      .slice(0, limit);
  }

  // Game state operations
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

export const storage = new MemStorage();
