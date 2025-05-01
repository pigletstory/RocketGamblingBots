import { CoinflipGameState } from '@shared/schema';

export function flipCoin(userId: number, choice: 'heads' | 'tails', betAmount: number): CoinflipGameState {
  // Randomly determine the result
  const result = Math.random() < 0.5 ? 'heads' : 'tails';
  
  // Determine if the player won
  const status = result === choice ? 'won' : 'lost';
  
  return {
    choice,
    result,
    betAmount,
    status,
    userId
  };
}

export function calculateWinnings(gameState: CoinflipGameState): number {
  if (gameState.status === 'won') {
    return gameState.betAmount * 2; // Return original bet plus winnings
  }
  return 0; // Player lost
}
