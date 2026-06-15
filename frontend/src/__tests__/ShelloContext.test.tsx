import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { Text, Button, View } from 'react-native';
import { ShelloProvider, useShello } from '../contexts/ShelloContext';
import api from '../services/api';
import { getStoredUser } from '../services/authService';

jest.mock('../services/api', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({})),
}));

jest.mock('../services/authService', () => ({
  getStoredUser: jest.fn(),
  logout: jest.fn(),
  getToken: jest.fn(),
}));

const mockApi = api as jest.Mocked<typeof api>;
const mockGetStoredUser = getStoredUser as jest.Mock;

function TestComponent() {
  const {
    nomeUsuario,
    onboardingConcluido,
    carregando,
    tarefas,
    rotinas,
    entradas,
    adicionarTarefa,
    alternarTarefa,
    removerTarefa,
    adicionarRotina,
    removerRotina,
    adicionarEntrada,
    atualizarEntrada,
    removerEntrada,
    marcarEntradaComoContexto,
    recarregarDados,
  } = useShello();

  return (
    <View testID="provider-test">
      <Text testID="username">{nomeUsuario}</Text>
      <Text testID="loading">{carregando ? 'true' : 'false'}</Text>
      <Text testID="onboarding">{onboardingConcluido ? 'true' : 'false'}</Text>
      <Text testID="tasks-count">{tarefas.length}</Text>
      <Text testID="routines-count">{rotinas.length}</Text>
      <Text testID="entries-count">{entradas.length}</Text>

      <Button
        title="Reload"
        onPress={() => recarregarDados()}
        testID="btn-reload"
      />
      <Button
        title="AddTask"
        onPress={() => adicionarTarefa('New Task', 'Desc', '2026-06-16')}
        testID="btn-add-task"
      />
      <Button
        title="ToggleTask"
        onPress={() => tarefas[0] && alternarTarefa(tarefas[0].id)}
        testID="btn-toggle-task"
      />
      <Button
        title="RemoveTask"
        onPress={() => tarefas[0] && removerTarefa(tarefas[0].id)}
        testID="btn-remove-task"
      />
      <Button
        title="AddRoutine"
        onPress={() => adicionarRotina('Morning Routine', ['Activity 1'], 'manha')}
        testID="btn-add-routine"
      />
      <Button
        title="RemoveRoutine"
        onPress={() => rotinas[0] && removerRotina(rotinas[0].id)}
        testID="btn-remove-routine"
      />
      <Button
        title="AddEntry"
        onPress={() => adicionarEntrada('Diary Title', 'This is content')}
        testID="btn-add-entry"
      />
    </View>
  );
}

