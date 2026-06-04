// Contexto Global do Shello — ShelloContext
// Gerencia o estado global do aplicativo usando React Context API
// Integrado com a camada de serviços mockados

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  NotaDiario,
  Tarefa,
  MemoriaIA,
  DadosOnboarding,
  NivelFormalidade,
} from '../types';
import {
  salvarNota as salvarNotaServico,
  buscarNotas,
  salvarTarefa as salvarTarefaServico,
  buscarTarefas,
  alternarTarefa as alternarTarefaServico,
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
  carregando: boolean;
  nivelFormalidade: NivelFormalidade;

  // Dados
  notas: NotaDiario[];
  tarefas: Tarefa[];
  memorias: MemoriaIA[];

  // Ações
  adicionarNota: (conteudo: string) => Promise<NotaDiario>;
  adicionarTarefa: (titulo: string, dataVencimento?: string) => Promise<Tarefa>;
  alternarTarefa: (id: string) => Promise<void>;
  concluirOnboarding: (dados: DadosOnboarding) => Promise<void>;
  adicionarMemoria: (conteudo: string, tipo: MemoriaIA['tipo']) => Promise<void>;
  removerMemoria: (id: string) => Promise<void>;
  setNivelFormalidade: (nivel: NivelFormalidade) => void;
}

// ─── Criação do Contexto ───────────────────────────────────────────────────

const ShelloContext = createContext<ShelloContextData | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────

interface ShelloProviderProps {
  children: ReactNode;
}

export function ShelloProvider({ children }: ShelloProviderProps) {
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [onboardingConcluido, setOnboardingConcluido] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [nivelFormalidade, setNivelFormalidade] = useState<NivelFormalidade>('media');
  const [notas, setNotas] = useState<NotaDiario[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [memorias, setMemorias] = useState<MemoriaIA[]>([]);

  // Carrega os dados iniciais do AsyncStorage
  useEffect(() => {
    async function carregarDados() {
      try {
        const [
          notasCarregadas,
          tarefasCarregadas,
          memoriasCarregadas,
          onboarding,
        ] = await Promise.all([
          buscarNotas(),
          buscarTarefas(),
          buscarMemorias(),
          buscarDadosOnboarding(),
        ]);

        setNotas(notasCarregadas);
        setTarefas(tarefasCarregadas);
        setMemorias(memoriasCarregadas);

        if (onboarding) {
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

  // ─── Ações ──────────────────────────────────────────────────────────────

  const adicionarNota = useCallback(async (conteudo: string): Promise<NotaDiario> => {
    const nova = await salvarNotaServico(conteudo);
    setNotas((anterior) => [nova, ...anterior]);
    return nova;
  }, []);

  const adicionarTarefa = useCallback(
    async (titulo: string, dataVencimento?: string): Promise<Tarefa> => {
      const nova = await salvarTarefaServico(titulo, dataVencimento);
      setTarefas((anterior) => [...anterior, nova]);
      return nova;
    },
    []
  );

  const alternarTarefa = useCallback(async (id: string): Promise<void> => {
    const atualizadas = await alternarTarefaServico(id);
    setTarefas(atualizadas);
  }, []);

  const concluirOnboarding = useCallback(async (dados: DadosOnboarding): Promise<void> => {
    await salvarDadosOnboarding(dados);
    setNomeUsuario(dados.nome);
    setOnboardingConcluido(true);
  }, []);

  const adicionarMemoria = useCallback(
    async (conteudo: string, tipo: MemoriaIA['tipo']): Promise<void> => {
      const nova = await salvarMemoriaServico(conteudo, tipo);
      setMemorias((anterior) => [...anterior, nova]);
    },
    []
  );

  const removerMemoria = useCallback(async (id: string): Promise<void> => {
    const restantes = await removerMemoriaServico(id);
    setMemorias(restantes);
  }, []);

  // ─── Valor do Contexto ───────────────────────────────────────────────────

  const valor: ShelloContextData = {
    nomeUsuario,
    onboardingConcluido,
    carregando,
    nivelFormalidade,
    notas,
    tarefas,
    memorias,
    adicionarNota,
    adicionarTarefa,
    alternarTarefa,
    concluirOnboarding,
    adicionarMemoria,
    removerMemoria,
    setNivelFormalidade,
  };

  return (
    <ShelloContext.Provider value={valor}>
      {children}
    </ShelloContext.Provider>
  );
}

// ─── Hook de acesso ao contexto ───────────────────────────────────────────

export function useShello(): ShelloContextData {
  const contexto = useContext(ShelloContext);
  if (!contexto) {
    throw new Error('useShello deve ser usado dentro de um ShelloProvider');
  }
  return contexto;
}

export default ShelloContext;
