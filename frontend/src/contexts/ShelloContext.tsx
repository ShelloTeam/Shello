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
import api from '../services/api';
import { getStoredUser, logout as authLogout } from '../services/authService';

interface ShelloContextData {
  nomeUsuario: string;
  onboardingConcluido: boolean;
  dadosOnboarding: DadosOnboarding | null;
  carregando: boolean;
  nivelFormalidade: NivelFormalidade;
  entradas: EntradaDiario[];
  tarefas: Tarefa[];
  rotinas: Rotina[];
  memorias: MemoriaIA[];

  adicionarEntrada: (titulo: string, conteudo: string) => Promise<EntradaDiario>;
  atualizarEntrada: (id: string, titulo: string, conteudo: string) => Promise<void>;
  marcarEntradaComoContexto: (id: string, conteudo: string) => Promise<void>;

  adicionarTarefa: (titulo: string, descricao?: string, data?: string) => Promise<Tarefa>;
  alternarTarefa: (id: string) => Promise<void>;

  adicionarRotina: (titulo: string, atividades: string[], periodo: Rotina['periodo']) => Promise<void>;
  removerRotina: (id: string) => Promise<void>;

  concluirOnboarding: (dados: DadosOnboarding) => Promise<void>;
  sair: () => Promise<void>;

  adicionarMemoria: (conteudo: string, tipo: MemoriaIA['tipo']) => Promise<void>;
  removerMemoria: (id: string) => Promise<void>;

  setNivelFormalidade: (nivel: NivelFormalidade) => void;
  recarregarDados: () => Promise<void>;
  definirUsuario: (nome: string, onboardingOk: boolean) => void;
}

const ShelloContext = createContext<ShelloContextData | undefined>(undefined);

// ── Mappers ──────────────────────────────────────────────────────────────────

function mapDiaryEntry(d: any): EntradaDiario {
  return {
    id: d.id,
    titulo: (d.content || '').slice(0, 40) + ((d.content || '').length > 40 ? '...' : ''),
    conteudo: d.content || '',
    dataCriacao: d.created_at,
    adicionadaAoContexto: false,
  };
}

function mapTask(t: any): Tarefa {
  return {
    id: t.id,
    titulo: t.title,
    descricao: t.description ?? undefined,
    concluida: t.status === 'done',
    data: t.due_date ?? undefined,
    dataCriacao: t.created_at,
  };
}

function mapRotina(r: any): Rotina {
  return {
    id: r.id,
    titulo: r.nome,
    atividades: r.atividades ?? [],
    periodo: r.periodo as Rotina['periodo'],
  };
}

function mapMemoria(m: any): MemoriaIA {
  return {
    id: m.id,
    tipo: m.tipo as MemoriaIA['tipo'],
    conteudo: m.conteudo,
    dataCriacao: m.created_at,
  };
}

