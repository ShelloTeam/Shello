import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

const TOKEN_KEY = '@shello:token';
const USER_KEY = '@shello:user';

export interface AuthUser {
  user_id: string;
  nome: string;
}

export async function login(email: string, senha: string): Promise<AuthUser> {
  const { data } = await axios.post(`${API_BASE}/api/v1/auth/mobile/login`, {
    email,
    password: senha,
  });
  await AsyncStorage.setItem(TOKEN_KEY, data.token);
  const user: AuthUser = { user_id: data.user_id, nome: data.nome };
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

export async function register(
  nome: string,
  email: string,
  senha: string,
): Promise<AuthUser> {
  const { data } = await axios.post(`${API_BASE}/api/v1/auth/mobile/register`, {
    nome,
    email,
    password: senha,
  });
  await AsyncStorage.setItem(TOKEN_KEY, data.token);
  const user: AuthUser = { user_id: data.user_id, nome: data.nome };
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

export async function logout(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}

export async function getStoredUser(): Promise<AuthUser | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}
