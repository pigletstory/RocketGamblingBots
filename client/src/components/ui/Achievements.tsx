import { useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';
import { Button } from './button';
import { Trophy, Coins, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Achievement {
  id: number;
  userId: number;
  title: string;
  description: string;
  awarded: string;
  xpAwarded: number;
}

export default function Achievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    // Fetch user achievements when user is available
    if (user) {
      fetchAchievements();
    }
  }, [user]);

  const fetchAchievements = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${user.id}/achievements`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch achievements');
      }
      
      const data = await response.json();
      setAchievements(data);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      toast({
        title: "Error",
        description: "Failed to load achievements",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const viewAllAchievements = () => {
    toast({
      title: "All Achievements",
      description: "This would show a complete list of all available achievements.",
    });
  };

  // Helper to get icon by achievement title
  const getAchievementIcon = (title: string) => {
    switch (title) {
      case 'High Roller':
        return <Trophy className="h-4 w-4" />;
      case 'Consistent Player':
        return <Coins className="h-4 w-4" />;
      case 'Blackjack Master':
        return <Crown className="h-4 w-4" />;
      default:
        return <Trophy className="h-4 w-4" />;
    }
  };

  // Helper to get background color by achievement title
  const getAchievementColor = (title: string) => {
    switch (title) {
      case 'High Roller':
        return 'bg-casino-gold';
      case 'Consistent Player':
        return 'bg-casino-green';
      case 'Blackjack Master':
        return 'bg-casino-purple';
      default:
        return 'bg-casino-gold';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-discord-darker rounded-lg p-4 shadow-lg animate-pulse">
        <h2 className="text-xl font-semibold mb-3">Recent Achievements</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-discord-light rounded-md p-3 h-16"></div>
          ))}
        </div>
      </div>
    );
  }

  if (achievements.length === 0 && !isLoading) {
    // If no achievements, show a placeholder with example achievements
    const placeholderAchievements = [
      {
        id: 1,
        title: 'High Roller',
        description: 'Bet 10,000 or more in a single game',
        xpAwarded: 100
      },
      {
        id: 2,
        title: 'Consistent Player',
        description: 'Use the daily command 5 days in a row',
        xpAwarded: 100
      },
      {
        id: 3,
        title: 'Blackjack Master',
        description: 'Win 20 games of blackjack',
        xpAwarded: 100
      }
    ];
    
    return (
      <div className="bg-discord-darker rounded-lg p-4 shadow-lg">
        <h2 className="text-xl font-semibold mb-3">Available Achievements</h2>
        <div className="space-y-3">
          {placeholderAchievements.map((achievement) => (
            <div key={achievement.id} className="bg-discord-light rounded-md p-3 flex items-center justify-between opacity-60">
              <div className="flex items-center space-x-3">
                <div className={`${getAchievementColor(achievement.title)} rounded-full p-2 text-discord-darkest`}>
                  {getAchievementIcon(achievement.title)}
                </div>
                <div>
                  <h3 className="font-medium">{achievement.title}</h3>
                  <p className="text-discord-muted text-sm">{achievement.description}</p>
                </div>
              </div>
              <span className="text-xs font-medium bg-discord-darkest px-2 py-1 rounded">
                +{achievement.xpAwarded} XP
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-sm text-discord-muted">
          Complete objectives to earn achievements and XP!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-discord-darker rounded-lg p-4 shadow-lg">
      <h2 className="text-xl font-semibold mb-3">Recent Achievements</h2>
      <div className="space-y-3">
        {achievements.slice(0, 3).map((achievement) => (
          <div key={achievement.id} className="bg-discord-light rounded-md p-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`${getAchievementColor(achievement.title)} rounded-full p-2 text-discord-darkest`}>
                {getAchievementIcon(achievement.title)}
              </div>
              <div>
                <h3 className="font-medium">{achievement.title}</h3>
                <p className="text-discord-muted text-sm">{achievement.description}</p>
              </div>
            </div>
            <span className="text-xs font-medium bg-discord-darkest px-2 py-1 rounded">
              +{achievement.xpAwarded} XP
            </span>
          </div>
        ))}
      </div>
      <Button 
        onClick={viewAllAchievements}
        className="mt-3 w-full py-2 bg-discord-light hover:bg-opacity-80 transition-colors rounded-md text-sm"
        variant="outline"
      >
        View All Achievements
      </Button>
    </div>
  );
}
