// Contexto Global do Shello v2
// Gerencia estado global com EntradaDiario, Tarefas expandidas e Rotinas

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  EntradaDiario,
  Tarefa,
  Rotina,
  MemoriaIA,
  DadosOnboarding,
  NivelFormalidade,
} from '../types';
import {
  salvarEntrada,
  atualizarEntrada as atualizarEntradaServico,
  marcarEntradaComoContexto as marcarEntradaServico,
  buscarEntradas,
  salvarTarefa as salvarTarefaServico,
  buscarTarefas,
  alternarTarefa as alternarTarefaServico,
  salvarRotina as salvarRotinaServico,
  buscarRotinas,
  removerRotina as removerRotinaServico,
  salvarDadosOnboarding,
  buscarDadosOnboarding,
  salvarMemoria as salvarMemoriaServico,
  buscarMemorias,
  removerMemoria as removerMemoriaServico,
} from '../services/mockServicos';

// ─── Tipos do Contexto ─────────────────────────────────────────────────────

interface ShelloContextData {
  // Estado do usuário
  nomeUsuario: string;
  onboardingConcluido: boolean;
  dadosOnboarding: DadosOnboarding | null;
  carregando: boolean;
  nivelFormalidade: NivelFormalidade;

  // Dados
  entradas: EntradaDiario[];
  tarefas: Tarefa[];
  rotinas: Rotina[];
  memorias: MemoriaIA[];

  // Ações — Diário
  adicionarEntrada: (titulo: string, conteudo: string) => Promise<EntradaDiario>;
  atualizarEntrada: (id: string, titulo: string, conteudo: string) => Promise<void>;
  marcarEntradaComoContexto: (id: string, conteudo: string) => Promise<void>;

  // Ações — Tarefas
  adicionarTarefa: (titulo: string, descricao?: string, data?: string) => Promise<Tarefa>;
  alternarTarefa: (id: string) => Promise<void>;

  // Ações — Rotinas
  adicionarRotina: (titulo: string, atividades: string[], periodo: Rotina['periodo']) => Promise<void>;
  removerRotina: (id: string) => Promise<void>;

  // Ações — Onboarding
  concluirOnboarding: (dados: DadosOnboarding) => Promise<void>;

  // Ações — Memórias
  adicionarMemoria: (conteudo: string, tipo: MemoriaIA['tipo']) => Promise<void>;
  removerMemoria: (id: string) => Promise<void>;

  // Config
  setNivelFormalidade: (nivel: NivelFormalidade) => void;
}

// ─── Criação do Contexto ───────────────────────────────────────────────────

const ShelloContext = createContext<ShelloContextData | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────

