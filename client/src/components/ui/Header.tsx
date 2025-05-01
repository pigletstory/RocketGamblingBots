import { useUser } from '@/context/UserContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from './button';
import { Trophy, Crown } from 'lucide-react';

export default function Header() {
  const { user } = useUser();
  const { toast } = useToast();
  
  const handleVote = () => {
    toast({
      title: "Vote for Rocket Bot",
      description: "Voting not implemented in this demo, but would redirect to voting sites.",
    });
  };
  
  const handleDonate = () => {
    toast({
      title: "Donate",
      description: "Donation options would be shown here in a real implementation.",
    });
  };

  return (
    <header className="bg-discord-darker py-4 px-6 shadow-md flex justify-between items-center">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-casino-purple flex items-center justify-center">
          <span className="text-white text-xl font-bold">R</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Rocket Gambling Bot</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <Button 
          onClick={handleVote}
          className="bg-casino-green hover:bg-opacity-80 text-white transition duration-150 ease-in-out"
        >
          <span className="mr-2">Vote</span>
          <Trophy size={16} />
        </Button>
        
        <Button 
          onClick={handleDonate}
          className="bg-casino-gold hover:bg-opacity-80 text-discord-darkest transition duration-150 ease-in-out"
        >
          <span className="mr-2">Donate</span>
          <Crown size={16} />
        </Button>
      </div>
    </header>
  );
}
