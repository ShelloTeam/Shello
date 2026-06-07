import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@shello:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
