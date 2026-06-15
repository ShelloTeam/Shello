import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import TelaTarefas from '../screens/TelaTarefas';
import { useShello } from '../contexts/ShelloContext';

const mockAdicionarTarefa = jest.fn();
const mockAlternarTarefa = jest.fn();
const mockRemoverTarefa = jest.fn();
const mockRemoverRotina = jest.fn();

jest.mock('../contexts/ShelloContext', () => ({
  useShello: jest.fn(),
}));

const mockUseShello = useShello as jest.Mock;

describe('TelaTarefas Screen Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders tasks list and handles empty task state CTA', () => {
    mockUseShello.mockReturnValue({
      tarefas: [],
      rotinas: [],
      adicionarTarefa: mockAdicionarTarefa,
      alternarTarefa: mockAlternarTarefa,
      removerTarefa: mockRemoverTarefa,
      removerRotina: mockRemoverRotina,
    });

    const { getByText } = render(<TelaTarefas />);
    expect(getByText('Nenhuma tarefa ainda')).toBeTruthy();
  });

  test('renders custom tasks list and triggers status toggling', async () => {
    const mockTasks = [
      {
        id: 'task-1',
        titulo: 'Drink coffee',
        descricao: 'Morning brew',
        concluida: false,
        data: '2026-06-15',
        dataCriacao: new Date().toISOString(),
      },
    ];

    mockUseShello.mockReturnValue({
      tarefas: mockTasks,
      rotinas: [],
      adicionarTarefa: mockAdicionarTarefa,
      alternarTarefa: mockAlternarTarefa,
      removerTarefa: mockRemoverTarefa,
      removerRotina: mockRemoverRotina,
    });

    const { getByText, getByRole } = render(<TelaTarefas />);
    expect(getByText('Drink coffee')).toBeTruthy();
    expect(getByText('Morning brew')).toBeTruthy();

    const checkbox = getByRole('checkbox');
    await act(async () => {
      fireEvent.press(checkbox);
    });

    expect(mockAlternarTarefa).toHaveBeenCalledWith('task-1');
  });

  test('modal inputs work and trigger task addition', async () => {
    mockUseShello.mockReturnValue({
      tarefas: [],
      rotinas: [],
      adicionarTarefa: mockAdicionarTarefa,
      alternarTarefa: mockAlternarTarefa,
      removerTarefa: mockRemoverTarefa,
      removerRotina: mockRemoverRotina,
    });

    const { getByLabelText, getByPlaceholderText, getByText } = render(<TelaTarefas />);
    
    // Open task modal
    const plusButton = getByLabelText('Adicionar nova tarefa');
    fireEvent.press(plusButton);

    const titleInput = getByPlaceholderText('Ex: Meditar por 10 minutos...');
    const descInput = getByPlaceholderText('Adicione detalhes sobre sua tarefa...');
    const dateInput = getByPlaceholderText('dd/mm/aaaa');

    fireEvent.changeText(titleInput, 'Gym session');
    fireEvent.changeText(descInput, 'Leg day');
    fireEvent.changeText(dateInput, '17/06/2026');

    const createButton = getByText('Criar Tarefa');
    await act(async () => {
      fireEvent.press(createButton);
    });

    expect(mockAdicionarTarefa).toHaveBeenCalledWith('Gym session', 'Leg day', '2026-06-17');
  });

  test('renders routine list and triggers deletion with confirmation dialog', async () => {
    const mockRoutines = [
      {
        id: 'routine-1',
        titulo: 'Water plants',
        atividades: ['Water balcony', 'Water living room'],
        periodo: 'tarde',
      },
    ];

    mockUseShello.mockReturnValue({
      tarefas: [],
      rotinas: mockRoutines,
      adicionarTarefa: mockAdicionarTarefa,
      alternarTarefa: mockAlternarTarefa,
      removerTarefa: mockRemoverTarefa,
      removerRotina: mockRemoverRotina,
    });

    const { getByTestId, getByText, queryByText } = render(<TelaTarefas />);
    expect(getByText('Water plants')).toBeTruthy();
    expect(getByText('Water balcony')).toBeTruthy();

    // Trigger routine deletion
    const deleteButton = getByTestId('delete-routine-routine-1');
    fireEvent.press(deleteButton);

    // Confirm dialog is displayed
    expect(getByText('Deseja mesmo remover esta rotina de sua jornada?')).toBeTruthy();

    const confirmButton = getByText('Excluir');
    await act(async () => {
      fireEvent.press(confirmButton);
    });

    expect(mockRemoverRotina).toHaveBeenCalledWith('routine-1');
  });

  test('renders empty state CTA when no custom routines exist', () => {
    mockUseShello.mockReturnValue({
      tarefas: [],
      rotinas: [],
      adicionarTarefa: mockAdicionarTarefa,
      alternarTarefa: mockAlternarTarefa,
      removerTarefa: mockRemoverTarefa,
      removerRotina: mockRemoverRotina,
    });

    const { getByTestId, getByText } = render(<TelaTarefas />);
    const cta = getByTestId('empty-routines-cta');
    expect(cta).toBeTruthy();
    expect(getByText('Nenhuma rotina personalizada')).toBeTruthy();
  });
});