describe('ShelloContext state management tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('loads initial data when user is logged in', async () => {
    mockGetStoredUser.mockResolvedValueOnce({ user_id: 'user-123', nome: 'Tester' });
    mockApi.get.mockImplementation((url) => {
      if (url === '/api/diary') return Promise.resolve({ data: { items: [] } });
      if (url === '/api/tasks') return Promise.resolve({ data: [] });
      if (url === '/api/routines') return Promise.resolve({ data: [] });
      if (url === '/api/memories') return Promise.resolve({ data: [] });
      if (url === '/api/users/preferences') return Promise.resolve({ data: { nome_referencia: 'Test Ref' } });
      return Promise.resolve({ data: {} });
    });

    const { getByTestId } = render(
      <ShelloProvider>
        <TestComponent />
      </ShelloProvider>
    );

    await waitFor(() => {
      expect(getByTestId('loading').props.children).toBe('false');
    });

    expect(getByTestId('username').props.children).toBe('Test Ref');
    expect(getByTestId('onboarding').props.children).toBe('true');
  });

  test('manages tasks lifecycle correctly', async () => {
    mockGetStoredUser.mockResolvedValueOnce({ user_id: 'user-123', nome: 'Tester' });
    
    // Set up mock implementations
    mockApi.get.mockImplementation((url) => {
      if (url === '/api/tasks') return Promise.resolve({ data: [{ id: 'task-1', title: 'Task 1', status: 'pending' }] });
      return Promise.resolve({ data: [] });
    });
    mockApi.post.mockResolvedValueOnce({
      data: { id: 'task-new', title: 'New Task', description: 'Desc', status: 'pending', due_date: '2026-06-16' },
    });
    mockApi.patch.mockResolvedValueOnce({
      data: { id: 'task-new', title: 'New Task', description: 'Desc', status: 'done', due_date: '2026-06-16' },
    });
    mockApi.delete.mockResolvedValueOnce({});

    const { getByTestId } = render(
      <ShelloProvider>
        <TestComponent />
      </ShelloProvider>
    );

    await waitFor(() => {
      expect(getByTestId('loading').props.children).toBe('false');
    });

    // Expecting 1 task initially loaded
    expect(getByTestId('tasks-count').props.children).toBe(1);

    // Click AddTask
    await act(async () => {
      getByTestId('btn-add-task').props.onPress();
    });

    // Check post request
    expect(mockApi.post).toHaveBeenCalledWith('/api/tasks', {
      title: 'New Task',
      description: 'Desc',
      due_date: '2026-06-16',
    });

    // Toggling Task (it uses optimism so we verify toggled behavior)
    await act(async () => {
      getByTestId('btn-toggle-task').props.onPress();
    });

    expect(mockApi.patch).toHaveBeenCalledWith('/api/v1/tasks/task-1/status', {
      status: 'done',
    });

    // Removing Task
    await act(async () => {
      getByTestId('btn-remove-task').props.onPress();
    });

    expect(mockApi.delete).toHaveBeenCalledWith('/api/tasks/task-1');
  });

  test('manages routines correctly', async () => {
    mockGetStoredUser.mockResolvedValueOnce({ user_id: 'user-123', nome: 'Tester' });
    
    mockApi.get.mockImplementation((url) => {
      if (url === '/api/routines') return Promise.resolve({ data: [{ id: 'r-1', nome: 'Routine 1', atividades: [], periodo: 'manha' }] });
      return Promise.resolve({ data: [] });
    });
    mockApi.post.mockResolvedValueOnce({
      data: { id: 'r-2', nome: 'Morning Routine', atividades: ['Activity 1'], periodo: 'manha' },
    });
    mockApi.delete.mockResolvedValueOnce({});

    const { getByTestId } = render(
      <ShelloProvider>
        <TestComponent />
      </ShelloProvider>
    );

    await waitFor(() => {
      expect(getByTestId('loading').props.children).toBe('false');
    });

    expect(getByTestId('routines-count').props.children).toBe(1);

    await act(async () => {
      getByTestId('btn-add-routine').props.onPress();
    });

    expect(mockApi.post).toHaveBeenCalledWith('/api/routines', {
      nome: 'Morning Routine',
      atividades: ['Activity 1'],
      periodo: 'manha',
    });

    await act(async () => {
      getByTestId('btn-remove-routine').props.onPress();
    });

    expect(mockApi.delete).toHaveBeenCalledWith('/api/routines/r-1');
  });

  test('manages diary entries correctly', async () => {
    mockGetStoredUser.mockResolvedValueOnce({ user_id: 'user-123', nome: 'Tester' });
    mockApi.post.mockResolvedValueOnce({
      data: { id: 'e-1', content: 'This is content', created_at: '2026-06-15T18:00:00Z' },
    });

    const { getByTestId } = render(
      <ShelloProvider>
        <TestComponent />
      </ShelloProvider>
    );

    await waitFor(() => {
      expect(getByTestId('loading').props.children).toBe('false');
    });

    await act(async () => {
      getByTestId('btn-add-entry').props.onPress();
    });

    expect(mockApi.post).toHaveBeenCalledWith('/api/diary', {
      content: 'This is content',
    });
  });
});
