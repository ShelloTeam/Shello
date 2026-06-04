// Testes de sanidade — TelaEntradaDiario.tsx
// Verifica renderização básica e elementos de UI essenciais

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import TelaEntradaDiario from '../screens/TelaEntradaDiario';

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

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
const mockNav = { goBack: mockGoBack, navigate: mockNavigate } as any;

function renderNovaEntrada() {
  const mockRoute = { params: { nova: true } } as any;
  return render(<TelaEntradaDiario route={mockRoute} navigation={mockNav} />);
}

function renderEntradaExistente() {
  const mockRoute = {
    params: {
      entrada: {
        id: 'abc123',
        titulo: 'Meu dia especial',
        conteudo: 'Hoje foi um dia incrível!',
        dataCriacao: new Date().toISOString(),
        adicionadaAoContexto: false,
      },
    },
  } as any;
  return render(<TelaEntradaDiario route={mockRoute} navigation={mockNav} />);
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe('TelaEntradaDiario', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza sem crash com nova: true', () => {
    expect(() => renderNovaEntrada()).not.toThrow();
  });

  it('renderiza sem crash com entrada existente', () => {
    expect(() => renderEntradaExistente()).not.toThrow();
  });

  it('exibe o botão "Finalizar entrada"', () => {
    renderNovaEntrada();
    expect(screen.getByText(/finalizar entrada/i)).toBeTruthy();
  });

  it('exibe o botão "+ Contexto Shello"', () => {
    renderNovaEntrada();
    expect(screen.getByText(/contexto shello/i)).toBeTruthy();
  });

  it('exibe o título "Nova entrada" para nova entrada', () => {
    renderNovaEntrada();
    expect(screen.getByText('Nova entrada')).toBeTruthy();
  });

  it('exibe o título "Editar entrada" para entrada existente', () => {
    renderEntradaExistente();
    expect(screen.getByText('Editar entrada')).toBeTruthy();
  });

  it('exibe o placeholder do input de texto', () => {
    renderNovaEntrada();
    expect(
      screen.getByPlaceholderText('Comece a escrever sua reflexão de hoje...')
    ).toBeTruthy();
  });

  it('input de texto aceita digitação', () => {
    renderNovaEntrada();
    const input = screen.getByPlaceholderText('Comece a escrever sua reflexão de hoje...');
    fireEvent.changeText(input, 'Hoje foi um ótimo dia!');
    expect(input.props.value).toBe('Hoje foi um ótimo dia!');
  });

  it('pré-preenche o input com conteúdo da entrada existente', () => {
    renderEntradaExistente();
    const input = screen.getByPlaceholderText('Comece a escrever sua reflexão de hoje...');
    expect(input.props.value).toBe('Hoje foi um dia incrível!');
  });

  it('exibe contagem de caracteres', () => {
    renderNovaEntrada();
    expect(screen.getByText(/0 caracteres/i)).toBeTruthy();
  });
});
