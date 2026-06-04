// Testes dos Serviços Mockados (mockServicos.ts)
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  salvarNota,
  buscarNotas,
  salvarTarefa,
  buscarTarefas,
  alternarTarefa,
  salvarDadosOnboarding,
  buscarDadosOnboarding,
  salvarMemoria,
  buscarMemorias,
  removerMemoria,
} from '../services/mockServicos';

// Limpa o AsyncStorage antes de cada teste
beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('Serviços de Diário', () => {
  it('deve salvar e buscar uma nota', async () => {
    const nota = await salvarNota('Hoje foi um bom dia!');
    expect(nota.id).toBeDefined();
    expect(nota.conteudo).toBe('Hoje foi um bom dia!');
    expect(nota.dataCriacao).toBeDefined();

    const notas = await buscarNotas();
    expect(notas).toHaveLength(1);
    expect(notas[0].conteudo).toBe('Hoje foi um bom dia!');
  });

  it('deve retornar lista vazia quando não há notas', async () => {
    const notas = await buscarNotas();
    expect(notas).toEqual([]);
  });

  it('deve ordenar as notas da mais recente para a mais antiga', async () => {
    await salvarNota('Primeira nota');
    await salvarNota('Segunda nota');
    const notas = await buscarNotas();
    expect(notas[0].conteudo).toBe('Segunda nota');
  });
});

describe('Serviços de Tarefas', () => {
  it('deve salvar e buscar uma tarefa', async () => {
    const tarefa = await salvarTarefa('Meditar por 10 minutos');
    expect(tarefa.id).toBeDefined();
    expect(tarefa.titulo).toBe('Meditar por 10 minutos');
    expect(tarefa.concluida).toBe(false);

    const tarefas = await buscarTarefas();
    expect(tarefas).toHaveLength(1);
  });

  it('deve alternar o estado de conclusão de uma tarefa', async () => {
    const tarefa = await salvarTarefa('Ler 30 minutos');
    expect(tarefa.concluida).toBe(false);

    const atualizadas = await alternarTarefa(tarefa.id);
    const tarefaAtualizada = atualizadas.find((t) => t.id === tarefa.id);
    expect(tarefaAtualizada?.concluida).toBe(true);

    // Alternar novamente deve desmarcar
    const revertidas = await alternarTarefa(tarefa.id);
    const revertida = revertidas.find((t) => t.id === tarefa.id);
    expect(revertida?.concluida).toBe(false);
  });
});

describe('Serviços de Onboarding', () => {
  it('deve salvar e buscar os dados de onboarding', async () => {
    const dados = {
      nome: 'Alex',
      estiloDeVida: 'Trabalho de casa e pratico yoga',
      metaAtual: 'Consistência nos estudos',
    };
    await salvarDadosOnboarding(dados);

    const recuperado = await buscarDadosOnboarding();
    expect(recuperado).toEqual(dados);
  });

  it('deve retornar null quando não há dados de onboarding', async () => {
    const recuperado = await buscarDadosOnboarding();
    expect(recuperado).toBeNull();
  });
});

describe('Serviços de Memórias da IA', () => {
  it('deve salvar e buscar uma memória', async () => {
    const memoria = await salvarMemoria('Prefere ser chamado de Alex', 'PREFERENCIA');
    expect(memoria.id).toBeDefined();
    expect(memoria.tipo).toBe('PREFERENCIA');
    expect(memoria.conteudo).toBe('Prefere ser chamado de Alex');

    const memorias = await buscarMemorias();
    expect(memorias).toHaveLength(1);
  });

  it('deve remover uma memória pelo ID', async () => {
    const m1 = await salvarMemoria('Trabalha de manhã', 'FATO');
    await salvarMemoria('Quer melhorar os estudos', 'OBJETIVO');

    const restantes = await removerMemoria(m1.id);
    expect(restantes).toHaveLength(1);
    expect(restantes[0].tipo).toBe('OBJETIVO');
  });
});
