// Camada de Serviços Mockados — Shello
// Simula comunicação com backend usando AsyncStorage + setTimeout
// Todas as funções aqui serão substituídas por chamadas reais à API no futuro

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  NotaDiario,
  Tarefa,
  MemoriaIA,
  DadosOnboarding,
} from '../types';

// ─── Chaves de armazenamento ───────────────────────────────────────────────
const CHAVES = {
  NOTAS: '@shello:notas',
  TAREFAS: '@shello:tarefas',
  ONBOARDING: '@shello:onboarding',
  MEMORIAS: '@shello:memorias',
} as const;

/** Simula latência de rede (150-400ms) */
const simularLatencia = (ms = 250) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// ─── Geração de IDs ───────────────────────────────────────────────────────
export const gerarId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// ─── Serviços de Diário ───────────────────────────────────────────────────

/** Salva uma nova nota no diário */
export async function salvarNota(conteudo: string): Promise<NotaDiario> {
  await simularLatencia();
  const nota: NotaDiario = {
    id: gerarId(),
    conteudo,
    dataCriacao: new Date().toISOString(),
  };
  const notasExistentes = await buscarNotas();
  const novaLista = [nota, ...notasExistentes];
  await AsyncStorage.setItem(CHAVES.NOTAS, JSON.stringify(novaLista));
  return nota;
}

/** Busca todas as notas do diário */
export async function buscarNotas(): Promise<NotaDiario[]> {
  await simularLatencia(150);
  const dados = await AsyncStorage.getItem(CHAVES.NOTAS);
  return dados ? JSON.parse(dados) : [];
}

// ─── Serviços de Tarefas ──────────────────────────────────────────────────

/** Salva uma nova tarefa */
export async function salvarTarefa(titulo: string, dataVencimento?: string): Promise<Tarefa> {
  await simularLatencia();
  const tarefa: Tarefa = {
    id: gerarId(),
    titulo,
    concluida: false,
    dataCriacao: new Date().toISOString(),
    dataVencimento,
  };
  const tarefasExistentes = await buscarTarefas();
  const novaLista = [...tarefasExistentes, tarefa];
  await AsyncStorage.setItem(CHAVES.TAREFAS, JSON.stringify(novaLista));
  return tarefa;
}

/** Busca todas as tarefas */
export async function buscarTarefas(): Promise<Tarefa[]> {
  await simularLatencia(150);
  const dados = await AsyncStorage.getItem(CHAVES.TAREFAS);
  return dados ? JSON.parse(dados) : [];
}

/** Alterna o estado de conclusão de uma tarefa */
export async function alternarTarefa(id: string): Promise<Tarefa[]> {
  await simularLatencia(100);
  const tarefas = await buscarTarefas();
  const atualizadas = tarefas.map((t) =>
    t.id === id ? { ...t, concluida: !t.concluida } : t
  );
  await AsyncStorage.setItem(CHAVES.TAREFAS, JSON.stringify(atualizadas));
  return atualizadas;
}

// ─── Serviços de Onboarding ───────────────────────────────────────────────

/** Salva os dados coletados no onboarding */
export async function salvarDadosOnboarding(dados: DadosOnboarding): Promise<void> {
  await simularLatencia();
  await AsyncStorage.setItem(CHAVES.ONBOARDING, JSON.stringify(dados));
}

/** Busca os dados do onboarding */
export async function buscarDadosOnboarding(): Promise<DadosOnboarding | null> {
  await simularLatencia(150);
  const dados = await AsyncStorage.getItem(CHAVES.ONBOARDING);
  return dados ? JSON.parse(dados) : null;
}

// ─── Serviços de Memórias da IA ───────────────────────────────────────────

/** Salva uma nova memória da IA */
export async function salvarMemoria(
  conteudo: string,
  tipo: MemoriaIA['tipo']
): Promise<MemoriaIA> {
  await simularLatencia();
  const memoria: MemoriaIA = {
    id: gerarId(),
    tipo,
    conteudo,
    dataCriacao: new Date().toISOString(),
  };
  const memoriasExistentes = await buscarMemorias();
  const novaLista = [...memoriasExistentes, memoria];
  await AsyncStorage.setItem(CHAVES.MEMORIAS, JSON.stringify(novaLista));
  return memoria;
}

/** Busca todas as memórias */
export async function buscarMemorias(): Promise<MemoriaIA[]> {
  await simularLatencia(150);
  const dados = await AsyncStorage.getItem(CHAVES.MEMORIAS);
  return dados ? JSON.parse(dados) : [];
}

/** Remove uma memória pelo ID */
export async function removerMemoria(id: string): Promise<MemoriaIA[]> {
  await simularLatencia(100);
  const memorias = await buscarMemorias();
  const filtradas = memorias.filter((m) => m.id !== id);
  await AsyncStorage.setItem(CHAVES.MEMORIAS, JSON.stringify(filtradas));
  return filtradas;
}
