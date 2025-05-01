import { useUser } from '@/context/UserContext';
import { useToast } from '@/hooks/use-toast';

export default function HelpPanel() {
  const { user } = useUser();
  const { toast } = useToast();

  const handleCommandHelp = (command: string) => {
    toast({
      title: `Help: ${command}`,
      description: `Detailed help for ${command} would be shown here.`,
    });
  };
  
  return (
    <div className="bg-discord-darker rounded-lg p-4 shadow-lg">
      <h2 className="text-xl font-semibold mb-3">Command Help</h2>
      <div className="bg-discord-light rounded-md p-3 space-y-4">
        <div className="space-y-2">
          <h3 className="font-medium">Basic Commands</h3>
          <ul className="text-sm space-y-1.5 text-discord-muted">
            <li>
              <span className="text-white">/profile</span> - View your profile stats
            </li>
            <li>
              <span className="text-white">/daily</span> - Claim your daily reward
            </li>
            <li>
              <span className="text-white">/work</span> - Earn money (10 min cooldown)
            </li>
            <li>
              <span className="text-white">/leaderboard</span> - View server or global rankings
            </li>
          </ul>
        </div>
        <div className="space-y-2">
          <h3 className="font-medium">Game Commands</h3>
          <ul className="text-sm space-y-1.5 text-discord-muted">
            <li>
              <span className="text-white">/coinflip &lt;heads|tails&gt; &lt;bet&gt;</span> - Flip a coin
            </li>
            <li>
              <span className="text-white">/blackjack &lt;bet&gt;</span> - Play blackjack
            </li>
            <li>
              <span className="text-white">/help &lt;command&gt;</span> - Get detailed help for a command
            </li>
          </ul>
        </div>
        <div className="space-y-2">
          <h3 className="font-medium">Betting Format</h3>
          <ul className="text-sm space-y-1.5 text-discord-muted">
            <li>
              <span className="text-white">1000</span> - Bet 1,000 coins
            </li>
            <li>
              <span className="text-white">1k</span> - Bet 1,000 coins
            </li>
            <li>
              <span className="text-white">1m</span> - Bet 1,000,000 coins
            </li>
            <li>
              <span className="text-white">max</span> - Bet maximum allowed amount
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
