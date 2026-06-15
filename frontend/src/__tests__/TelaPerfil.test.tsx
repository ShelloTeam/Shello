import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import TelaPerfil from '../screens/TelaPerfil';
import api from '../services/api';

jest.mock('../contexts/ShelloContext', () => ({
  useShello: () => ({
    nomeUsuario: 'Test User',
    memorias: [],
    removerMemoria: jest.fn(),
    nivelFormalidade: 'media',
    setNivelFormalidade: jest.fn(),
    sair: jest.fn(),
    dadosOnboarding: null,
    definirUsuario: jest.fn(),
    recarregarMemorias: jest.fn(),
  }),
}));

jest.mock('../services/api', () => ({
  get: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({})),
}));

// Mock logo asset
jest.mock('../../assets/logoshello.jpeg', () => 1);

const mockApi = api as jest.Mocked<typeof api>;

describe('TelaPerfil Screen Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetches and displays user details via /api/users/me on mount', async () => {
    mockApi.get.mockResolvedValueOnce({
      data: {
        nome: 'John Doe',
        email: 'john.doe@example.com',
        user_id: 'user-123',
      },
    });

    const { getByText } = render(<TelaPerfil />);

    expect(mockApi.get).toHaveBeenCalledWith('/api/users/me');

    await waitFor(() => {
      expect(getByText('john.doe@example.com')).toBeTruthy();
    });
  });
});
