import { useState } from 'react';
import { useUser } from '@/context/UserContext';
import { useGame } from '@/context/GameContext';
import { useToast } from '@/hooks/use-toast';

export const useGambling = () => {
  const [betAmount, setBetAmount] = useState<string>('100');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  const { user } = useUser();
  const { startBlackjack, playCoinflip } = useGame();
  const { toast } = useToast();
  
  // Parse bet amount handling special formats (e.g., 1k, 1m, max)
  const parseBetAmount = (bet: string): number => {
    if (!bet) return 0;
    
    // Handle 'max' bet
    if (bet.toLowerCase() === 'max' || bet.toLowerCase() === 'm') {
      return user?.balance || 0;
    }
    
    // Handle letter shortcuts (k = 1000, m = 1000000, etc.)
    const regex = /^(\d+)([kmgtezy])?$/i;
    const match = bet.match(regex);
    
    if (match) {
      const value = parseInt(match[1]);
      const multiplier = match[2]?.toLowerCase();
      
      if (!multiplier) return value;
      
      switch (multiplier) {
        case 'k': return value * 1000;
        case 'm': return value * 1000000;
        case 'g': return value * 1000000000;
        case 't': return value * 1000000000000;
        case 'e': return value * 1000000000000000;
        case 'z': return value * 1000000000000000000;
        case 'y': return value * 1000000000000000000000;
        default: return value;
      }
    }
    
    return parseInt(bet) || 0;
  };
  
  // Validate bet amount
  const validateBet = (amount: number): boolean => {
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Bet",
        description: "Please enter a valid bet amount",
        variant: "destructive"
      });
      return false;
    }
    
    if (!user) {
      toast({
        title: "Not Logged In",
        description: "You need to be logged in to place bets",
        variant: "destructive"
      });
      return false;
    }
    
    if (amount > user.balance) {
      toast({
        title: "Insufficient Funds",
        description: "You don't have enough cash for this bet",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };
  
  // Play blackjack with current bet amount
  const playBlackjack = async () => {
    const amount = parseBetAmount(betAmount);
    
    if (!validateBet(amount)) return;
    
    setIsProcessing(true);
    try {
      await startBlackjack(amount);
    } catch (error) {
      toast({
        title: "Blackjack Error",
        description: error instanceof Error ? error.message : "Failed to start game",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Play coinflip with current bet amount
  const playCoinflipGame = async (choice: 'heads' | 'tails') => {
    const amount = parseBetAmount(betAmount);
    
    if (!validateBet(amount)) return;
    
    setIsProcessing(true);
    try {
      await playCoinflip(choice, amount);
    } catch (error) {
      toast({
        title: "Coinflip Error",
        description: error instanceof Error ? error.message : "Failed to flip coin",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Set quick bet amounts
  const setQuickBet = (amount: string) => {
    setBetAmount(amount);
  };
  
  return {
    betAmount,
    setBetAmount,
    isProcessing,
    parseBetAmount,
    validateBet,
    playBlackjack,
    playCoinflipGame,
    setQuickBet
  };
};
