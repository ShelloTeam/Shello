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
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  adicionarTarefaDeChat: (titulo: string) => Promise<Tarefa>;
  alternarTarefa: (id: string) => Promise<void>;
  removerTarefa: (id: string) => Promise<void>;

  removerEntrada: (id: string) => Promise<void>;

  adicionarRotina: (titulo: string, atividades: string[], periodo: Rotina['periodo']) => Promise<void>;
  removerRotina: (id: string) => Promise<void>;

  concluirOnboarding: (dados: DadosOnboarding) => Promise<void>;
  sair: () => Promise<void>;

  adicionarMemoria: (conteudo: string, tipo: MemoriaIA['tipo']) => Promise<void>;
  removerMemoria: (id: string) => Promise<void>;

  setNivelFormalidade: (nivel: NivelFormalidade) => void;
  recarregarDados: () => Promise<void>;
  recarregarMemorias: () => Promise<void>;
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
    dataCriacao: t.created_at ?? new Date().toISOString(),
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
    tipo: (m.tipo as string).toUpperCase() as MemoriaIA['tipo'],
    conteudo: m.conteudo,
    dataCriacao: m.created_at,
  };
}

function classificarTipoMemoria(conteudo: string): MemoriaIA['tipo'] {
  const t = conteudo.toLowerCase();
  if (/amigo|namorad|família|familiar|colega|conhec|encontr[ei]|pessoa|pai|mãe|irmão|irmã|filho|filha/.test(t))
    return 'RELACIONAMENTO';
  if (/quer[oe]|desej|objetivo|meta|plan[eo]|pretend|vontade|sonho|quero melhorar|quero aprender/.test(t))
    return 'OBJETIVO';
  if (/sempre|todo dia|rotina|hábito|costumo|geralmente|frequen|regularmente|diariamente/.test(t))
    return 'HABITO';
  if (/prefer|gost[ao]|amo |adoro|não gost|detesto|favorit/.test(t))
    return 'PREFERENCIA';
  return 'FATO';
}

function conteudoSimilar(a: string, b: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-záàâãéêíóôõúç]/g, ' ').replace(/\s+/g, ' ').trim();
  const normA = norm(a);
  const normB = norm(b);
  return normA.slice(0, 250) === normB.slice(0, 250);
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

      const [entradasRes, tarefasRes, rotinasRes, memoriasRes, prefsRes] = await Promise.allSettled([
        api.get('/api/diary'),
        api.get('/api/tasks'),
        api.get('/api/routines'),
        api.get('/api/memories'),
        api.get('/api/users/preferences'),
      ]);

      let loadedMemorias: MemoriaIA[] = [];
      if (memoriasRes.status === 'fulfilled') {
        loadedMemorias = (memoriasRes.value.data ?? []).map(mapMemoria);
        setMemorias(loadedMemorias);
      }

      if (entradasRes.status === 'fulfilled') {
        const items = entradasRes.value.data?.items ?? entradasRes.value.data ?? [];
        const mappedEntradas = items.map((d: any) => {
          const entry = mapDiaryEntry(d);
          const prefixo = `Reflexão do diário: ${entry.conteudo.slice(0, 450)}`;
          entry.adicionadaAoContexto = loadedMemorias.some((m) => conteudoSimilar(m.conteudo, prefixo));
          return entry;
        });
        setEntradas(mappedEntradas);
      }
      if (tarefasRes.status === 'fulfilled') {
        setTarefas((tarefasRes.value.data ?? []).map(mapTask));
      }
      if (rotinasRes.status === 'fulfilled') {
        setRotinas((rotinasRes.value.data ?? []).map(mapRotina));
      }

      // Define nome uma única vez — preferência > nome de cadastro (evita flicker)
      if (prefsRes.status === 'fulfilled') {
        const prefs = prefsRes.value.data;
        if (prefs?.formalidade) setNivelFormalidade(prefs.formalidade as NivelFormalidade);
        const nomeDefinitivo = prefs?.nome_referencia || user.nome;
        setNomeUsuario(nomeDefinitivo);
        setDadosOnboarding((prev) => prev ? { ...prev, nome: nomeDefinitivo } : prev);
      } else {
        setNomeUsuario(user.nome);
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
    // Preserva adicionadaAoContexto — mapDiaryEntry sempre retorna false, mas o estado real é local
    setEntradas((ant) => ant.map((e) => e.id === id ? { ...atualizada, adicionadaAoContexto: e.adicionadaAoContexto } : e));
  }, []);


  const removerEntrada = useCallback(async (id: string): Promise<void> => {
    await api.delete(`/api/diary/${id}`);
    setEntradas((ant) => ant.filter((e) => e.id !== id));
  }, []);

  const marcarEntradaComoContexto = useCallback(async (id: string, conteudo: string): Promise<void> => {
    const novoConteudo = `Reflexão do diário: ${conteudo.slice(0, 450)}`;

    // Anti-duplicata: checa se conteúdo muito parecido já existe
    const duplicata = memorias.some((m) => conteudoSimilar(m.conteudo, novoConteudo));
    if (duplicata) {
      setEntradas((ant) =>
        ant.map((e) => (e.id === id ? { ...e, adicionadaAoContexto: true } : e))
      );
      return;
    }

    const tipo = classificarTipoMemoria(conteudo);
    await api.post('/api/memories', { conteudo: novoConteudo, tipo });
    const { data } = await api.get('/api/memories');
    setMemorias((data ?? []).map(mapMemoria));
    setEntradas((ant) =>
      ant.map((e) => (e.id === id ? { ...e, adicionadaAoContexto: true } : e))
    );
  }, [memorias]);

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

  const adicionarTarefaDeChat = useCallback(async (titulo: string): Promise<Tarefa> => {
    const tempId = `temp-${Date.now()}`;
    const tempTarefa: Tarefa = {
      id: tempId,
      titulo,
      concluida: false,
      dataCriacao: new Date().toISOString(),
    };
    setTarefas((ant) => [...ant, tempTarefa]);

    try {
      const { data: res } = await api.post('/api/tasks/from-chat', { title: titulo });
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
      const { data } = await api.patch(`/api/v1/tasks/${id}/status`, { status: novoStatus });
      const atualizada = mapTask(data);
      setTarefas((ant) => ant.map((t) => (t.id === id ? atualizada : t)));
    } catch {
      // Revert on failure
      setTarefas((ant) => ant.map((t) => (t.id === id ? { ...t, concluida: tarefa?.concluida ?? false } : t)));
    }
  }, [tarefas]);

  const removerTarefa = useCallback(async (id: string): Promise<void> => {
    await api.delete(`/api/tasks/${id}`);
    setTarefas((ant) => ant.filter((t) => t.id !== id));
  }, []);

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
    try {
      await AsyncStorage.multiRemove(['@shello:chat_messages', '@shello:chat_conversation_id']);
    } catch (e) {
      console.error('Erro ao limpar dados do chat no logout:', e);
    }
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

  const recarregarMemorias = useCallback(async (): Promise<void> => {
    const { data } = await api.get('/api/memories');
    setMemorias((data ?? []).map(mapMemoria));
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
    removerEntrada,
    marcarEntradaComoContexto,
    adicionarTarefa,
    adicionarTarefaDeChat,
    alternarTarefa,
    removerTarefa,
    adicionarRotina,
    removerRotina,
    concluirOnboarding,
    sair,
    adicionarMemoria,
    removerMemoria,
    setNivelFormalidade,
    recarregarDados: carregarDados,
    recarregarMemorias,
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
