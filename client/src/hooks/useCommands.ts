import { useState } from 'react';
import { useUser } from '@/context/UserContext';
import { useGame } from '@/context/GameContext';
import { useToast } from '@/hooks/use-toast';
import { useGambling } from './useGambling';

export const useCommands = () => {
  const [commandInput, setCommandInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const { user, dailyCommand, workCommand } = useUser();
  const { startBlackjack, playCoinflip, fetchGameHistory } = useGame();
  const { parseBetAmount, validateBet } = useGambling();
  const { toast } = useToast();
  
  // Parse command input
  const parseCommand = (input: string): { command: string, args: string[] } => {
    const parts = input.trim().split(/\s+/);
    const command = parts[0].toLowerCase().startsWith('/') 
      ? parts[0].toLowerCase() 
      : `/${parts[0].toLowerCase()}`;
    const args = parts.slice(1);
    
    return { command, args };
  };
  
  // Execute a command
  const executeCommand = async (input: string) => {
    if (!input.trim()) return;
    
    // Add command to history
    setCommandHistory(prev => [input, ...prev.slice(0, 9)]);
    setHistoryIndex(-1);
    
    const { command, args } = parseCommand(input);
    
    if (!user) {
      toast({
        title: "Not Logged In",
        description: "You need to be logged in to use commands",
        variant: "destructive"
      });
      return;
    }
    
    try {
      switch (command) {
        case '/profile':
          toast({
            title: "Profile",
            description: `Username: ${user.username}#${user.discriminator}\nBalance: ${user.balance.toLocaleString()} 💰\nLevel: ${user.level}\nXP: ${user.xp}/${1000 * (user.level + 1)}\nGames: ${user.gamesPlayed} (${user.wins} wins)`,
          });
          break;
          
        case '/daily':
          await dailyCommand();
          break;
          
        case '/work':
          await workCommand();
          break;
          
        case '/blackjack': {
          const betArg = args[0] || '100';
          const betAmount = parseBetAmount(betArg);
          
          if (validateBet(betAmount)) {
            await startBlackjack(betAmount);
          }
          break;
        }
        
        case '/coinflip': {
          if (args.length < 2) {
            toast({
              title: "Invalid Command",
              description: "Usage: /coinflip <heads|tails> <bet>",
              variant: "destructive"
            });
            break;
          }
          
          const choice = args[0].toLowerCase();
          if (choice !== 'heads' && choice !== 'tails') {
            toast({
              title: "Invalid Choice",
              description: "Choose 'heads' or 'tails'",
              variant: "destructive"
            });
            break;
          }
          
          const betAmount = parseBetAmount(args[1]);
          if (validateBet(betAmount)) {
            await playCoinflip(choice as 'heads' | 'tails', betAmount);
          }
          break;
        }
        
        case '/help': {
          const commandToHelp = args[0] || '';
          
          if (!commandToHelp) {
            toast({
              title: "Available Commands",
              description: "Use /help <command> for details on specific commands.\nBasic commands: /profile, /daily, /work\nGames: /blackjack, /coinflip\nOther: /leaderboard",
            });
            break;
          }
          
          // Command-specific help
          switch (commandToHelp.toLowerCase()) {
            case 'blackjack':
              toast({
                title: "Blackjack Help",
                description: "Usage: /blackjack <bet>\nExample: /blackjack 1000\n\nPlay blackjack against the dealer. Try to get closer to 21 than the dealer without going over.",
              });
              break;
              
            case 'coinflip':
              toast({
                title: "Coinflip Help",
                description: "Usage: /coinflip <heads|tails> <bet>\nExample: /coinflip heads 500\n\nFlip a coin and bet on the outcome.",
              });
              break;
              
            case 'daily':
              toast({
                title: "Daily Help",
                description: "Usage: /daily\n\nClaim your daily reward. Available once every 24 hours.",
              });
              break;
              
            case 'work':
              toast({
                title: "Work Help",
                description: "Usage: /work\n\nEarn money by working. Available every 10 minutes.",
              });
              break;
              
            case 'profile':
              toast({
                title: "Profile Help",
                description: "Usage: /profile\n\nView your profile stats, balance, and level.",
              });
              break;
              
            default:
              toast({
                title: "Unknown Command",
                description: `No help available for '${commandToHelp}'`,
                variant: "destructive"
              });
          }
          break;
        }
        
        case '/leaderboard':
          toast({
            title: "Leaderboard",
            description: "The leaderboard is displayed on the right panel.",
          });
          break;
          
        case '/refresh':
        case '/reload':
          await fetchGameHistory();
          toast({
            title: "Refreshed",
            description: "Game history and data refreshed.",
          });
          break;
          
        default:
          toast({
            title: "Unknown Command",
            description: `Command '${command}' not recognized`,
            variant: "destructive"
          });
      }
    } catch (error) {
      toast({
        title: "Command Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
    
    // Clear input after processing
    setCommandInput('');
  };
  
  // Navigate command history
  const navigateHistory = (direction: 'up' | 'down') => {
    if (commandHistory.length === 0) return;
    
    if (direction === 'up') {
      const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
      setHistoryIndex(newIndex);
      setCommandInput(commandHistory[newIndex]);
    } else {
      const newIndex = Math.max(historyIndex - 1, -1);
      setHistoryIndex(newIndex);
      setCommandInput(newIndex === -1 ? '' : commandHistory[newIndex]);
    }
  };
  
  return {
    commandInput,
    setCommandInput,
    commandHistory,
    executeCommand,
    navigateHistory
  };
};
