import { BlackjackCard, BlackjackGameState } from '@shared/schema';

// Helper functions for blackjack game
export function createDeck(): BlackjackCard[] {
  const suits: Array<'hearts' | 'diamonds' | 'clubs' | 'spades'> = ['hearts', 'diamonds', 'clubs', 'spades'];
  const values: Array<'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'> = 
    ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  
  const deck: BlackjackCard[] = [];
  
  for (const suit of suits) {
    for (const value of values) {
      let numericValue = 0;
      
      if (value === 'A') {
        numericValue = 11; // Aces are initially worth 11
      } else if (['J', 'Q', 'K'].includes(value)) {
        numericValue = 10; // Face cards are worth 10
      } else {
        numericValue = parseInt(value); // Number cards are worth their face value
      }
      
      deck.push({ suit, value, numericValue });
    }
  }
  
  return shuffleDeck(deck);
}

export function shuffleDeck(deck: BlackjackCard[]): BlackjackCard[] {
  // Fisher-Yates shuffle algorithm
  const newDeck = [...deck];
  
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  
  return newDeck;
}

export function dealCards(userId: number, betAmount: number): BlackjackGameState {
  const deck = createDeck();
  
  // Deal initial cards
  const playerHand: BlackjackCard[] = [deck.pop()!, deck.pop()!];
  const dealerHand: BlackjackCard[] = [deck.pop()!, deck.pop()!];
  
  const playerValue = calculateHandValue(playerHand);
  const dealerValue = calculateHandValue([dealerHand[0]]); // Only count first card for dealer initial value
  
  // Check for player blackjack
  const status = playerValue === 21 ? 'player_blackjack' : 'active';
  
  return {
    playerHand,
    dealerHand,
    playerValue,
    dealerValue,
    betAmount,
    status,
    userId
  };
}

export function hitCard(gameState: BlackjackGameState): BlackjackGameState {
  if (gameState.status !== 'active') {
    return gameState; // Can't hit if game isn't active
  }
  
  const deck = createDeck();
  const newCard = deck.pop()!;
  
  const updatedPlayerHand = [...gameState.playerHand, newCard];
  const updatedPlayerValue = calculateHandValue(updatedPlayerHand);
  
  let updatedStatus = gameState.status;
  
  // Check if player busts
  if (updatedPlayerValue > 21) {
    updatedStatus = 'dealer_won';
  }
  
  return {
    ...gameState,
    playerHand: updatedPlayerHand,
    playerValue: updatedPlayerValue,
    status: updatedStatus
  };
}

export function dealerPlay(gameState: BlackjackGameState): BlackjackGameState {
  if (gameState.status !== 'active') {
    return gameState; // Can't dealer play if game isn't active
  }
  
  let updatedDealerHand = [...gameState.dealerHand];
  let updatedDealerValue = calculateHandValue(updatedDealerHand);
  
  // Dealer draws cards until they have at least 17
  const deck = createDeck();
  while (updatedDealerValue < 17) {
    const newCard = deck.pop()!;
    updatedDealerHand.push(newCard);
    updatedDealerValue = calculateHandValue(updatedDealerHand);
  }
  
  let updatedStatus: BlackjackGameState['status'];
  
  // Determine outcome
  if (updatedDealerValue > 21) {
    // Dealer busts
    updatedStatus = 'player_won';
  } else if (updatedDealerValue > gameState.playerValue) {
    // Dealer wins
    updatedStatus = 'dealer_won';
  } else if (updatedDealerValue < gameState.playerValue) {
    // Player wins
    updatedStatus = 'player_won';
  } else {
    // Push (tie)
    updatedStatus = 'push';
  }
  
  return {
    ...gameState,
    dealerHand: updatedDealerHand,
    dealerValue: updatedDealerValue,
    status: updatedStatus
  };
}

export function calculateHandValue(hand: BlackjackCard[]): number {
  let value = hand.reduce((sum, card) => sum + card.numericValue, 0);
  
  // Adjust for aces if needed
  let aceCount = hand.filter(card => card.value === 'A').length;
  while (value > 21 && aceCount > 0) {
    value -= 10; // Convert an ace from 11 to 1
    aceCount--;
  }
  
  return value;
}

export function calculateWinnings(gameState: BlackjackGameState): number {
  switch (gameState.status) {
    case 'player_won':
      return gameState.betAmount * 2; // Return original bet plus winnings
    case 'player_blackjack':
      return Math.floor(gameState.betAmount * 2.5); // Blackjack typically pays 3:2
    case 'push':
      return gameState.betAmount; // Return original bet
    default:
      return 0; // Player lost
  }
}
