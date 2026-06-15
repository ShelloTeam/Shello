import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import TelaDiario from '../screens/TelaDiario';
import api from '../services/api';

const mockRemoverEntrada = jest.fn();

jest.mock('../contexts/ShelloContext', () => ({
  useShello: () => ({
    entradas: [
      {
        id: 'entry-1',
        titulo: 'Reflection 1',
        conteudo: 'I feel great today writing tests.',
        dataCriacao: new Date().toISOString(),
        adicionadaAoContexto: false,
      },
    ],
    removerEntrada: mockRemoverEntrada,
  }),
}));

jest.mock('../services/api', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  delete: jest.fn(() => Promise.resolve({})),
}));

const mockApi = api as jest.Mocked<typeof api>;

const mockNavigation = {
  navigate: jest.fn(),
  addListener: jest.fn((event, callback) => {
    // Return unsubscribe function
    return jest.fn();
  }),
  getState: jest.fn(() => ({ routes: [] })),
  setParams: jest.fn(),
} as any;

const mockRoute = { params: {} } as any;

describe('TelaDiario Screen Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders diary entries list initially', () => {
    const { getByText } = render(
      <TelaDiario navigation={mockNavigation} route={mockRoute} />
    );
    expect(getByText('Reflection 1')).toBeTruthy();
    expect(getByText('I feel great today writing tests.')).toBeTruthy();
  });

  test('typing in search bar triggers /api/diary/search?q=', async () => {
    mockApi.get.mockResolvedValueOnce({
      data: {
        items: [
          {
            id: 'entry-search-1',
            content: 'Found a test search result here',
            created_at: new Date().toISOString(),
          },
        ],
      },
    });

    const { getByPlaceholderText, getByText } = render(
      <TelaDiario navigation={mockNavigation} route={mockRoute} />
    );

    const searchInput = getByPlaceholderText('Buscar nas suas reflexões...');
    
    await act(async () => {
      fireEvent.changeText(searchInput, 'search query');
    });

    expect(mockApi.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/diary/search?q=search%20query')
    );

    await waitFor(() => {
      expect(getByText('Found a test search result here')).toBeTruthy();
    });
  });

  test('selecting Historico filter triggers /api/history', async () => {
    mockApi.get.mockResolvedValueOnce({
      data: {
        items: [
          {
            id: 'hist-1',
            type: 'conversation',
            preview: 'I am a chat message from Shello',
            created_at: new Date().toISOString(),
            item_count: 5,
          },
          {
            id: 'hist-2',
            type: 'diary',
            preview: 'I am a reflection entry preview',
            created_at: new Date().toISOString(),
            item_count: 12,
          },
        ],
      },
    });

    const { getByText, getByTestId } = render(
      <TelaDiario navigation={mockNavigation} route={mockRoute} />
    );

    const historyFilter = getByText('Histórico');
    
    await act(async () => {
      fireEvent.press(historyFilter);
    });

    expect(mockApi.get).toHaveBeenCalledWith('/api/history');

    await waitFor(() => {
      expect(getByText('Conversa (5 msgs)')).toBeTruthy();
      expect(getByText('I am a chat message from Shello')).toBeTruthy();
      expect(getByText('Reflexão (12 palavras)')).toBeTruthy();
      expect(getByText('I am a reflection entry preview')).toBeTruthy();
    });
  });

  test('long pressing entry opens delete confirmation dialog and confirms deletion', async () => {
    const { getByText } = render(
      <TelaDiario navigation={mockNavigation} route={mockRoute} />
    );

    const entryCard = getByText('Reflection 1');
    
    // Long press to trigger delete dialog
    fireEvent(entryCard, 'onLongPress');

    expect(getByText('Tem certeza que deseja apagar esta reflexão? Esta ação não pode ser desfeita.')).toBeTruthy();

    const confirmButton = getByText('Excluir');
    await act(async () => {
      fireEvent.press(confirmButton);
    });

    expect(mockRemoverEntrada).toHaveBeenCalledWith('entry-1');
  });
});
