import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import TelaChat from '../screens/TelaChat';
import api from '../services/api';

const mockAdicionarTarefaDeChat = jest.fn();

jest.mock('../contexts/ShelloContext', () => ({
  useShello: () => ({
    nomeUsuario: 'Test User',
    adicionarTarefaDeChat: mockAdicionarTarefaDeChat,
  }),
}));

jest.mock('../services/api', () => ({
  post: jest.fn(() => Promise.resolve({ data: { response: 'Hello', conversation_id: '123' } })),
  get: jest.fn(() => Promise.resolve({ data: [] })),
}));

// Mock Sprite Sheet asset
jest.mock('../../assets/shello-expressoes.jpeg', () => 1);

const mockApi = api as jest.Mocked<typeof api>;

describe('TelaChat Screen Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders quick suggestions when there are few messages', () => {
    const { getByText } = render(<TelaChat />);
    expect(getByText('Me ajude a refletir sobre meu dia')).toBeTruthy();
    expect(getByText('Prática de gratidão')).toBeTruthy();
  });

  test('sends a suggestion click to API', async () => {
    const { getByText } = render(<TelaChat />);
    const suggestionButton = getByText('Prática de gratidão');

    await act(async () => {
      fireEvent.press(suggestionButton);
    });

    expect(mockApi.post).toHaveBeenCalledWith('/api/chat', {
      message: 'Prática de gratidão',
      conversation_id: undefined,
    });
  });

  test('displays suggested task card when suggest_task is returned', async () => {
    mockApi.post.mockResolvedValueOnce({
      data: {
        response: 'Você deveria beber água!',
        conversation_id: '123',
        suggest_task: 'Beber água',
      },
    });

    const { getByTestId, getByText } = render(<TelaChat />);
    const input = getByTestId('chat-input');
    const sendButton = getByTestId('chat-send-button');

    fireEvent.changeText(input, 'Estou com sede');
    
    await act(async () => {
      fireEvent.press(sendButton);
    });

    await waitFor(() => {
      expect(getByText('  Criar tarefa?')).toBeTruthy();
      expect(getByText('Beber água')).toBeTruthy();
    });
  });

  test('pressing confirm on suggested task calls adicionarTarefa and hides card', async () => {
    mockApi.post.mockResolvedValueOnce({
      data: {
        response: 'Vamos meditar?',
        conversation_id: '123',
        suggest_task: 'Meditar 10 minutos',
      },
    });

    const { getByTestId, getByText, queryByText } = render(<TelaChat />);
    const input = getByTestId('chat-input');
    const sendButton = getByTestId('chat-send-button');

    fireEvent.changeText(input, 'Estou ansioso');
    await act(async () => {
      fireEvent.press(sendButton);
    });

    await waitFor(() => {
      expect(getByText('Meditar 10 minutos')).toBeTruthy();
    });

    const confirmButton = getByText('✓ Confirmar');
    await act(async () => {
      fireEvent.press(confirmButton);
    });

    expect(mockAdicionarTarefaDeChat).toHaveBeenCalledWith('Meditar 10 minutos');
    expect(queryByText('Meditar 10 minutos')).toBeNull();
  });
});
