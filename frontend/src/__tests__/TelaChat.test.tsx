// Testes de sanidade — TelaChat.tsx
// Verifica renderização básica e elementos de UI essenciais do chat com IA

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import TelaChat from '../screens/TelaChat';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../contexts/ShelloContext', () => ({
  useShello: () => ({
    nomeUsuario: 'Teste',
    dadosOnboarding: { nome: 'Teste', estiloDeVida: 'ativo', metaAtual: 'estudar' },
    memorias: [],
    entradas: [],
    tarefas: [],
    rotinas: [],
    adicionarEntrada: jest.fn().mockResolvedValue({
      id: '1',
      titulo: 'T',
      conteudo: 'C',
      dataCriacao: new Date().toISOString(),
      adicionadaAoContexto: false,
    }),
    atualizarEntrada: jest.fn().mockResolvedValue(undefined),
    marcarEntradaComoContexto: jest.fn().mockResolvedValue(undefined),
    adicionarTarefa: jest.fn().mockResolvedValue({
      id: '1',
      titulo: 'T',
      concluida: false,
      dataCriacao: new Date().toISOString(),
    }),
  }),
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: any) => <View {...props}>{children}</View>,
    SafeAreaProvider: ({ children }: any) => children,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('@expo/vector-icons', () => {
  const { Text } = require('react-native');
  return {
    Feather: ({ name }: { name: string }) => <Text testID={`icon-${name}`}>{name}</Text>,
  };
});

// Mock do asset da imagem
jest.mock('../../assets/shello-expressoes.jpeg', () => 'shello-expressoes-mock');

// ─── Testes ───────────────────────────────────────────────────────────────────

describe('TelaChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza sem crash', () => {
    expect(() => render(<TelaChat />)).not.toThrow();
  });

  it('exibe o nome "Shello" no cabeçalho', () => {
    render(<TelaChat />);
    expect(screen.getByText('Shello')).toBeTruthy();
  });

  it('exibe o subtítulo do cabeçalho', () => {
    render(<TelaChat />);
    expect(screen.getByText('Seu Companheiro de IA')).toBeTruthy();
  });

  it('exibe as sugestões rápidas na tela inicial', () => {
    render(<TelaChat />);
    expect(screen.getByText('Me ajude a refletir sobre meu dia')).toBeTruthy();
    expect(screen.getByText('Prática de gratidão')).toBeTruthy();
    expect(screen.getByText('Ideias para o meu diário')).toBeTruthy();
  });

  it('exibe o input de texto', () => {
    render(<TelaChat />);
    expect(
      screen.getByPlaceholderText('Compartilhe seus pensamentos...')
    ).toBeTruthy();
  });

  it('exibe o botão de envio (ícone send)', () => {
    render(<TelaChat />);
    expect(screen.getByTestId('icon-send')).toBeTruthy();
  });

  it('exibe a mensagem de boas-vindas com o nome do usuário', () => {
    render(<TelaChat />);
    expect(screen.getByText(/Olá, Teste!/i)).toBeTruthy();
  });

  it('exibe o contador de mensagens no cabeçalho', () => {
    render(<TelaChat />);
    // O formato é "X/20"
    expect(screen.getByText(/\/20/)).toBeTruthy();
  });
});
