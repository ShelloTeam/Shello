// Testes dos Serviços Mockados v2 (mockServicos.ts)
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  salvarEntrada,
  buscarEntradas,
  atualizarEntrada,
  marcarEntradaComoContexto,
  salvarTarefa,
  buscarTarefas,
  alternarTarefa,
  salvarRotina,
  buscarRotinas,
  removerRotina,
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

describe('Serviços de Entradas do Diário', () => {
  it('deve salvar e buscar uma entrada', async () => {
    const entrada = await salvarEntrada('Meu dia', 'Foi um dia incrível!');
    expect(entrada.id).toBeDefined();
    expect(entrada.titulo).toBe('Meu dia');
    expect(entrada.conteudo).toBe('Foi um dia incrível!');
    expect(entrada.adicionadaAoContexto).toBe(false);

    const entradas = await buscarEntradas();
    expect(entradas).toHaveLength(1);
  });

  it('deve retornar lista vazia quando não há entradas', async () => {
    const entradas = await buscarEntradas();
    expect(entradas).toEqual([]);
  });

  it('deve ordenar entradas da mais recente para a mais antiga', async () => {
    await salvarEntrada('Primeira', 'Conteúdo 1');
    await salvarEntrada('Segunda', 'Conteúdo 2');
    const entradas = await buscarEntradas();
    expect(entradas[0].titulo).toBe('Segunda');
  });

  it('deve atualizar o conteúdo de uma entrada', async () => {
    const entrada = await salvarEntrada('Título original', 'Conteúdo original');
    await atualizarEntrada(entrada.id, 'Título atualizado', 'Novo conteúdo');
    const entradas = await buscarEntradas();
    expect(entradas[0].titulo).toBe('Título atualizado');
    expect(entradas[0].conteudo).toBe('Novo conteúdo');
  });

  it('deve marcar entrada como adicionada ao contexto', async () => {
    const entrada = await salvarEntrada('Reflexão', 'Hoje aprendi muito');
    expect(entrada.adicionadaAoContexto).toBe(false);
    await marcarEntradaComoContexto(entrada.id);
    const entradas = await buscarEntradas();
    expect(entradas[0].adicionadaAoContexto).toBe(true);
  });
});

describe('Serviços de Tarefas', () => {
  it('deve salvar tarefa com título, descrição e data', async () => {
    const tarefa = await salvarTarefa('Meditar', 'Por 10 minutos pela manhã', new Date().toISOString());
    expect(tarefa.titulo).toBe('Meditar');
    expect(tarefa.descricao).toBe('Por 10 minutos pela manhã');
    expect(tarefa.data).toBeDefined();
    expect(tarefa.concluida).toBe(false);
  });

  it('deve salvar tarefa sem campos opcionais', async () => {
    const tarefa = await salvarTarefa('Ler um livro');
    expect(tarefa.descricao).toBeUndefined();
    expect(tarefa.data).toBeUndefined();
  });

  it('deve alternar o estado de conclusão de uma tarefa', async () => {
    const tarefa = await salvarTarefa('Ler 30 minutos');
    const atualizadas = await alternarTarefa(tarefa.id);
    expect(atualizadas[0].concluida).toBe(true);
    const revertidas = await alternarTarefa(tarefa.id);
    expect(revertidas[0].concluida).toBe(false);
  });
});

describe('Serviços de Rotinas', () => {
  it('deve salvar e buscar uma rotina', async () => {
    const rotina = await salvarRotina('Rotina Matinal', ['Acordar às 7h', 'Meditar'], 'manha');
    expect(rotina.titulo).toBe('Rotina Matinal');
    expect(rotina.atividades).toHaveLength(2);
    expect(rotina.periodo).toBe('manha');

    const rotinas = await buscarRotinas();
    expect(rotinas).toHaveLength(1);
  });

  it('deve remover uma rotina pelo ID', async () => {
    const r1 = await salvarRotina('Manhã', ['Meditar'], 'manha');
    await salvarRotina('Noite', ['Leitura'], 'noite');
    await removerRotina(r1.id);
    const rotinas = await buscarRotinas();
    expect(rotinas).toHaveLength(1);
    expect(rotinas[0].periodo).toBe('noite');
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
    expect(memoria.tipo).toBe('PREFERENCIA');
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
