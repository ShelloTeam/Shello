import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {
  login,
  register,
  logout,
  getStoredUser,
  getToken,
} from '../services/authService';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('authService tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
  });

  test('login stores token and user details on success', async () => {
    const mockUserResponse = {
      data: {
        token: 'mock-token',
        user_id: 'user-123',
        nome: 'John Doe',
      },
    };
    mockedAxios.post.mockResolvedValueOnce(mockUserResponse);

    const user = await login('john@example.com', 'secret123');

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/mobile/login'),
      {
        email: 'john@example.com',
        password: 'secret123',
      }
    );
    expect(user).toEqual({ user_id: 'user-123', nome: 'John Doe' });
    expect(await AsyncStorage.getItem('@shello:token')).toBe('mock-token');
    expect(await AsyncStorage.getItem('@shello:user')).toBe(
      JSON.stringify({ user_id: 'user-123', nome: 'John Doe' })
    );
  });

  test('register stores token and user details on success', async () => {
    const mockUserResponse = {
      data: {
        token: 'mock-token-2',
        user_id: 'user-456',
        nome: 'Alice Jane',
      },
    };
    mockedAxios.post.mockResolvedValueOnce(mockUserResponse);

    const user = await register('Alice Jane', 'alice@example.com', 'secret456');

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/mobile/register'),
      {
        nome: 'Alice Jane',
        email: 'alice@example.com',
        password: 'secret456',
      }
    );
    expect(user).toEqual({ user_id: 'user-456', nome: 'Alice Jane' });
    expect(await AsyncStorage.getItem('@shello:token')).toBe('mock-token-2');
  });

  test('logout removes token and user details', async () => {
    await AsyncStorage.setItem('@shello:token', 'some-token');
    await AsyncStorage.setItem('@shello:user', 'some-user');

    await logout();

    expect(await AsyncStorage.getItem('@shello:token')).toBeNull();
    expect(await AsyncStorage.getItem('@shello:user')).toBeNull();
  });

  test('getStoredUser returns parsed user details if stored', async () => {
    const mockUser = { user_id: 'user-789', nome: 'Bob' };
    await AsyncStorage.setItem('@shello:user', JSON.stringify(mockUser));

    const user = await getStoredUser();
    expect(user).toEqual(mockUser);
  });

  test('getStoredUser returns null if nothing is stored', async () => {
    const user = await getStoredUser();
    expect(user).toBeNull();
  });

  test('getStoredUser returns null if json parsing fails', async () => {
    await AsyncStorage.setItem('@shello:user', 'invalid-json');
    const user = await getStoredUser();
    expect(user).toBeNull();
  });

  test('getToken retrieves current stored token', async () => {
    await AsyncStorage.setItem('@shello:token', 'active-token');
    const token = await getToken();
    expect(token).toBe('active-token');
  });
});
