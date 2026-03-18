import { createContext, useContext, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getItem, setItem } from '../utils/storage';
import { calculateEloChange } from '../utils/elo';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const saveGame = useCallback((gameData) => {
    const games = getItem('chess_games', []);
    const game = { id: uuidv4(), date: new Date().toISOString(), ...gameData };
    games.unshift(game);
    setItem('chess_games', games);

    if (gameData.result !== '*' && gameData.userId) {
      const users = getItem('chess_users', []);
      const idx = users.findIndex((u) => u.id === gameData.userId);
      if (idx !== -1) {
        const user = { ...users[idx] };
        user.gamesPlayed += 1;
        const resultScore = gameData.result === 'win' ? 1 : gameData.result === 'loss' ? 0 : 0.5;
        const eloChange = calculateEloChange(user.elo, gameData.opponentElo || 1200, resultScore);
        user.elo = Math.max(100, user.elo + eloChange);
        if (gameData.result === 'win') user.wins += 1;
        else if (gameData.result === 'loss') user.losses += 1;
        else user.draws += 1;
        if (!user.eloHistory) user.eloHistory = [];
        user.eloHistory.push({ date: new Date().toISOString(), elo: user.elo });
        users[idx] = user;
        setItem('chess_users', users);
        game.eloChange = eloChange;
        const allGames = getItem('chess_games', []);
        const gi = allGames.findIndex((g) => g.id === game.id);
        if (gi !== -1) { allGames[gi] = game; setItem('chess_games', allGames); }
      }
    }
    return game;
  }, []);

  const getGames = useCallback((userId) => {
    const games = getItem('chess_games', []);
    if (!userId) return games;
    return games.filter((g) => g.userId === userId);
  }, []);

  const getGame = useCallback((gameId) => {
    const games = getItem('chess_games', []);
    return games.find((g) => g.id === gameId) || null;
  }, []);

  return (
    <GameContext.Provider value={{ saveGame, getGames, getGame }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGameContext() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameContext must be used within GameProvider');
  return ctx;
}
