import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Define the User type based on the schema
export interface User {
  id: number;
  username: string;
  discriminator: string;
  balance: number;
  level: number;
  xp: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  lastDaily: string | null;
  lastWork: string | null;
  avatar: string;
}

// Define what the context will expose
interface UserContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginUser: (username: string, discriminator: string, avatar?: string) => Promise<void>;
  updateUserBalance: (newBalance: number) => Promise<void>;
  updateUserXP: (newXP: number) => Promise<void>;
  updateUserStats: (stats: Partial<User>) => Promise<void>;
  isLevelUpAvailable: boolean;
  levelUp: () => Promise<void>;
  dailyCommand: () => Promise<any>;
  workCommand: () => Promise<any>;
  canUseDaily: boolean;
  canUseWork: boolean;
  dailyCooldownRemaining: number;
  workCooldownRemaining: number;
}

// Create context with a default value
const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: false,
  error: null,
  loginUser: async () => {},
  updateUserBalance: async () => {},
  updateUserXP: async () => {},
  updateUserStats: async () => {},
  isLevelUpAvailable: false,
  levelUp: async () => {},
  dailyCommand: async () => ({}),
  workCommand: async () => ({}),
  canUseDaily: false,
  canUseWork: false,
  dailyCooldownRemaining: 0,
  workCooldownRemaining: 0,
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create a user or get existing user
  const userLoginMutation = useMutation({
    mutationFn: async ({ username, discriminator, avatar }: { username: string, discriminator: string, avatar?: string }) => {
      const response = await apiRequest('POST', '/api/users', {
        username,
        discriminator,
        avatar: avatar || "https://cdn.discordapp.com/embed/avatars/0.png"
      });
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentUser(data);
      localStorage.setItem('userId', data.id.toString());
      queryClient.invalidateQueries({ queryKey: [`/api/users/${data.id}`] });
      toast({
        title: "Logged in successfully",
        description: "Welcome to Rocket Gambling Bot!",
      });
    },
    onError: (error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update user data
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<User> }) => {
      const response = await apiRequest('PATCH', `/api/users/${id}`, data);
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentUser(data);
      queryClient.invalidateQueries({ queryKey: [`/api/users/${data.id}`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update user",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Level up mutation
  const levelUpMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('POST', `/api/users/${id}/levelup`, {});
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentUser(data.user);
      toast({
        title: "Level Up!",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${data.user.id}`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to level up",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Daily command mutation
  const dailyCommandMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('POST', `/api/users/${id}/commands/daily`, {});
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentUser(data.user);
      toast({
        title: "Daily Reward",
        description: `You received ${data.reward} cash!`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${data.user.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${data.user.id}/history`] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to claim daily reward",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Work command mutation
  const workCommandMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('POST', `/api/users/${id}/commands/work`, {});
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentUser(data.user);
      toast({
        title: "Work Reward",
        description: `You worked and earned ${data.reward} cash!`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${data.user.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${data.user.id}/history`] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to work",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Check if there's a saved user ID and fetch user data on component mount
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      fetchUser(parseInt(userId));
    } else {
      // Auto-login with a default user for demo purposes
      loginUser('CasinoMaster', '1234');
    }
  }, []);

  // Fetch user data
  const fetchUser = async (id: number) => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const userData = await response.json();
      setCurrentUser(userData);
    } catch (error) {
      console.error('Error fetching user:', error);
      // If we can't fetch the user, clear the stored user ID
      localStorage.removeItem('userId');
    }
  };

  const loginUser = async (username: string, discriminator: string, avatar?: string) => {
    await userLoginMutation.mutateAsync({ username, discriminator, avatar });
  };

  const updateUserBalance = async (newBalance: number) => {
    if (!currentUser) return;
    await updateUserMutation.mutateAsync({
      id: currentUser.id,
      data: { balance: newBalance }
    });
  };

  const updateUserXP = async (newXP: number) => {
    if (!currentUser) return;
    await updateUserMutation.mutateAsync({
      id: currentUser.id,
      data: { xp: newXP }
    });
  };

  const updateUserStats = async (stats: Partial<User>) => {
    if (!currentUser) return;
    await updateUserMutation.mutateAsync({
      id: currentUser.id,
      data: stats
    });
  };

  const levelUp = async () => {
    if (!currentUser) return;
    await levelUpMutation.mutateAsync(currentUser.id);
  };

  const dailyCommand = async () => {
    if (!currentUser) return {};
    return await dailyCommandMutation.mutateAsync(currentUser.id);
  };

  const workCommand = async () => {
    if (!currentUser) return {};
    return await workCommandMutation.mutateAsync(currentUser.id);
  };

  // Calculate if level up is available
  const isLevelUpAvailable = currentUser ? currentUser.xp >= 1000 * (currentUser.level + 1) : false;

  // Calculate if daily and work commands can be used
  const now = new Date().getTime();
  const dailyTime = currentUser?.lastDaily ? new Date(currentUser.lastDaily).getTime() : 0;
  const workTime = currentUser?.lastWork ? new Date(currentUser.lastWork).getTime() : 0;
  
  const canUseDaily = !currentUser?.lastDaily || (now - dailyTime) >= 24 * 60 * 60 * 1000;
  const canUseWork = !currentUser?.lastWork || (now - workTime) >= 10 * 60 * 1000;
  
  const dailyCooldownRemaining = currentUser?.lastDaily 
    ? Math.max(0, 24 * 60 * 60 * 1000 - (now - dailyTime)) 
    : 0;
    
  const workCooldownRemaining = currentUser?.lastWork 
    ? Math.max(0, 10 * 60 * 1000 - (now - workTime)) 
    : 0;

  return (
    <UserContext.Provider
      value={{
        user: currentUser,
        isLoading: userLoginMutation.isPending || updateUserMutation.isPending,
        error: userLoginMutation.error || updateUserMutation.error,
        loginUser,
        updateUserBalance,
        updateUserXP,
        updateUserStats,
        isLevelUpAvailable,
        levelUp,
        dailyCommand,
        workCommand,
        canUseDaily,
        canUseWork,
        dailyCooldownRemaining,
        workCooldownRemaining
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
