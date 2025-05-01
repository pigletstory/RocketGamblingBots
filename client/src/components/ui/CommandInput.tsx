import { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/context/UserContext';
import { useGame } from '@/context/GameContext';

export default function CommandInput() {
  const [command, setCommand] = useState('');
  const { toast } = useToast();
  const { user, dailyCommand, workCommand } = useUser();
  const { startBlackjack, playCoinflip } = useGame();

  const handleCommand = async () => {
    if (!command.trim()) return;
    
    // Parse the command (simple implementation)
    const commandParts = command.trim().toLowerCase().split(' ');
    
    if (!user) {
      toast({
        title: "Error",
        description: "You need to be logged in to use commands",
        variant: "destructive"
      });
      return;
    }
    
    // Execute command based on the input
    try {
      switch (commandParts[0]) {
        case '/profile':
          toast({
            title: "Profile",
            description: `User: ${user.username}#${user.discriminator}, Balance: ${user.balance}, Level: ${user.level}`,
          });
          break;
          
        case '/daily':
          await dailyCommand();
          break;
          
        case '/work':
          await workCommand();
          break;
          
        case '/blackjack':
          const bjAmount = commandParts[1] ? parseInt(commandParts[1]) : 100;
          if (isNaN(bjAmount) || bjAmount <= 0) {
            toast({
              title: "Invalid Bet",
              description: "Please enter a valid bet amount",
              variant: "destructive"
            });
            break;
          }
          await startBlackjack(bjAmount);
          break;
          
        case '/coinflip':
          if (!commandParts[1] || !commandParts[2]) {
            toast({
              title: "Invalid Command",
              description: "Usage: /coinflip <heads|tails> <bet>",
              variant: "destructive"
            });
            break;
          }
          
          const choice = commandParts[1];
          if (choice !== 'heads' && choice !== 'tails') {
            toast({
              title: "Invalid Choice",
              description: "Choose 'heads' or 'tails'",
              variant: "destructive"
            });
            break;
          }
          
          const cfAmount = parseInt(commandParts[2]);
          if (isNaN(cfAmount) || cfAmount <= 0) {
            toast({
              title: "Invalid Bet",
              description: "Please enter a valid bet amount",
              variant: "destructive"
            });
            break;
          }
          
          await playCoinflip(choice as 'heads' | 'tails', cfAmount);
          break;
          
        default:
          toast({
            title: "Unknown Command",
            description: `Command '${commandParts[0]}' not recognized`,
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
    
    // Clear the input after processing
    setCommand('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommand();
    }
  };

  const executeQuickCommand = (cmd: string) => {
    setCommand(cmd);
  };

  return (
    <div className="bg-discord-darker rounded-lg p-4 shadow-lg">
      <h2 className="text-xl font-semibold mb-3">Command Input</h2>
      <div className="bg-discord-light rounded-md p-2 flex items-center">
        <span className="text-discord-muted mr-2">/</span>
        <Input
          type="text"
          placeholder="Enter a command..."
          className="bg-transparent w-full focus:outline-none text-discord-text border-none focus:ring-0"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      <div className="mt-4 space-y-2">
        <p className="text-sm text-discord-muted">Popular commands:</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="px-2 py-1 bg-discord-light hover:bg-opacity-80 text-sm"
            onClick={() => executeQuickCommand('/profile')}
          >
            /profile
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="px-2 py-1 bg-discord-light hover:bg-opacity-80 text-sm"
            onClick={() => executeQuickCommand('/coinflip heads 100')}
          >
            /coinflip
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="px-2 py-1 bg-discord-light hover:bg-opacity-80 text-sm"
            onClick={() => executeQuickCommand('/blackjack 100')}
          >
            /blackjack
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="px-2 py-1 bg-discord-light hover:bg-opacity-80 text-sm"
            onClick={() => executeQuickCommand('/daily')}
          >
            /daily
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="px-2 py-1 bg-discord-light hover:bg-opacity-80 text-sm"
            onClick={() => executeQuickCommand('/work')}
          >
            /work
          </Button>
        </div>
      </div>
    </div>
  );
}