export function ShelloProvider({ children }: { children: ReactNode }) {
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [onboardingConcluido, setOnboardingConcluido] = useState(false);
  const [dadosOnboarding, setDadosOnboarding] = useState<DadosOnboarding | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [nivelFormalidade, setNivelFormalidade] = useState<NivelFormalidade>('media');
  const [entradas, setEntradas] = useState<EntradaDiario[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [rotinas, setRotinas] = useState<Rotina[]>([]);
  const [memorias, setMemorias] = useState<MemoriaIA[]>([]);

  // Carrega dados iniciais do AsyncStorage
  useEffect(() => {
    async function carregarDados() {
      try {
        const [entradasCarregadas, tarefasCarregadas, rotinasCarregadas, memoriasCarregadas, onboarding] =
          await Promise.all([
            buscarEntradas(),
            buscarTarefas(),
            buscarRotinas(),
            buscarMemorias(),
            buscarDadosOnboarding(),
          ]);

        setEntradas(entradasCarregadas);
        setTarefas(tarefasCarregadas);
        setRotinas(rotinasCarregadas);
        setMemorias(memoriasCarregadas);

        if (onboarding) {
          setDadosOnboarding(onboarding);
          setNomeUsuario(onboarding.nome);
          setOnboardingConcluido(true);
        }
      } catch (erro) {
        console.error('Erro ao carregar dados do Shello:', erro);
      } finally {
        setCarregando(false);
      }
    }
    carregarDados();
  }, []);

  // ─── Ações do Diário ──────────────────────────────────────────────────────

  const adicionarEntrada = useCallback(async (titulo: string, conteudo: string): Promise<EntradaDiario> => {
    const nova = await salvarEntrada(titulo, conteudo);
    setEntradas((ant) => [nova, ...ant]);
    return nova;
  }, []);

  const atualizarEntrada = useCallback(async (id: string, titulo: string, conteudo: string): Promise<void> => {
    const atualizadas = await atualizarEntradaServico(id, titulo, conteudo);
    setEntradas(atualizadas);
  }, []);

  const marcarEntradaComoContexto = useCallback(async (id: string, conteudo: string): Promise<void> => {
    // Adiciona o conteúdo como memória do tipo FATO
    await salvarMemoriaServico(`Reflexão do diário: ${conteudo.slice(0, 120)}`, 'FATO');
    const atualizadas = await marcarEntradaServico(id);
    setEntradas(atualizadas);
    // Também atualiza memórias no estado
    const novasMemorias = await buscarMemorias();
    setMemorias(novasMemorias);
  }, []);

  // ─── Ações de Tarefas ─────────────────────────────────────────────────────

  const adicionarTarefa = useCallback(async (titulo: string, descricao?: string, data?: string): Promise<Tarefa> => {
    const nova = await salvarTarefaServico(titulo, descricao, data);
    setTarefas((ant) => [...ant, nova]);
    return nova;
  }, []);

  const alternarTarefa = useCallback(async (id: string): Promise<void> => {
    const atualizadas = await alternarTarefaServico(id);
    setTarefas(atualizadas);
  }, []);

  // ─── Ações de Rotinas ─────────────────────────────────────────────────────

  const adicionarRotina = useCallback(async (
    titulo: string,
    atividades: string[],
    periodo: Rotina['periodo']
  ): Promise<void> => {
    const nova = await salvarRotinaServico(titulo, atividades, periodo);
    setRotinas((ant) => [...ant, nova]);
  }, []);

  const removerRotina = useCallback(async (id: string): Promise<void> => {
    const restantes = await removerRotinaServico(id);
    setRotinas(restantes);
  }, []);

  // ─── Ações de Onboarding ──────────────────────────────────────────────────

  const concluirOnboarding = useCallback(async (dados: DadosOnboarding): Promise<void> => {
    await salvarDadosOnboarding(dados);
    setDadosOnboarding(dados);
    setNomeUsuario(dados.nome);
    setOnboardingConcluido(true);
  }, []);

  // ─── Ações de Memórias ────────────────────────────────────────────────────

  const adicionarMemoria = useCallback(async (conteudo: string, tipo: MemoriaIA['tipo']): Promise<void> => {
    const nova = await salvarMemoriaServico(conteudo, tipo);
    setMemorias((ant) => [...ant, nova]);
  }, []);

  const removerMemoria = useCallback(async (id: string): Promise<void> => {
    const restantes = await removerMemoriaServico(id);
    setMemorias(restantes);
  }, []);

  // ─── Valor do Contexto ────────────────────────────────────────────────────

  const valor: ShelloContextData = {
    nomeUsuario,
    onboardingConcluido,
    dadosOnboarding,
    carregando,
    nivelFormalidade,
    entradas,
    tarefas,
    rotinas,
    memorias,
    adicionarEntrada,
    atualizarEntrada,
    marcarEntradaComoContexto,
    adicionarTarefa,
    alternarTarefa,
    adicionarRotina,
    removerRotina,
    concluirOnboarding,
    adicionarMemoria,
    removerMemoria,
    setNivelFormalidade,
  };

  return <ShelloContext.Provider value={valor}>{children}</ShelloContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useShello(): ShelloContextData {
  const contexto = useContext(ShelloContext);
  if (!contexto) {
    throw new Error('useShello deve ser usado dentro de um ShelloProvider');
  }
  return contexto;
}

export default ShelloContext;
