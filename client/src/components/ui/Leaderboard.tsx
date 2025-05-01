import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Button } from './button';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/hooks/use-toast';

interface LeaderboardUser {
  id: number;
  username: string;
  discriminator: string;
  avatar: string;
  balance: number;
  level: number;
  wins: number;
}

export default function Leaderboard() {
  const [sortBy, setSortBy] = useState<'balance' | 'level' | 'wins'>('balance');
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    fetchLeaderboard();
  }, [sortBy]);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/leaderboard?sortBy=${sortBy}&limit=5`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast({
        title: "Error",
        description: "Failed to load leaderboard",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewGlobal = () => {
    toast({
      title: "Global Leaderboard",
      description: "This would show the global leaderboard across all servers.",
    });
  };

  // Get the value label for the sort type
  const getSortedValueLabel = (user: LeaderboardUser) => {
    switch (sortBy) {
      case 'balance':
        return `${user.balance.toLocaleString()} 💰`;
      case 'level':
        return `Level ${user.level}`;
      case 'wins':
        return `${user.wins} wins`;
    }
  };

  // Get the medal color for position
  const getMedalColor = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-casino-gold';
      case 2:
        return 'bg-gray-400';
      case 3:
        return 'bg-yellow-700';
      default:
        return 'bg-discord-darkest text-discord-muted';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-discord-darker rounded-lg p-4 shadow-lg animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Server Leaderboard</h2>
          <div className="w-20 h-8 bg-discord-light rounded-md"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-discord-light rounded-md p-3 h-12"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-discord-darker rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Server Leaderboard</h2>
        <Select
          value={sortBy}
          onValueChange={(value) => setSortBy(value as 'balance' | 'level' | 'wins')}
        >
          <SelectTrigger className="w-[100px] bg-discord-light text-sm border-none">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="balance">Cash</SelectItem>
            <SelectItem value="level">Level</SelectItem>
            <SelectItem value="wins">Wins</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-3">
        {users.map((user, index) => (
          <div key={user.id} className="bg-discord-light rounded-md p-3 flex items-center">
            <span className={`w-6 h-6 ${getMedalColor(index + 1)} text-discord-darkest rounded-full flex items-center justify-center font-bold mr-3`}>
              {index + 1}
            </span>
            <div className="w-8 h-8 rounded-full bg-discord-darkest overflow-hidden mr-3">
              {user.avatar && (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="flex-grow">
              <h3 className="font-medium text-white text-sm">{user.username}</h3>
            </div>
            <span className="font-medium">{getSortedValueLabel(user)}</span>
          </div>
        ))}
      </div>
      <Button 
        onClick={handleViewGlobal}
        className="mt-3 w-full py-2 bg-discord-light hover:bg-opacity-80 transition-colors rounded-md text-sm"
        variant="outline"
      >
        View Global Leaderboard
      </Button>
    </div>
  );
}
