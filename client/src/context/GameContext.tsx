import { createContext, useContext, useState, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useUser } from './UserContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// Types based on schema
export interface BlackjackCard {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  value: 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
  numericValue: number;
}

export interface BlackjackGameState {
  playerHand: BlackjackCard[];
  dealerHand: BlackjackCard[];
  playerValue: number;
  dealerValue: number;
  betAmount: number;
  status: 'active' | 'player_won' | 'dealer_won' | 'push' | 'player_blackjack';
  userId: number;
}

export interface CoinflipGameState {
  choice: 'heads' | 'tails';
  result: 'heads' | 'tails' | null;
  betAmount: number;
  status: 'active' | 'won' | 'lost';
  userId: number;
}

export interface GameHistoryItem {
  id: number;
  userId: number;
  gameType: string;
  betAmount: number | null;
  outcome: 'win' | 'loss' | 'push' | 'reward';
  winAmount: number | null;
  timestamp: string;
  gameData: any;
}

// Define what the context will expose
interface GameContextType {
  // Blackjack
  blackjackGame: BlackjackGameState | null;
  startBlackjack: (betAmount: number) => Promise<void>;
  hitCard: () => Promise<void>;
  stand: () => Promise<void>;
  isBlackjackActive: boolean;
  
  // Coinflip
  coinflipGame: CoinflipGameState | null;
  playCoinflip: (choice: 'heads' | 'tails', betAmount: number) => Promise<void>;
  
  // Game history
  gameHistory: GameHistoryItem[];
  fetchGameHistory: () => Promise<void>;
  isLoadingHistory: boolean;
  refreshHistory: () => void;
}

// Create context with a default value
const GameContext = createContext<GameContextType>({
  blackjackGame: null,
  startBlackjack: async () => {},
  hitCard: async () => {},
  stand: async () => {},
  isBlackjackActive: false,
  
  coinflipGame: null,
  playCoinflip: async () => {},
  
  gameHistory: [],
  fetchGameHistory: async () => {},
  isLoadingHistory: false,
  refreshHistory: () => {},
});

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [blackjackGame, setBlackjackGame] = useState<BlackjackGameState | null>(null);
  const [coinflipGame, setCoinflipGame] = useState<CoinflipGameState | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Blackjack mutations
  const startBlackjackMutation = useMutation({
    mutationFn: async ({ userId, betAmount }: { userId: number, betAmount: number }) => {
      const response = await apiRequest('POST', `/api/users/${userId}/games/blackjack/start`, { amount: betAmount });
      return response.json();
    },
    onSuccess: (data) => {
      setBlackjackGame(data.gameState);
      if (data.message) {
        toast({
          title: "Blackjack",
          description: data.message,
        });
      }
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/history`] });
    },
    onError: (error) => {
      toast({
        title: "Blackjack Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const hitCardMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest('POST', `/api/users/${userId}/games/blackjack/hit`, {});
      return response.json();
    },
    onSuccess: (data) => {
      setBlackjackGame(data.gameState);
      if (data.message) {
        toast({
          title: "Blackjack",
          description: data.message,
        });
      }
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/history`] });
    },
    onError: (error) => {
      toast({
        title: "Blackjack Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const standMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest('POST', `/api/users/${userId}/games/blackjack/stand`, {});
      return response.json();
    },
    onSuccess: (data) => {
      setBlackjackGame(data.gameState);
      if (data.message) {
        toast({
          title: "Blackjack",
          description: data.message,
        });
      }
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/history`] });
    },
    onError: (error) => {
      toast({
        title: "Blackjack Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Coinflip mutation
  const coinflipMutation = useMutation({
    mutationFn: async ({ userId, choice, amount }: { userId: number, choice: 'heads' | 'tails', amount: number }) => {
      const response = await apiRequest('POST', `/api/users/${userId}/games/coinflip`, { choice, amount });
      return response.json();
    },
    onSuccess: (data) => {
      setCoinflipGame(data.gameState);
      if (data.message) {
        toast({
          title: "Coinflip",
          description: data.message,
        });
      }
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/history`] });
    },
    onError: (error) => {
      toast({
        title: "Coinflip Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Fetch game history
  const fetchGameHistory = async () => {
    if (!user) return;
    
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`/api/users/${user.id}/history?limit=10`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch game history');
      }
      
      const history = await response.json();
      setGameHistory(history);
    } catch (error) {
      console.error('Error fetching game history:', error);
      toast({
        title: "Error",
        description: "Failed to load game history",
        variant: "destructive",
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Start a new blackjack game
  const startBlackjack = async (betAmount: number) => {
    if (!user) return;
    await startBlackjackMutation.mutateAsync({ userId: user.id, betAmount });
    await fetchGameHistory();
  };

  // Hit in blackjack
  const hitCard = async () => {
    if (!user) return;
    await hitCardMutation.mutateAsync(user.id);
    await fetchGameHistory();
  };

  // Stand in blackjack
  const stand = async () => {
    if (!user) return;
    await standMutation.mutateAsync(user.id);
    await fetchGameHistory();
  };

  // Play coinflip
  const playCoinflip = async (choice: 'heads' | 'tails', betAmount: number) => {
    if (!user) return;
    await coinflipMutation.mutateAsync({ userId: user.id, choice, amount: betAmount });
    await fetchGameHistory();
  };

  // Refresh game history
  const refreshHistory = () => {
    fetchGameHistory();
  };

  // Check if blackjack is active
  const isBlackjackActive = blackjackGame !== null && blackjackGame.status === 'active';

  return (
    <GameContext.Provider
      value={{
        blackjackGame,
        startBlackjack,
        hitCard,
        stand,
        isBlackjackActive,
        
        coinflipGame,
        playCoinflip,
        
        gameHistory,
        fetchGameHistory,
        isLoadingHistory,
        refreshHistory,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
