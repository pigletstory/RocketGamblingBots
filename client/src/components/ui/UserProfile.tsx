import { useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';
import { Button } from './button';
import { useToast } from '@/hooks/use-toast';
import { Progress } from './progress';
import { Sparkles } from 'lucide-react';

export default function UserProfile() {
  const { user, isLevelUpAvailable, levelUp } = useUser();
  const { toast } = useToast();
  const [xpPercentage, setXpPercentage] = useState(0);

  // Calculate XP percentage for progress bar
  useEffect(() => {
    if (user) {
      const nextLevelXp = 1000 * (user.level + 1);
      const percentage = Math.min(100, (user.xp / nextLevelXp) * 100);
      setXpPercentage(percentage);
    }
  }, [user]);

  const handleLevelUp = async () => {
    try {
      await levelUp();
    } catch (error) {
      toast({
        title: "Level Up Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return (
      <div className="bg-discord-darker rounded-lg p-4 shadow-lg animate-pulse">
        <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
        <div className="h-24 bg-discord-light rounded-md"></div>
      </div>
    );
  }

  return (
    <div className="bg-discord-darker rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Your Profile</h2>
        <span className="bg-casino-purple px-2 py-1 rounded text-xs font-semibold">
          Level {user.level}
        </span>
      </div>
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-discord-light flex items-center justify-center overflow-hidden">
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.username} 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-lg font-bold">
                {user.username.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-medium text-white">{user.username}</h3>
            <p className="text-discord-muted text-sm">#{user.discriminator}</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-discord-muted">Balance:</span>
            <span className="text-white font-medium">{user.balance.toLocaleString()} 💰</span>
          </div>
          <div className="flex justify-between">
            <span className="text-discord-muted">XP:</span>
            <span className="text-white font-medium">
              {user.xp.toLocaleString()}/{(1000 * (user.level + 1)).toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-discord-light rounded-full h-2">
            <Progress value={xpPercentage} className="bg-casino-gold h-2 rounded-full" />
          </div>
          {isLevelUpAvailable && (
            <Button 
              onClick={handleLevelUp}
              className="w-full mt-2 bg-casino-purple hover:bg-opacity-80 transition-colors"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Level Up!
            </Button>
          )}
          <div className="flex justify-between">
            <span className="text-discord-muted">Games Played:</span>
            <span className="text-white font-medium">{user.gamesPlayed}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-discord-muted">Wins:</span>
            <span className="text-white font-medium">{user.wins}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
