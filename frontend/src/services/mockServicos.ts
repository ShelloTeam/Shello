// Camada de Serviços Mockados — Shello v2
// Simula comunicação com backend usando AsyncStorage + setTimeout

import AsyncStorage from '@react-native-async-storage/async-storage';
import { EntradaDiario, Tarefa, MemoriaIA, DadosOnboarding, Rotina } from '../types';

// ─── Chaves de armazenamento ───────────────────────────────────────────────
const CHAVES = {
  ENTRADAS: '@shello:entradas',
  TAREFAS: '@shello:tarefas',
  ROTINAS: '@shello:rotinas',
  ONBOARDING: '@shello:onboarding',
  MEMORIAS: '@shello:memorias',
} as const;

/** Simula latência de rede */
const simularLatencia = (ms = 250) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** Gera ID único */
export const gerarId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// ─── Serviços de Entradas do Diário ───────────────────────────────────────

/** Salva uma nova entrada no diário */
export async function salvarEntrada(
  titulo: string,
  conteudo: string
): Promise<EntradaDiario> {
  await simularLatencia();
  const entrada: EntradaDiario = {
    id: gerarId(),
    titulo,
    conteudo,
    dataCriacao: new Date().toISOString(),
    adicionadaAoContexto: false,
  };
  const existentes = await buscarEntradas();
  await AsyncStorage.setItem(CHAVES.ENTRADAS, JSON.stringify([entrada, ...existentes]));
  return entrada;
}

/** Atualiza o conteúdo de uma entrada existente */
export async function atualizarEntrada(
  id: string,
  titulo: string,
  conteudo: string
): Promise<EntradaDiario[]> {
  await simularLatencia(100);
  const entradas = await buscarEntradas();
  const atualizadas = entradas.map((e) =>
    e.id === id ? { ...e, titulo, conteudo } : e
  );
  await AsyncStorage.setItem(CHAVES.ENTRADAS, JSON.stringify(atualizadas));
  return atualizadas;
}

/** Marca uma entrada como adicionada ao contexto do Shello */
export async function marcarEntradaComoContexto(id: string): Promise<EntradaDiario[]> {
  await simularLatencia(100);
  const entradas = await buscarEntradas();
  const atualizadas = entradas.map((e) =>
    e.id === id ? { ...e, adicionadaAoContexto: true } : e
  );
  await AsyncStorage.setItem(CHAVES.ENTRADAS, JSON.stringify(atualizadas));
  return atualizadas;
}

/** Busca todas as entradas do diário */
export async function buscarEntradas(): Promise<EntradaDiario[]> {
  await simularLatencia(150);
  const dados = await AsyncStorage.getItem(CHAVES.ENTRADAS);
  return dados ? JSON.parse(dados) : [];
}

// ─── Serviços de Tarefas ──────────────────────────────────────────────────

/** Salva uma nova tarefa com titulo, descrição e data opcionais */
export async function salvarTarefa(
  titulo: string,
  descricao?: string,
  data?: string
): Promise<Tarefa> {
  await simularLatencia();
  const tarefa: Tarefa = {
    id: gerarId(),
    titulo,
    descricao,
    concluida: false,
    dataCriacao: new Date().toISOString(),
    data,
  };
  const existentes = await buscarTarefas();
  await AsyncStorage.setItem(CHAVES.TAREFAS, JSON.stringify([...existentes, tarefa]));
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

// ─── Serviços de Rotinas ──────────────────────────────────────────────────

/** Salva uma nova rotina */
export async function salvarRotina(
  titulo: string,
  atividades: string[],
  periodo: Rotina['periodo']
): Promise<Rotina> {
  await simularLatencia();
  const rotina: Rotina = {
    id: gerarId(),
    titulo,
    atividades,
    periodo,
  };
  const existentes = await buscarRotinas();
  await AsyncStorage.setItem(CHAVES.ROTINAS, JSON.stringify([...existentes, rotina]));
  return rotina;
}

/** Busca todas as rotinas */
export async function buscarRotinas(): Promise<Rotina[]> {
  await simularLatencia(150);
  const dados = await AsyncStorage.getItem(CHAVES.ROTINAS);
  return dados ? JSON.parse(dados) : [];
}

/** Remove uma rotina pelo ID */
export async function removerRotina(id: string): Promise<Rotina[]> {
  await simularLatencia(100);
  const rotinas = await buscarRotinas();
  const filtradas = rotinas.filter((r) => r.id !== id);
  await AsyncStorage.setItem(CHAVES.ROTINAS, JSON.stringify(filtradas));
  return filtradas;
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

/** Salva uma nova memória */
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
  const existentes = await buscarMemorias();
  await AsyncStorage.setItem(CHAVES.MEMORIAS, JSON.stringify([...existentes, memoria]));
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