// ── Provider ──────────────────────────────────────────────────────────────────

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

  const carregarDados = useCallback(async () => {
    try {
      const user = await getStoredUser();
      if (!user) {
        setCarregando(false);
        return;
      }
      setNomeUsuario(user.nome);

      const [entradasRes, tarefasRes, rotinasRes, memoriasRes, prefsRes] = await Promise.allSettled([
        api.get('/api/diary'),
        api.get('/api/tasks'),
        api.get('/api/routines'),
        api.get('/api/memories'),
        api.get('/api/users/preferences'),
      ]);

      if (entradasRes.status === 'fulfilled') {
        const items = entradasRes.value.data?.items ?? entradasRes.value.data ?? [];
        setEntradas(items.map(mapDiaryEntry));
      }
      if (tarefasRes.status === 'fulfilled') {
        setTarefas((tarefasRes.value.data ?? []).map(mapTask));
      }
      if (rotinasRes.status === 'fulfilled') {
        setRotinas((rotinasRes.value.data ?? []).map(mapRotina));
      }
      if (memoriasRes.status === 'fulfilled') {
        setMemorias((memoriasRes.value.data ?? []).map(mapMemoria));
      }
      if (prefsRes.status === 'fulfilled') {
        const prefs = prefsRes.value.data;
        if (prefs?.formalidade) setNivelFormalidade(prefs.formalidade as NivelFormalidade);
        if (prefs?.nome_referencia) {
          setNomeUsuario(prefs.nome_referencia);
          setDadosOnboarding((prev) => prev ? { ...prev, nome: prefs.nome_referencia } : prev);
        }
      }

      setOnboardingConcluido(true);
    } catch {
      // silent — user may not be logged in yet
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    // Warm up Railway dyno before user hits login
    api.get('/health').catch(() => {});
    carregarDados();
  }, [carregarDados]);

  // ── Diário ─────────────────────────────────────────────────────────────────

  const adicionarEntrada = useCallback(async (_titulo: string, conteudo: string): Promise<EntradaDiario> => {
    const tempId = `temp-${Date.now()}`;
    const tempEntrada: EntradaDiario = {
      id: tempId,
      titulo: conteudo.slice(0, 40) + (conteudo.length > 40 ? '...' : ''),
      conteudo,
      dataCriacao: new Date().toISOString(),
      adicionadaAoContexto: false,
    };
    setEntradas((ant) => [tempEntrada, ...ant]);

    try {
      const { data } = await api.post('/api/diary', { content: conteudo });
      const nova = mapDiaryEntry(data);
      setEntradas((ant) => ant.map((e) => (e.id === tempId ? nova : e)));
      return nova;
    } catch (err) {
      setEntradas((ant) => ant.filter((e) => e.id !== tempId));
      throw err;
    }
  }, []);

  const atualizarEntrada = useCallback(async (id: string, _titulo: string, conteudo: string): Promise<void> => {
    const { data } = await api.put(`/api/diary/${id}`, { content: conteudo });
    const atualizada = mapDiaryEntry(data);
    setEntradas((ant) => ant.map((e) => (e.id === id ? atualizada : e)));
  }, []);

  const marcarEntradaComoContexto = useCallback(async (id: string, conteudo: string): Promise<void> => {
    await api.post('/api/memories', {
      conteudo: `Reflexão do diário: ${conteudo.slice(0, 120)}`,
      tipo: 'FATO',
    });
    const { data } = await api.get('/api/memories');
    setMemorias((data ?? []).map(mapMemoria));
    setEntradas((ant) =>
      ant.map((e) => (e.id === id ? { ...e, adicionadaAoContexto: true } : e))
    );
  }, []);

  // ── Tarefas ────────────────────────────────────────────────────────────────

  const adicionarTarefa = useCallback(async (titulo: string, descricao?: string, data?: string): Promise<Tarefa> => {
    const tempId = `temp-${Date.now()}`;
    const tempTarefa: Tarefa = {
      id: tempId,
      titulo,
      descricao,
      concluida: false,
      data,
      dataCriacao: new Date().toISOString(),
    };
    setTarefas((ant) => [...ant, tempTarefa]);

    try {
      const payload: Record<string, unknown> = { title: titulo };
      if (descricao) payload.description = descricao;
      if (data) payload.due_date = data;
      const { data: res } = await api.post('/api/tasks', payload);
      const nova = mapTask(res);
      setTarefas((ant) => ant.map((t) => (t.id === tempId ? nova : t)));
      return nova;
    } catch (err) {
      setTarefas((ant) => ant.filter((t) => t.id !== tempId));
      throw err;
    }
  }, []);

  const alternarTarefa = useCallback(async (id: string): Promise<void> => {
    const tarefa = tarefas.find((t) => t.id === id);
    const novoStatus = tarefa?.concluida ? 'pending' : 'done';

    // Optimistic toggle
    setTarefas((ant) => ant.map((t) => (t.id === id ? { ...t, concluida: !t.concluida } : t)));

    try {
      const { data } = await api.patch(`/api/tasks/${id}`, { status: novoStatus });
      const atualizada = mapTask(data);
      setTarefas((ant) => ant.map((t) => (t.id === id ? atualizada : t)));
    } catch {
      // Revert on failure
      setTarefas((ant) => ant.map((t) => (t.id === id ? { ...t, concluida: tarefa?.concluida ?? false } : t)));
    }
  }, [tarefas]);

  // ── Rotinas ────────────────────────────────────────────────────────────────

  const adicionarRotina = useCallback(async (
    titulo: string,
    atividades: string[],
    periodo: Rotina['periodo'],
  ): Promise<void> => {
    const { data } = await api.post('/api/routines', { nome: titulo, atividades, periodo });
    setRotinas((ant) => [...ant, mapRotina(data)]);
  }, []);

  const removerRotina = useCallback(async (id: string): Promise<void> => {
    await api.delete(`/api/routines/${id}`);
    setRotinas((ant) => ant.filter((r) => r.id !== id));
  }, []);

  // ── Onboarding ─────────────────────────────────────────────────────────────

  const concluirOnboarding = useCallback(async (dados: DadosOnboarding): Promise<void> => {
    await api.post('/api/onboarding/complete', {
      nome: dados.nome,
      estiloDeVida: dados.estiloDeVida,
      metaAtual: dados.metaAtual,
    });
    setDadosOnboarding(dados);
    setNomeUsuario(dados.nome);
    setOnboardingConcluido(true);
    await carregarDados();
  }, [carregarDados]);

  const sair = useCallback(async (): Promise<void> => {
    await authLogout();
    setNomeUsuario('');
    setOnboardingConcluido(false);
    setDadosOnboarding(null);
    setEntradas([]);
    setTarefas([]);
    setRotinas([]);
    setMemorias([]);
  }, []);

  // ── Memórias ───────────────────────────────────────────────────────────────

  const adicionarMemoria = useCallback(async (conteudo: string, tipo: MemoriaIA['tipo']): Promise<void> => {
    const { data } = await api.post('/api/memories', { conteudo, tipo });
    setMemorias((ant) => [...ant, mapMemoria(data)]);
  }, []);

  const removerMemoria = useCallback(async (id: string): Promise<void> => {
    await api.delete(`/api/memories/${id}`);
    setMemorias((ant) => ant.filter((m) => m.id !== id));
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const definirUsuario = useCallback((nome: string, onboardingOk: boolean) => {
    setNomeUsuario(nome);
    setOnboardingConcluido(onboardingOk);
  }, []);

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
    sair,
    adicionarMemoria,
    removerMemoria,
    setNivelFormalidade,
    recarregarDados: carregarDados,
    definirUsuario,
  };

  return <ShelloContext.Provider value={valor}>{children}</ShelloContext.Provider>;
}

export function useShello(): ShelloContextData {
  const contexto = useContext(ShelloContext);
  if (!contexto) throw new Error('useShello deve ser usado dentro de um ShelloProvider');
  return contexto;
}

export default ShelloContext;
