import { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { useUser } from '@/context/UserContext';
import { Button } from './button';
import { Input } from './input';
import { useToast } from '@/hooks/use-toast';

export default function BlackjackGame() {
  const [betAmount, setBetAmount] = useState('100');
  const { blackjackGame, startBlackjack, hitCard, stand, isBlackjackActive } = useGame();
  const { user } = useUser();
  const { toast } = useToast();

  const handleStartGame = async () => {
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
      await startBlackjack(amount);
    } catch (error) {
      toast({
        title: "Game Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  };

  const handleHit = async () => {
    try {
      await hitCard();
    } catch (error) {
      toast({
        title: "Game Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  };

  const handleStand = async () => {
    try {
      await stand();
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

  // Helper function to render card display
  const renderCard = (card: any, hidden: boolean = false) => {
    if (hidden) {
      return (
        <div className="w-12 h-16 bg-discord-darkest rounded-md flex items-center justify-center text-discord-muted">
          ?
        </div>
      );
    }
    
    const suitSymbol = {
      'hearts': '♥',
      'diamonds': '♦',
      'clubs': '♣',
      'spades': '♠'
    };
    
    const color = card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-500' : 'text-black';
    
    return (
      <div className="w-12 h-16 bg-white rounded-md flex items-center justify-center font-bold">
        <span className={color}>
          {card.value}{suitSymbol[card.suit]}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-discord-darker rounded-lg p-4 shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Play Blackjack</h2>
      <div className="bg-discord-light rounded-md p-4">
        <div className="mb-4">
          <p className="text-sm text-discord-muted mb-2">Enter your bet amount:</p>
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="100"
              className="bg-discord-darkest rounded-md px-3 py-2 border border-discord-muted focus:border-casino-gold"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
            />
            <Button
              onClick={handleStartGame}
              disabled={!user || isBlackjackActive}
              className="bg-casino-green hover:bg-opacity-80 text-white transition duration-150 ease-in-out"
            >
              Play
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
        
        {/* Game state display */}
        {blackjackGame && (
          <div className="mt-6">
            <div className="flex justify-between mb-4">
              <div>
                <p className="text-sm text-discord-muted">Dealer's Hand</p>
                <div className="flex mt-2 space-x-2">
                  {blackjackGame.dealerHand.map((card, index) => (
                    // Only show the first card if game is active
                    <div key={`dealer-${index}`}>
                      {renderCard(
                        card, 
                        index === 1 && blackjackGame.status === 'active'
                      )}
                    </div>
                  ))}
                </div>
                <p className="mt-1 text-sm">
                  Value: {blackjackGame.status === 'active' ? '??' : blackjackGame.dealerValue}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-discord-muted">Your Hand</p>
                <div className="flex mt-2 space-x-2 justify-end">
                  {blackjackGame.playerHand.map((card, index) => (
                    <div key={`player-${index}`}>
                      {renderCard(card)}
                    </div>
                  ))}
                </div>
                <p className="mt-1 text-sm">Value: {blackjackGame.playerValue}</p>
              </div>
            </div>
            
            {blackjackGame.status === 'active' && (
              <div className="flex space-x-3 mt-4">
                <Button
                  onClick={handleHit}
                  className="bg-casino-green hover:bg-opacity-80 text-white flex-grow transition"
                >
                  Hit
                </Button>
                <Button
                  onClick={handleStand}
                  className="bg-casino-purple hover:bg-opacity-80 text-white flex-grow transition"
                >
                  Stand
                </Button>
              </div>
            )}
            
            <p className="mt-4 text-sm text-center text-discord-muted">
              Current bet: {blackjackGame.betAmount.toLocaleString()} 💰
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
