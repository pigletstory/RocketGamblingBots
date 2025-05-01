import { useEffect } from 'react';
import Header from '@/components/ui/Header';
import CommandInput from '@/components/ui/CommandInput';
import UserProfile from '@/components/ui/UserProfile';
import Achievements from '@/components/ui/Achievements';
import GameHistory from '@/components/ui/GameHistory';
import BlackjackGame from '@/components/ui/BlackjackGame';
import CoinflipGame from '@/components/ui/CoinflipGame';
import Leaderboard from '@/components/ui/Leaderboard';
import HelpPanel from '@/components/ui/HelpPanel';
import CooldownPanel from '@/components/ui/CooldownPanel';
import Footer from '@/components/ui/Footer';
import { useUser } from '@/context/UserContext';
import { useGame } from '@/context/GameContext';

export default function Dashboard() {
  const { user } = useUser();
  const { fetchGameHistory } = useGame();

  // Fetch game history when user is available
  useEffect(() => {
    if (user) {
      fetchGameHistory();
    }
  }, [user]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow p-6 md:px-8 lg:container lg:mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Panel */}
          <div className="w-full lg:w-1/4 space-y-6">
            <CommandInput />
            <UserProfile />
            <Achievements />
          </div>
          
          {/* Main Panel */}
          <div className="w-full lg:w-1/2 space-y-6">
            <GameHistory />
            <BlackjackGame />
            <CoinflipGame />
          </div>
          
          {/* Right Panel */}
          <div className="w-full lg:w-1/4 space-y-6">
            <Leaderboard />
            <HelpPanel />
            <CooldownPanel />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
