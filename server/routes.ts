import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  updateUserSchema, 
  insertGameHistorySchema, 
  insertAchievementSchema,
  COOLDOWNS
} from "@shared/schema";
import { z } from "zod";
import { dealCards, hitCard, dealerPlay, calculateWinnings as calculateBlackjackWinnings } from "./games/blackjack";
import { flipCoin, calculateWinnings as calculateCoinflipWinnings } from "./games/coinflip";

export async function registerRoutes(app: Express): Promise<Server> {
  // Define validation schemas for requests
  const userParamsSchema = z.object({
    id: z.coerce.number(),
  });

  const gameParamsSchema = z.object({
    type: z.enum(["blackjack", "coinflip", "daily", "work"]),
  });

  const betSchema = z.object({
    amount: z.coerce.number().positive(),
  });

  const coinflipSchema = z.object({
    choice: z.enum(["heads", "tails"]),
    amount: z.coerce.number().positive(),
  });

  // User Routes
  app.get("/api/users", async (_req, res) => {
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.get("/api/users/:id", async (req, res) => {
    const result = userParamsSchema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await storage.getUser(result.data.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  });

  app.post("/api/users", async (req, res) => {
    const result = insertUserSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        message: "Invalid user data", 
        errors: result.error.format() 
      });
    }

    const existingUser = await storage.getUserByUsername(
      result.data.username,
      result.data.discriminator
    );
    
    if (existingUser) {
      return res.json(existingUser);
    }

    const user = await storage.createUser(result.data);
    res.status(201).json(user);
  });

  app.patch("/api/users/:id", async (req, res) => {
    const paramsResult = userParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const bodyResult = updateUserSchema.safeParse(req.body);
    if (!bodyResult.success) {
      return res.status(400).json({ 
        message: "Invalid update data", 
        errors: bodyResult.error.format() 
      });
    }

    const updatedUser = await storage.updateUser(
      paramsResult.data.id,
      bodyResult.data
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser);
  });

  // Game History Routes
  app.get("/api/users/:id/history", async (req, res) => {
    const result = userParamsSchema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const history = await storage.getUserGameHistory(result.data.id, limit);
    res.json(history);
  });

  // Achievement Routes
  app.get("/api/users/:id/achievements", async (req, res) => {
    const result = userParamsSchema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const achievements = await storage.getUserAchievements(result.data.id);
    res.json(achievements);
  });

  // Leaderboard Routes
  app.get("/api/leaderboard", async (req, res) => {
    const sortBy = (req.query.sortBy as 'balance' | 'level' | 'wins') || 'balance';
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    
    const leaderboard = await storage.getLeaderboard(sortBy, limit);
    res.json(leaderboard);
  });

  // Command Routes
  app.post("/api/users/:id/commands/daily", async (req, res) => {
    const result = userParamsSchema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await storage.getUser(result.data.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if daily command is on cooldown
    const now = new Date();
    if (user.lastDaily && now.getTime() - user.lastDaily.getTime() < COOLDOWNS.DAILY) {
      const remainingTime = Math.ceil((COOLDOWNS.DAILY - (now.getTime() - user.lastDaily.getTime())) / 1000 / 60);
      
      return res.status(400).json({
        message: `Daily reward is on cooldown. Try again in ${remainingTime} minutes.`,
        cooldown: {
          total: COOLDOWNS.DAILY / 1000 / 60,
          remaining: remainingTime
        }
      });
    }

    // Calculate daily reward based on level
    const reward = 1000 + (user.level * 100);

    // Update user
    const updatedUser = await storage.updateUser(user.id, {
      balance: user.balance + reward,
      lastDaily: now
    });

    // Add to game history
    await storage.addGameHistory({
      userId: user.id,
      gameType: "daily",
      outcome: "reward",
      winAmount: reward,
      gameData: {}
    });

    // Check for achievement
    const achievements = await storage.getUserAchievements(user.id);
    const hasConsistentPlayerAchievement = achievements.some(
      achievement => achievement.title === "Consistent Player"
    );

    if (!hasConsistentPlayerAchievement) {
      // Check user game history for daily commands
      const history = await storage.getUserGameHistory(user.id, 100);
      const dailyCommands = history.filter(
        game => game.gameType === "daily"
      );

      // If user has used daily command 5 times, give achievement
      if (dailyCommands.length >= 5) {
        await storage.addAchievement({
          userId: user.id,
          title: "Consistent Player",
          description: "Use the daily command 5 days in a row",
          xpAwarded: 100
        });
      }
    }

    res.json({
      user: updatedUser,
      reward,
      message: `You received ${reward} cash from your daily reward!`
    });
  });

  app.post("/api/users/:id/commands/work", async (req, res) => {
    const result = userParamsSchema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await storage.getUser(result.data.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if work command is on cooldown
    const now = new Date();
    if (user.lastWork && now.getTime() - user.lastWork.getTime() < COOLDOWNS.WORK) {
      const remainingTime = Math.ceil((COOLDOWNS.WORK - (now.getTime() - user.lastWork.getTime())) / 1000);
      
      return res.status(400).json({
        message: `Work is on cooldown. Try again in ${remainingTime} seconds.`,
        cooldown: {
          total: COOLDOWNS.WORK / 1000,
          remaining: remainingTime
        }
      });
    }

    // Calculate work reward (randomized between 100-500)
    const reward = Math.floor(Math.random() * 401) + 100;

    // Update user
    const updatedUser = await storage.updateUser(user.id, {
      balance: user.balance + reward,
      lastWork: now
    });

    // Add to game history
    await storage.addGameHistory({
      userId: user.id,
      gameType: "work",
      outcome: "reward",
      winAmount: reward,
      gameData: {}
    });

    res.json({
      user: updatedUser,
      reward,
      message: `You worked hard and earned ${reward} cash!`
    });
  });

  // Game Routes
  app.post("/api/users/:id/games/blackjack/start", async (req, res) => {
    const paramsResult = userParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const bodyResult = betSchema.safeParse(req.body);
    if (!bodyResult.success) {
      return res.status(400).json({ 
        message: "Invalid bet amount", 
        errors: bodyResult.error.format() 
      });
    }

    const user = await storage.getUser(paramsResult.data.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const betAmount = bodyResult.data.amount;
    
    // Validate bet amount
    if (betAmount > user.balance) {
      return res.status(400).json({ 
        message: "Insufficient funds for this bet" 
      });
    }

    // Start blackjack game
    const gameState = dealCards(user.id, betAmount);

    // Check for blackjack
    if (gameState.status === 'player_blackjack') {
      const winnings = calculateBlackjackWinnings(gameState);
      
      // Update user balance
      await storage.updateUser(user.id, {
        balance: user.balance - betAmount + winnings,
        wins: user.wins + 1,
        gamesPlayed: user.gamesPlayed + 1,
        xp: user.xp + 100
      });

      // Add to game history
      await storage.addGameHistory({
        userId: user.id,
        gameType: "blackjack",
        betAmount,
        outcome: "win",
        winAmount: winnings - betAmount,
        gameData: gameState
      });

      return res.json({
        gameState,
        message: "Blackjack! You win!",
        winnings
      });
    }

    // Store game state for this user
    await storage.saveBlackjackState(gameState);

    // Subtract bet amount from user's balance
    await storage.updateUser(user.id, {
      balance: user.balance - betAmount
    });

    res.json({
      gameState,
      message: "Game started! Your move."
    });
  });

  app.post("/api/users/:id/games/blackjack/hit", async (req, res) => {
    const result = userParamsSchema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await storage.getUser(result.data.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get current game state
    const gameState = await storage.getBlackjackState(user.id);
    if (!gameState) {
      return res.status(400).json({ message: "No active blackjack game" });
    }

    // Hit
    const updatedGameState = hitCard(gameState);
    await storage.saveBlackjackState(updatedGameState);

    // Check if game is over after hit
    if (updatedGameState.status !== 'active') {
      const winnings = calculateBlackjackWinnings(updatedGameState);
      
      // Update user stats
      const wins = updatedGameState.status === 'player_won' ? user.wins + 1 : user.wins;
      const losses = updatedGameState.status === 'dealer_won' ? user.losses + 1 : user.losses;
      const xpGain = updatedGameState.status === 'player_won' ? 100 : 0;
      
      await storage.updateUser(user.id, {
        balance: user.balance + winnings,
        wins,
        losses,
        gamesPlayed: user.gamesPlayed + 1,
        xp: user.xp + xpGain
      });

      // Add to game history
      await storage.addGameHistory({
        userId: user.id,
        gameType: "blackjack",
        betAmount: updatedGameState.betAmount,
        outcome: updatedGameState.status === 'player_won' ? 'win' : 'loss',
        winAmount: winnings > 0 ? winnings - updatedGameState.betAmount : 0,
        gameData: updatedGameState
      });

      // Check for high roller achievement (bet 10,000 or more)
      if (updatedGameState.betAmount >= 10000) {
        const achievements = await storage.getUserAchievements(user.id);
        const hasHighRollerAchievement = achievements.some(
          achievement => achievement.title === "High Roller"
        );

        if (!hasHighRollerAchievement) {
          await storage.addAchievement({
            userId: user.id,
            title: "High Roller",
            description: "Bet 10,000 or more in a single game",
            xpAwarded: 100
          });
        }
      }

      // Check for Blackjack Master achievement (win 20 games)
      if (updatedGameState.status === 'player_won' && wins >= 20) {
        const achievements = await storage.getUserAchievements(user.id);
        const hasBlackjackMasterAchievement = achievements.some(
          achievement => achievement.title === "Blackjack Master"
        );

        if (!hasBlackjackMasterAchievement) {
          await storage.addAchievement({
            userId: user.id,
            title: "Blackjack Master",
            description: "Win 20 games of blackjack",
            xpAwarded: 100
          });
        }
      }

      let message = "";
      if (updatedGameState.status === 'player_won') {
        message = "You win!";
      } else if (updatedGameState.status === 'dealer_won') {
        message = "Bust! Dealer wins.";
      } else if (updatedGameState.status === 'push') {
        message = "Push! It's a tie.";
      }

      return res.json({
        gameState: updatedGameState,
        message,
        winnings
      });
    }

    res.json({
      gameState: updatedGameState,
      message: "Hit successful. Your move."
    });
  });

  app.post("/api/users/:id/games/blackjack/stand", async (req, res) => {
    const result = userParamsSchema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await storage.getUser(result.data.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get current game state
    const gameState = await storage.getBlackjackState(user.id);
    if (!gameState) {
      return res.status(400).json({ message: "No active blackjack game" });
    }

    // Dealer plays
    const finalGameState = dealerPlay(gameState);
    const winnings = calculateBlackjackWinnings(finalGameState);
    
    // Update user stats
    const wins = finalGameState.status === 'player_won' ? user.wins + 1 : user.wins;
    const losses = finalGameState.status === 'dealer_won' ? user.losses + 1 : user.losses;
    const xpGain = finalGameState.status === 'player_won' ? 100 : 0;
    
    await storage.updateUser(user.id, {
      balance: user.balance + winnings,
      wins,
      losses,
      gamesPlayed: user.gamesPlayed + 1,
      xp: user.xp + xpGain
    });

    // Add to game history
    await storage.addGameHistory({
      userId: user.id,
      gameType: "blackjack",
      betAmount: finalGameState.betAmount,
      outcome: finalGameState.status === 'player_won' ? 'win' : 
              finalGameState.status === 'push' ? 'push' : 'loss',
      winAmount: winnings > 0 ? winnings - finalGameState.betAmount : 0,
      gameData: finalGameState
    });

    // Check for high roller achievement (bet 10,000 or more)
    if (finalGameState.betAmount >= 10000) {
      const achievements = await storage.getUserAchievements(user.id);
      const hasHighRollerAchievement = achievements.some(
        achievement => achievement.title === "High Roller"
      );

      if (!hasHighRollerAchievement) {
        await storage.addAchievement({
          userId: user.id,
          title: "High Roller",
          description: "Bet 10,000 or more in a single game",
          xpAwarded: 100
        });
      }
    }

    // Check for Blackjack Master achievement (win 20 games)
    if (finalGameState.status === 'player_won' && wins >= 20) {
      const achievements = await storage.getUserAchievements(user.id);
      const hasBlackjackMasterAchievement = achievements.some(
        achievement => achievement.title === "Blackjack Master"
      );

      if (!hasBlackjackMasterAchievement) {
        await storage.addAchievement({
          userId: user.id,
          title: "Blackjack Master",
          description: "Win 20 games of blackjack",
          xpAwarded: 100
        });
      }
    }

    let message = "";
    if (finalGameState.status === 'player_won') {
      message = "You win!";
    } else if (finalGameState.status === 'dealer_won') {
      message = "Dealer wins.";
    } else if (finalGameState.status === 'push') {
      message = "Push! It's a tie.";
    }

    res.json({
      gameState: finalGameState,
      message,
      winnings
    });
  });

  app.post("/api/users/:id/games/coinflip", async (req, res) => {
    const paramsResult = userParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const bodyResult = coinflipSchema.safeParse(req.body);
    if (!bodyResult.success) {
      return res.status(400).json({ 
        message: "Invalid coinflip parameters", 
        errors: bodyResult.error.format() 
      });
    }

    const user = await storage.getUser(paramsResult.data.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { choice, amount } = bodyResult.data;
    
    // Validate bet amount
    if (amount > user.balance) {
      return res.status(400).json({ 
        message: "Insufficient funds for this bet" 
      });
    }

    // Flip coin
    const gameState = flipCoin(user.id, choice, amount);
    const winnings = calculateCoinflipWinnings(gameState);
    
    // Update user stats
    const wins = gameState.status === 'won' ? user.wins + 1 : user.wins;
    const losses = gameState.status === 'lost' ? user.losses + 1 : user.losses;
    const xpGain = gameState.status === 'won' ? 100 : 0;
    
    await storage.updateUser(user.id, {
      balance: user.balance - amount + winnings,
      wins,
      losses,
      gamesPlayed: user.gamesPlayed + 1,
      xp: user.xp + xpGain
    });

    // Add to game history
    await storage.addGameHistory({
      userId: user.id,
      gameType: "coinflip",
      betAmount: amount,
      outcome: gameState.status === 'won' ? 'win' : 'loss',
      winAmount: winnings > 0 ? winnings - amount : 0,
      gameData: gameState
    });

    res.json({
      gameState,
      message: gameState.status === 'won' ? 
        `You flipped ${choice} and won!` : 
        `You flipped ${choice}, but it was ${gameState.result}. You lost!`,
      winnings
    });
  });

  // Level up route
  app.post("/api/users/:id/levelup", async (req, res) => {
    const result = userParamsSchema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await storage.getUser(result.data.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Calculate XP needed for next level (1000 * current level)
    const xpNeeded = 1000 * (user.level + 1);
    
    if (user.xp < xpNeeded) {
      return res.status(400).json({ 
        message: "Not enough XP to level up",
        currentXp: user.xp,
        xpNeeded
      });
    }

    // Level up user
    const updatedUser = await storage.updateUser(user.id, {
      level: user.level + 1,
      xp: user.xp - xpNeeded
    });

    res.json({
      user: updatedUser,
      message: `Congratulations! You are now level ${updatedUser?.level}!`
    });
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
