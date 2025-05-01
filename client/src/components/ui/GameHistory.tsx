import { useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import { useUser } from '@/context/UserContext';
import { formatDistanceToNow } from 'date-fns';

export default function GameHistory() {
  const { gameHistory, fetchGameHistory, isLoadingHistory } = useGame();
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      fetchGameHistory();
    }
  }, [user]);

  // Function to get status badge styling
  const getStatusBadge = (outcome: string) => {
    switch (outcome) {
      case 'win':
        return "bg-casino-green text-white";
      case 'loss':
        return "bg-casino-red text-white";
      case 'reward':
        return "bg-casino-purple text-white";
      case 'push':
        return "bg-discord-muted text-white";
      default:
        return "bg-discord-muted text-white";
    }
  };

  // Function to format the game type for display
  const formatGameType = (type: string): string => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Function to format the win/loss amount
  const formatAmount = (outcome: string, betAmount: number | null, winAmount: number | null) => {
    if (outcome === 'win') {
      return {
        text: `+${winAmount?.toLocaleString()} 💰`,
        class: 'text-casino-green'
      };
    } else if (outcome === 'loss') {
      return {
        text: `-${betAmount?.toLocaleString()} 💰`,
        class: 'text-casino-red'
      };
    } else if (outcome === 'reward') {
      return {
        text: `+${winAmount?.toLocaleString()} 💰`,
        class: 'text-casino-gold'
      };
    } else if (outcome === 'push') {
      return {
        text: `+0 💰`,
        class: 'text-discord-muted'
      };
    }
    
    return {
      text: '0 💰',
      class: 'text-discord-muted'
    };
  };

  if (isLoadingHistory) {
    return (
      <div className="bg-discord-darker rounded-lg p-4 shadow-lg animate-pulse">
        <h2 className="text-xl font-semibold mb-4">Recent Games</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-discord-light rounded-md p-3 h-16"></div>
          ))}
        </div>
      </div>
    );
  }

  // If no game history, show a placeholder with example games
  if (gameHistory.length === 0 && !isLoadingHistory) {
    return (
      <div className="bg-discord-darker rounded-lg p-4 shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Recent Games</h2>
        <div className="bg-discord-light rounded-md p-4 text-center">
          <p className="text-discord-muted">No games played yet.</p>
          <p className="text-sm mt-2">Try commands like:</p>
          <div className="flex justify-center gap-2 mt-2">
            <span className="text-xs bg-discord-darkest px-2 py-1 rounded">/blackjack 100</span>
            <span className="text-xs bg-discord-darkest px-2 py-1 rounded">/coinflip heads 100</span>
            <span className="text-xs bg-discord-darkest px-2 py-1 rounded">/daily</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-discord-darker rounded-lg p-4 shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Recent Games</h2>
      <div className="space-y-3">
        {gameHistory.map((game) => {
          const formattedTime = formatDistanceToNow(new Date(game.timestamp), { addSuffix: true });
          const formattedAmount = formatAmount(game.outcome, game.betAmount, game.winAmount);
          
          return (
            <div key={game.id} className="bg-discord-light rounded-md p-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{formatGameType(game.gameType)}</span>
                    <span className={`text-xs ${getStatusBadge(game.outcome)} rounded px-2 py-0.5`}>
                      {game.outcome === 'win' ? 'Win' : 
                       game.outcome === 'loss' ? 'Loss' :
                       game.outcome === 'push' ? 'Push' : 'Reward'}
                    </span>
                  </div>
                  {game.betAmount && (
                    <p className="text-discord-muted text-sm">
                      Bet: {game.betAmount.toLocaleString()} 💰
                      {game.gameType === 'coinflip' && game.gameData && (
                        <span> ({game.gameData.choice})</span>
                      )}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className={`${formattedAmount.class} font-medium`}>
                    {formattedAmount.text}
                  </span>
                  <p className="text-discord-muted text-xs">{formattedTime}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
