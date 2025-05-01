import { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { useUser } from '@/context/UserContext';
import { Button } from './button';
import { Input } from './input';
import { useToast } from '@/hooks/use-toast';

export default function CoinflipGame() {
  const [betAmount, setBetAmount] = useState('100');
  const [selectedSide, setSelectedSide] = useState<'heads' | 'tails' | null>(null);
  const { coinflipGame, playCoinflip } = useGame();
  const { user } = useUser();
  const { toast } = useToast();

  const handleFlip = async () => {
    if (!selectedSide) {
      toast({
        title: "Choose a Side",
        description: "Please select Heads or Tails before flipping",
        variant: "destructive"
      });
      return;
    }
    
    // Validate bet amount
    const amount = parseInt(betAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Bet",
        description: "Please enter a valid bet amount",
        variant: "destructive"
      });
      return;
    }
    
    if (user && amount > user.balance) {
      toast({
        title: "Insufficient Funds",
        description: "You don't have enough cash for this bet",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await playCoinflip(selectedSide, amount);
    } catch (error) {
      toast({
        title: "Game Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  };

  const handleQuickBet = (amount: string) => {
    if (amount === 'max' && user) {
      setBetAmount(user.balance.toString());
    } else {
      setBetAmount(amount);
    }
  };

  return (
    <div className="bg-discord-darker rounded-lg p-4 shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Coinflip</h2>
      <div className="bg-discord-light rounded-md p-4">
        <div className="mb-4">
          <p className="text-sm text-discord-muted mb-2">Choose your side and bet amount:</p>
          <div className="flex space-x-4 mb-3">
            <Button
              onClick={() => setSelectedSide('heads')}
              className={`bg-discord-darkest hover:bg-opacity-80 text-white px-6 py-3 rounded-md font-medium transition flex-1 flex flex-col items-center 
                ${selectedSide === 'heads' ? 'ring-2 ring-casino-gold' : ''}`}
              variant="outline"
            >
              <span className="text-xl mb-1">Heads</span>
              <div className="w-10 h-10 rounded-full bg-casino-gold flex items-center justify-center text-discord-darkest">
                H
              </div>
            </Button>
            <Button
              onClick={() => setSelectedSide('tails')}
              className={`bg-discord-darkest hover:bg-opacity-80 text-white px-6 py-3 rounded-md font-medium transition flex-1 flex flex-col items-center
                ${selectedSide === 'tails' ? 'ring-2 ring-casino-gold' : ''}`}
              variant="outline"
            >
              <span className="text-xl mb-1">Tails</span>
              <div className="w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center text-discord-darkest">
                T
              </div>
            </Button>
          </div>
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="100"
              className="bg-discord-darkest rounded-md px-3 py-2 border border-discord-muted focus:border-casino-gold"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
            />
            <Button
              onClick={handleFlip}
              disabled={!user || !selectedSide}
              className="bg-casino-green hover:bg-opacity-80 text-white transition"
            >
              Flip
            </Button>
          </div>
          <div className="flex mt-2 space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-discord-darkest hover:bg-opacity-80 text-discord-text transition"
              onClick={() => handleQuickBet('100')}
            >
              100
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-discord-darkest hover:bg-opacity-80 text-discord-text transition"
              onClick={() => handleQuickBet('500')}
            >
              500
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-discord-darkest hover:bg-opacity-80 text-discord-text transition"
              onClick={() => handleQuickBet('1000')}
            >
              1000
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-discord-darkest hover:bg-opacity-80 text-discord-text transition"
              onClick={() => handleQuickBet('5000')}
            >
              5000
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-discord-darkest hover:bg-opacity-80 text-discord-text transition"
              onClick={() => handleQuickBet('max')}
            >
              Max
            </Button>
          </div>
        </div>
        
        {/* Result display */}
        {coinflipGame && coinflipGame.result && (
          <div className="mt-4 p-3 bg-discord-darker rounded-md text-center">
            <p className="text-lg font-medium mb-2">
              Result: {coinflipGame.result.toUpperCase()}
            </p>
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl font-bold mb-2 ${coinflipGame.result === 'heads' ? 'bg-casino-gold' : 'bg-gray-400'}`}>
              {coinflipGame.result === 'heads' ? 'H' : 'T'}
            </div>
            <p className={`text-lg font-medium ${coinflipGame.status === 'won' ? 'text-casino-green' : 'text-casino-red'}`}>
              {coinflipGame.status === 'won' ? 'You won!' : 'You lost!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
