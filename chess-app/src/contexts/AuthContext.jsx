import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getItem, setItem, removeItem } from '../utils/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = getItem('chess_current_user');
    if (saved) {
      const users = getItem('chess_users', []);
      const user = users.find((u) => u.id === saved.id);
      if (user) setCurrentUser(user);
    }
    setLoading(false);
  }, []);

  const signup = useCallback((email, password, username) => {
    const users = getItem('chess_users', []);
    if (users.find((u) => u.email === email)) {
      throw new Error('Email already registered');
    }
    if (users.find((u) => u.username === username)) {
      throw new Error('Username already taken');
    }
    const newUser = {
      id: uuidv4(),
      username,
      email,
      password,
      elo: 1200,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      joinedAt: new Date().toISOString(),
      bio: '',
      eloHistory: [{ date: new Date().toISOString(), elo: 1200 }],
    };
    users.push(newUser);
    setItem('chess_users', users);
    setItem('chess_current_user', { id: newUser.id });
    setCurrentUser(newUser);
    return newUser;
  }, []);

  const login = useCallback((email, password) => {
    const users = getItem('chess_users', []);
    const user = users.find((u) => u.email === email && u.password === password);
    if (!user) throw new Error('Invalid email or password');
    setItem('chess_current_user', { id: user.id });
    setCurrentUser(user);
    return user;
  }, []);

  const logout = useCallback(() => {
    removeItem('chess_current_user');
    setCurrentUser(null);
  }, []);

  const updateProfile = useCallback((data) => {
    const users = getItem('chess_users', []);
    const idx = users.findIndex((u) => u.id === currentUser.id);
    if (idx === -1) return;
    const updated = { ...users[idx], ...data };
    users[idx] = updated;
    setItem('chess_users', users);
    setCurrentUser(updated);
  }, [currentUser]);

  const refreshUser = useCallback(() => {
    if (!currentUser) return;
    const users = getItem('chess_users', []);
    const user = users.find((u) => u.id === currentUser.id);
    if (user) setCurrentUser(user);
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated: !!currentUser, loading, signup, login, logout, updateProfile, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
