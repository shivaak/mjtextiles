// User repository - CRUD operations for users

import { v4 as uuidv4 } from 'uuid';
import type { User, AuthSession } from '../../domain/types';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../storage';

export function getAllUsers(): User[] {
  return getStorageItem<User[]>(STORAGE_KEYS.USERS) || [];
}

export function getUserById(id: string): User | undefined {
  const users = getAllUsers();
  return users.find(u => u.id === id);
}

export function getUserByUsername(username: string): User | undefined {
  const users = getAllUsers();
  return users.find(u => u.username.toLowerCase() === username.toLowerCase());
}

export function createUser(userData: Omit<User, 'id' | 'createdAt'>): User {
  const users = getAllUsers();
  
  // Check username uniqueness
  if (users.some(u => u.username.toLowerCase() === userData.username.toLowerCase())) {
    throw new Error('Username already exists');
  }

  const newUser: User = {
    ...userData,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };

  setStorageItem(STORAGE_KEYS.USERS, [...users, newUser]);
  return newUser;
}

export function updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): User {
  const users = getAllUsers();
  const index = users.findIndex(u => u.id === id);
  
  if (index === -1) {
    throw new Error('User not found');
  }

  // Check username uniqueness if updating username
  if (updates.username && users.some(u => u.username.toLowerCase() === updates.username!.toLowerCase() && u.id !== id)) {
    throw new Error('Username already exists');
  }

  const updatedUser = { ...users[index], ...updates };
  users[index] = updatedUser;
  setStorageItem(STORAGE_KEYS.USERS, users);
  return updatedUser;
}

export function deleteUser(id: string): void {
  const users = getAllUsers();
  const filtered = users.filter(u => u.id !== id);
  setStorageItem(STORAGE_KEYS.USERS, filtered);
}

// Auth functions
export function authenticate(username: string, password: string): AuthSession | null {
  const user = getUserByUsername(username);
  
  if (!user || user.password !== password || !user.isActive) {
    return null;
  }

  const session: AuthSession = {
    userId: user.id,
    username: user.username,
    role: user.role,
    fullName: user.fullName,
    loginAt: new Date().toISOString(),
  };

  setStorageItem(STORAGE_KEYS.SESSION, session);
  return session;
}

export function getSession(): AuthSession | null {
  return getStorageItem<AuthSession>(STORAGE_KEYS.SESSION);
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
}

export function resetPassword(userId: string, newPassword: string): void {
  updateUser(userId, { password: newPassword });
}
