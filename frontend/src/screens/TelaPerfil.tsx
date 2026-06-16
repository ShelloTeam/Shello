// TelaPerfil.tsx — Tela de Perfil do Usuário
// Exibe dados do perfil, personalidade da IA, memórias e opções de conta

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { ShelloTema } from '../styles/tema';
import { useShello } from '../contexts/ShelloContext';
import { MemoriaIA, NivelFormalidade } from '../types';
import api from '../services/api';
import DialogShello from '../components/DialogShello';

// ─── Memórias mockadas exibidas quando o contexto está vazio ────────────────

const MEMORIAS_MOCK: MemoriaIA[] = [
  {
    id: 'mock-1',
    tipo: 'PREFERENCIA',
    conteudo: 'Prefere ser chamado pelo primeiro nome',
    dataCriacao: new Date().toISOString(),
  },
  {
    id: 'mock-2',
    tipo: 'FATO',
    conteudo: 'Trabalha em regime freelancer pela manhã',
    dataCriacao: new Date().toISOString(),
  },
  {
    id: 'mock-3',
    tipo: 'OBJETIVO',
    conteudo: 'Deseja melhorar a consistência nos estudos',
    dataCriacao: new Date().toISOString(),
  },
];

// ─── Configurações visuais por tipo de memória ───────────────────────────────

interface ConfiguracaoTipoMemoria {
  rotulo: string;
  fundoBadge: string;
  textoBadge: string;
}

const CONFIGURACAO_TIPO: Record<MemoriaIA['tipo'], ConfiguracaoTipoMemoria> = {
  PREFERENCIA: {
    rotulo: 'PREFERÊNCIA',
    fundoBadge: '#D6E2D8',
    textoBadge: '#5E836A',
  },
  FATO: {
    rotulo: 'FATO',
    fundoBadge: '#EADCD6',
    textoBadge: '#8B5E3C',
  },
  OBJETIVO: {
    rotulo: 'OBJETIVO',
    fundoBadge: '#D1E8F0',
    textoBadge: '#1565C0',
  },
  HABITO: {
    rotulo: 'HÁBITO',
    fundoBadge: '#F0EAD6',
    textoBadge: '#7B6B3A',
  },
  CONTEXTO: {
    rotulo: 'CONTEXTO',
    fundoBadge: '#E8D6F0',
    textoBadge: '#6B3A7B',
  },
  RELACIONAMENTO: {
    rotulo: 'RELAÇÃO',
    fundoBadge: '#F0D6D6',
    textoBadge: '#7B3A3A',
  },
};

// ─── Efeito descritivo por nível de formalidade ──────────────────────────────

const DESCRICAO_FORMALIDADE: Record<NivelFormalidade, string> = {
  baixa: '💬 Shello usa linguagem casual e descontraída',
  media: '🤝 Shello usa linguagem equilibrada e amigável',
  alta: '📋 Shello usa linguagem formal e profissional',
};

// ─── Componente interno: CardMemoria ─────────────────────────────────────────
// Gerencia seu próprio Animated.Value para a animação de remoção

interface CardMemoriaProps {
  memoria: MemoriaIA;
  aoRemover: (id: string) => void;
}

function CardMemoria({ memoria, aoRemover }: CardMemoriaProps) {
  const opacidade = useRef(new Animated.Value(1)).current;
  const config = CONFIGURACAO_TIPO[memoria.tipo] ?? { rotulo: memoria.tipo, fundoBadge: '#E8E8E8', textoBadge: '#555555' };
  // Memórias mockadas não podem ser removidas — guard no filho evita
  // que a animação de fade-out rode antes do pai bloquear a ação.
  const ehMock = memoria.id.startsWith('mock-');

  const handleRemover = useCallback(() => {
    // Guard: nunca animar nem chamar o pai para itens de demonstração
    if (ehMock) return;
    Animated.timing(opacidade, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      aoRemover(memoria.id);
    });
  }, [ehMock, opacidade, aoRemover, memoria.id]);

  return (
    <Animated.View style={[estilosCard.container, { opacity: opacidade }]}>
      {/* Linha superior: badge de tipo + botão remover */}
      <View style={estilosCard.linhaTopoCard}>
        <View
          style={[
            estilosCard.badge,
            { backgroundColor: config.fundoBadge },
          ]}
        >
          <Text style={[estilosCard.textoBadge, { color: config.textoBadge }]}>
            {config.rotulo}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleRemover}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={ehMock ? 'Memória de demonstração — não removível' : 'Remover memória'}
          accessibilityRole="button"
          disabled={ehMock}
          style={ehMock ? { opacity: 0.35 } : undefined}
        >
          <Feather name="trash-2" size={18} color={ShelloTema.cores.textoS} />
        </TouchableOpacity>
      </View>

      {/* Conteúdo da memória */}
      <Text style={estilosCard.textoConteudo}>{memoria.conteudo}</Text>
    </Animated.View>
  );
}

// Estilos isolados para o CardMemoria
const estilosCard = StyleSheet.create({
  container: {
    backgroundColor: ShelloTema.cores.superficie,
    borderRadius: ShelloTema.forma.bordaPequena,
    padding: 14,
    marginBottom: ShelloTema.espacamento.sm,
    ...ShelloTema.sombra.suave,
  },
  linhaTopoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ShelloTema.espacamento.sm,
  },
  badge: {
    borderRadius: ShelloTema.forma.bordaPequena,
    paddingHorizontal: ShelloTema.espacamento.sm,
    paddingVertical: ShelloTema.espacamento.xs,
  },
  textoBadge: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  textoConteudo: {
    fontSize: 14,
    color: ShelloTema.cores.textoP,
    lineHeight: ShelloTema.tipografia.alturaLinha,
  },
});

// ─── Opções do seletor de formalidade ────────────────────────────────────────

interface OpcaoFormalidade {
  valor: NivelFormalidade;
  rotulo: string;
}

const OPCOES_FORMALIDADE: OpcaoFormalidade[] = [
  { valor: 'baixa', rotulo: 'Casual' },
  { valor: 'media', rotulo: 'Equilibrada' },
  { valor: 'alta', rotulo: 'Formal' },
];

interface ModalNomeSalvoProps {
  nome: string;
  aoFechar: () => void;
}

function ModalNomeSalvo({ nome, aoFechar }: ModalNomeSalvoProps) {
  const escala = useRef(new Animated.Value(0.85)).current;
  const opacidade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(escala, {
        toValue: 1,
        useNativeDriver: true,
        damping: 14,
        stiffness: 180,
      }),
      Animated.timing(opacidade, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const fechar = useCallback(() => {
    Animated.parallel([
      Animated.timing(escala, {
        toValue: 0.85,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacidade, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => aoFechar());
  }, [aoFechar, escala, opacidade]);

  return (
    <Animated.View style={[estilosModal.overlay, { opacity: opacidade }]}>
      <Animated.View style={[estilosModal.caixa, { transform: [{ scale: escala }] }]}>
        {/* Ícone */}
        <View style={estilosModal.iconeWrapper}>
          <Feather name="check-circle" size={36} color={ShelloTema.cores.marca} />
        </View>

        {/* Título */}
        <Text style={estilosModal.titulo}>Nome salvo!</Text>

        {/* Mensagem */}
        <Text style={estilosModal.mensagem}>
          O Shello vai te chamar de{' '}
          <Text style={estilosModal.destaque}>"{nome}"</Text>
          {' '}agora. 🌿
        </Text>

        {/* Botão */}
        <TouchableOpacity
          style={estilosModal.botao}
          onPress={fechar}
          activeOpacity={0.85}
        >
          <Text style={estilosModal.botaoTexto}>Entendido</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const estilosModal = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  caixa: {
    backgroundColor: ShelloTema.cores.superficie,
    borderRadius: ShelloTema.forma.bordaMedia,
    padding: ShelloTema.espacamento.xl,
    marginHorizontal: ShelloTema.espacamento.xl,
    alignItems: 'center',
    ...ShelloTema.sombra.media,
  },
  iconeWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: ShelloTema.cores.marcaClaro,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ShelloTema.espacamento.md,
  },
  titulo: {
    fontSize: 20,
    fontWeight: '700',
    color: ShelloTema.cores.textoP,
    marginBottom: ShelloTema.espacamento.sm,
    fontFamily: 'serif',
  },
  mensagem: {
    fontSize: 15,
    color: ShelloTema.cores.textoS,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: ShelloTema.espacamento.lg,
  },
  destaque: {
    color: ShelloTema.cores.marca,
    fontWeight: '700',
  },
  botao: {
    backgroundColor: ShelloTema.cores.marca,
    borderRadius: ShelloTema.forma.bordaPill,
    paddingVertical: ShelloTema.espacamento.md,
    paddingHorizontal: ShelloTema.espacamento.xl,
    width: '100%',
    alignItems: 'center',
  },
  botaoTexto: {
    fontSize: 15,
    fontWeight: '700',
    color: ShelloTema.cores.superficie,
  },
});

function ModalErro({ aoFechar }: { aoFechar: () => void }) {
  const escala = useRef(new Animated.Value(0.85)).current;
  const opacidade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(escala, { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 180 }),
      Animated.timing(opacidade, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  const fechar = useCallback(() => {
    Animated.parallel([
      Animated.timing(escala, { toValue: 0.85, duration: 150, useNativeDriver: true }),
      Animated.timing(opacidade, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => aoFechar());
  }, [aoFechar, escala, opacidade]);

  return (
    <Animated.View style={[estilosModal.overlay, { opacity: opacidade }]}>
      <Animated.View style={[estilosModal.caixa, { transform: [{ scale: escala }] }]}>
        <View style={estilosModalErro.iconeWrapper}>
          <Feather name="alert-circle" size={36} color="#8B5E3C" />
        </View>
        <Text style={estilosModal.titulo}>Ops!</Text>
        <Text style={estilosModal.mensagem}>
          Não foi possível salvar.{'\n'}Tente novamente em instantes.
        </Text>
        <TouchableOpacity style={estilosModalErro.botao} onPress={fechar} activeOpacity={0.85}>
          <Text style={estilosModal.botaoTexto}>Tentar novamente</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const estilosModalErro = StyleSheet.create({
  iconeWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: ShelloTema.cores.terracota,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ShelloTema.espacamento.md,
  },
  botao: {
    backgroundColor: '#8B5E3C',
    borderRadius: ShelloTema.forma.bordaPill,
    paddingVertical: ShelloTema.espacamento.md,
    paddingHorizontal: ShelloTema.espacamento.xl,
    width: '100%',
    alignItems: 'center',
  },
});

interface ModalConfirmarSaidaProps {
  aoConfirmar: () => void;
  aoCancelar: () => void;
}

function ModalConfirmarSaida({ aoConfirmar, aoCancelar }: ModalConfirmarSaidaProps) {
  const escala = useRef(new Animated.Value(0.85)).current;
  const opacidade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(escala, { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 180 }),
      Animated.timing(opacidade, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  const animar = useCallback((callback: () => void) => {
    Animated.parallel([
      Animated.timing(escala, { toValue: 0.85, duration: 150, useNativeDriver: true }),
      Animated.timing(opacidade, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => callback());
  }, [escala, opacidade]);

  return (
    <Animated.View style={[estilosModal.overlay, { opacity: opacidade }]}>
      <Animated.View style={[estilosModal.caixa, { transform: [{ scale: escala }] }]}>
        <View style={estilosModalSaida.iconeWrapper}>
          <Feather name="log-out" size={36} color="#8B5E3C" />
        </View>

        <Text style={estilosModal.titulo}>Sair da conta</Text>

        <Text style={estilosModal.mensagem}>
          Deseja mesmo sair?{'\n'}Você precisará fazer login novamente.
        </Text>

        <TouchableOpacity
          style={estilosModalSaida.botaoSair}
          onPress={() => animar(aoConfirmar)}
          activeOpacity={0.85}
        >
          <Feather name="log-out" size={16} color="#FFF" style={estilosModalSaida.iconeBtn} />
          <Text style={estilosModal.botaoTexto}>Sim, sair</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={estilosModalSaida.botaoCancelar}
          onPress={() => animar(aoCancelar)}
          activeOpacity={0.85}
        >
          <Text style={estilosModalSaida.botaoCancelarTexto}>Cancelar</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const estilosModalSaida = StyleSheet.create({
  iconeBtn: {
    marginRight: 8
  },
  iconeWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: ShelloTema.cores.terracota,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ShelloTema.espacamento.md,
  },
  botaoSair: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#8B5E3C',
    borderRadius: ShelloTema.forma.bordaPill,
    paddingVertical: ShelloTema.espacamento.md,
    paddingHorizontal: ShelloTema.espacamento.xl,
    width: '100%',
    marginBottom: ShelloTema.espacamento.sm,
  },
  botaoCancelar: {
    borderWidth: 1.5,
    borderColor: ShelloTema.cores.textoS,
    borderRadius: ShelloTema.forma.bordaPill,
    paddingVertical: ShelloTema.espacamento.md,
    paddingHorizontal: ShelloTema.espacamento.xl,
    width: '100%',
    alignItems: 'center',
  },
  botaoCancelarTexto: {
    fontSize: 15,
    fontWeight: '600',
    color: ShelloTema.cores.textoS,
  },
});

// ─── Componente principal: TelaPerfil ────────────────────────────────────────

export default function TelaPerfil() {
  const {
    nomeUsuario,
    memorias,
    removerMemoria,
    nivelFormalidade,
    setNivelFormalidade,
    sair,
    dadosOnboarding,
    definirUsuario,
    recarregarMemorias,
  } = useShello();

  const [nomeReferencia, setNomeReferencia] = useState(
    nomeUsuario || dadosOnboarding?.nome.split(' ')[0] || ''
  );
  const [salvandoNome, setSalvandoNome] = useState(false);
  const [modalSalvo, setModalSalvo] = useState<string | null>(null);
  const [modalConfirmarSaida, setModalConfirmarSaida] = useState(false);
  const [modalErro, setModalErro] = useState(false);
  const [emailReal, setEmailReal] = useState('');
  const [nomeReal, setNomeReal] = useState('');
  const [modalMemoriasVisivel, setModalMemoriasVisivel] = useState(false);
  const [buscaMemoria, setBuscaMemoria] = useState('');
  const [dialogConfig, setDialogConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
    isDestructive?: boolean;
  }>({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    if (nomeUsuario) setNomeReferencia(nomeUsuario);
  }, [nomeUsuario]);

  useEffect(() => {
    api.get('/api/users/me')
      .then((res) => {
        setEmailReal(res.data.email ?? '');
        setNomeReal(res.data.nome ?? '');
      })
      .catch(() => {});
  }, []);

  const listaMemorias = memorias;

  const memoriasModalFiltradas = useMemo(() => {
    return listaMemorias.filter((m) =>
      m.conteudo.toLowerCase().includes(buscaMemoria.toLowerCase()) ||
      (CONFIGURACAO_TIPO[m.tipo]?.rotulo || m.tipo).toLowerCase().includes(buscaMemoria.toLowerCase())
    );
  }, [listaMemorias, buscaMemoria]);

  // Handler de remoção: chama a função do contexto com o id da memória
  const handleRemoverMemoria = useCallback(
    async (id: string) => {
      if (id.startsWith('mock-')) return;
      try {
        await removerMemoria(id);
      } catch (erro) {
        console.error('Erro ao remover memória:', erro);
      }
    },
    [removerMemoria]
  );

  const handleSalvarNome = useCallback(async () => {
    const nomeTrimado = nomeReferencia.trim();
    if (!nomeTrimado) return;
    setSalvandoNome(true);
    try {
      await api.put('/api/users/preferences', { nome_referencia: nomeTrimado });

      // Remove memória antiga de nome e cria nova com o nome atualizado
      const memoriaNomeAntiga = memorias.find(
        (m) => m.tipo === 'PREFERENCIA' && m.conteudo.toLowerCase().includes('ser chamado')
      );
      if (memoriaNomeAntiga) {
        await api.delete(`/api/memories/${memoriaNomeAntiga.id}`);
      }
      await api.post('/api/memories', {
        conteudo: `Prefere ser chamado de ${nomeTrimado}`,
        tipo: 'PREFERENCIA',
      });

      definirUsuario(nomeTrimado, true);
      await recarregarMemorias();
      setModalSalvo(nomeTrimado);
    } catch {
      setModalErro(true);
    } finally {
      setSalvandoNome(false);
    }
  }, [nomeReferencia, definirUsuario, memorias, recarregarMemorias]);

  const handleSair = useCallback(() => {
    setModalConfirmarSaida(true);
  }, []);

  const primeiroNome = nomeReferencia || nomeReal.split(' ')[0] || nomeUsuario.split(' ')[0] || 'Usuário';
  const emailExibido = emailReal || '…';

  return (
    <SafeAreaView style={estilos.areaSegura}>
      <ScrollView
        style={estilos.scrollView}
        contentContainerStyle={estilos.conteudoScroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Cabeçalho ──────────────────────────────────────────────────── */}
        <View style={estilos.cabecalho}>
          {/* Avatar circular com logo do Shello */}
          <View style={estilos.avatarWrapper}>
            <Image
              source={require('../../assets/logoshello.jpeg')}
              style={estilos.avatarImagem}
              resizeMode="cover"
              accessibilityLabel="Avatar do Shello"
            />
          </View>

          {/* Nome do usuário em fonte serifada */}
          <Text style={estilos.nomeUsuario}>{nomeUsuario || 'Meu Perfil'}</Text>

          {/* Subtítulo descritivo */}
          <Text style={estilos.subtitulo}>{'Meu Perfil & Contexto da IA'}</Text>
        </View>

        {/* ── Seção: Nome de Referência ───────────────────────────────────── */}
        <View style={estilos.secao}>
          <Text style={estilos.tituloSecao}>Como o Shello te chama</Text>
          <Text style={estilos.descricaoSecao}>
            Personalize o nome usado pelo Shello ao se dirigir a você
          </Text>

          <Text style={estilos.labelCampo}>Nome de referência</Text>
          <View style={estilos.linhaInput}>
            <TextInput
              style={estilos.inputNome}
              value={nomeReferencia}
              onChangeText={setNomeReferencia}
              placeholder="Como o Shello deve te chamar?"
              placeholderTextColor={ShelloTema.cores.textoS}
              maxLength={30}
              returnKeyType="done"
              onSubmitEditing={handleSalvarNome}
              accessibilityLabel="Nome de referência"
            />
            <TouchableOpacity
              style={[
                estilos.botaoSalvarNome,
                salvandoNome && estilos.botaoSalvarNomeDesabilitado,
              ]}
              onPress={handleSalvarNome}
              disabled={salvandoNome}
              accessibilityRole="button"
              accessibilityLabel="Salvar nome de referência"
            >
              <Text style={estilos.textoBotaoSalvar}>
                {salvandoNome ? 'Salvando…' : 'Salvar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Seção: Personalidade da IA ─────────────────────────────────── */}
        <View style={estilos.secao}>
          <Text style={estilos.tituloSecao}>Personalidade da IA</Text>
          <Text style={estilos.descricaoSecao}>
            Escolha como o Shello deve se comunicar com você
          </Text>

          {/* Seletor de formalidade em linha */}
          <View style={estilos.seletorFormalidade}>
            {OPCOES_FORMALIDADE.map((opcao) => {
              const estaSelecionado = nivelFormalidade === opcao.valor;
              return (
                <TouchableOpacity
                  key={opcao.valor}
                  style={[
                    estilos.botaoFormalidade,
                    estaSelecionado
                      ? estilos.botaoFormalidadeAtivo
                      : estilos.botaoFormalidadeInativo,
                  ]}
                  onPress={() => setNivelFormalidade(opcao.valor)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: estaSelecionado }}
                  accessibilityLabel={`Nível de formalidade: ${opcao.rotulo}`}
                >
                  <Text
                    style={[
                      estilos.textoBotaoFormalidade,
                      estaSelecionado
                        ? estilos.textoBotaoAtivo
                        : estilos.textoBotaoInativo,
                    ]}
                  >
                    {opcao.rotulo}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Indicador visual do efeito da formalidade */}
          <View style={estilos.indicadorFormalidade}>
            <Text style={estilos.textoIndicadorFormalidade}>
              {DESCRICAO_FORMALIDADE[nivelFormalidade]}
            </Text>
          </View>
        </View>

        {/* ── Seção: Painel de Memórias ──────────────────────────────────── */}
        <View style={estilos.secao}>
          <View style={estilos.cabecalhoSecaoMemorias}>
            <View style={estilos.textosCabecalhoMemorias}>
              <Text style={estilos.tituloSecao}>O que o Shello sabe sobre você</Text>
              <Text style={estilos.descricaoSecao}>
                {listaMemorias.length}{' '}
                {listaMemorias.length === 1 ? 'memória registrada' : 'memórias registradas'}
              </Text>
            </View>
            {/* Ícone decorativo de livro aberto */}
            <View style={estilos.iconeDecorativo}>
              <Feather name="book-open" size={22} color={ShelloTema.cores.marca} />
            </View>
          </View>

          {/* Lista de cards de memória */}
          {listaMemorias.length === 0 ? (
            <View style={estilos.estadoVazioMemorias}>
              <Feather name="inbox" size={32} color={ShelloTema.cores.marcaClaro} />
              <Text style={estilos.estadoVazioMemoriasTexto}>
                Nenhuma memória ainda. O Shello aprende sobre você conforme vocês conversam.
              </Text>
            </View>
          ) : (
            <>
              {listaMemorias.slice(0, 5).map((memoria) => (
                <CardMemoria
                  key={memoria.id}
                  memoria={memoria}
                  aoRemover={handleRemoverMemoria}
                />
              ))}

              {listaMemorias.length > 0 && (
                <TouchableOpacity
                  style={estilos.botaoVerTodas}
                  onPress={() => setModalMemoriasVisivel(true)}
                  activeOpacity={0.8}
                >
                  <Text style={estilos.textoBotaoVerTodas}>
                    Ver todas as {listaMemorias.length} memórias
                  </Text>
                  <Feather name="arrow-right" size={14} color={ShelloTema.cores.marca} />
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Nota explicativa sobre as memórias */}
          <View style={estilos.notaRodape}>
            <Feather
              name="info"
              size={14}
              color={ShelloTema.cores.textoS}
              style={estilos.iconeNota}
            />
            <Text style={estilos.textoNota}>
              As memórias ajudam o Shello a personalizar suas respostas ao longo do tempo.
            </Text>
          </View>
        </View>

        {/* ── Seção: Conta ───────────────────────────────────────────────── */}
        <View style={estilos.secao}>
          <Text style={estilos.tituloSecao}>Conta</Text>

          {/* Linha de nome */}
          <View style={estilos.linhaInfoConta}>
            <View style={estilos.iconeInfoConta}>
              <Feather name="user" size={18} color={ShelloTema.cores.marca} />
            </View>
            <View style={estilos.textoInfoConta}>
              <Text style={estilos.labelInfoConta}>Nome</Text>
              <Text style={estilos.valorInfoConta}>{primeiroNome}</Text>
            </View>
          </View>

          {/* Separador */}
          <View style={estilos.separador} />

          {/* Linha de e-mail */}
          <View style={estilos.linhaInfoConta}>
            <View style={estilos.iconeInfoConta}>
              <Feather name="mail" size={18} color={ShelloTema.cores.marca} />
            </View>
            <View style={estilos.textoInfoConta}>
              <Text style={estilos.labelInfoConta}>E-mail</Text>
              <Text style={estilos.valorInfoConta}>{emailExibido}</Text>
            </View>
          </View>

          {/* Separador */}
          <View style={estilos.separador} />

          {/* Linha de versão */}
          <View style={estilos.linhaInfoConta}>
            <View style={estilos.iconeInfoConta}>
              <Feather name="info" size={18} color={ShelloTema.cores.marca} />
            </View>
            <View style={estilos.textoInfoConta}>
              <Text style={estilos.labelInfoConta}>Versão</Text>
              <Text style={estilos.valorInfoConta}>v1.0.0 — Beta</Text>
            </View>
          </View>

          {/* Separador */}
          <View style={estilos.separador} />

          {/* Botão Sair */}
          <TouchableOpacity
            style={estilos.botaoSair}
            onPress={handleSair}
            accessibilityRole="button"
            accessibilityLabel="Sair da conta"
          >
            <Feather
              name="log-out"
              size={20}
              color="#8B5E3C"
              style={estilos.iconeBotaoSair}
            />
            <Text style={estilos.textoBotaoSair}>Sair da conta</Text>
          </TouchableOpacity>
        </View>

        {/* Espaçamento inferior */}
        <View style={estilos.espacamentoInferior} />
      </ScrollView>

      {/* Modal de nome salvo */}
      {modalSalvo && (
        <ModalNomeSalvo
          nome={modalSalvo}
          aoFechar={() => setModalSalvo(null)}
        />
      )}

      {modalErro && (
        <ModalErro aoFechar={() => setModalErro(false)} />
      )}

      {modalConfirmarSaida && (
        <ModalConfirmarSaida
          aoConfirmar={async () => {
            setModalConfirmarSaida(false);
            try {
              await sair();
            } catch (erro) {
              console.error('Erro ao sair:', erro);
            }
          }}
          aoCancelar={() => setModalConfirmarSaida(false)}
        />
      )}

      {/* ── Modal: todas as memórias ────────────────────────────────────────── */}
      <Modal
        visible={modalMemoriasVisivel}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalMemoriasVisivel(false)}
      >
        <SafeAreaView style={estilos.modalAreaSegura}>
          {/* Cabeçalho */}
          <View style={estilos.modalCabecalho}>
            <TouchableOpacity
              style={estilos.modalBotaoFechar}
              onPress={() => setModalMemoriasVisivel(false)}
              accessibilityLabel="Fechar"
              accessibilityRole="button"
            >
              <Feather name="x" size={22} color={ShelloTema.cores.textoP} />
            </TouchableOpacity>
            <Text style={estilos.modalTitulo}>Memórias</Text>
            <View style={{ width: 38 }} />
          </View>

          {/* Conteúdo */}
          <View style={estilos.modalConteudo}>
            <Text style={estilos.modalSubtitulo}>
              {listaMemorias.length}{' '}
              {listaMemorias.length === 1 ? 'memória registrada' : 'memórias registradas'}
            </Text>

            {/* Busca */}
            <View style={estilos.modalContainerBusca}>
              <Feather
                name="search"
                size={16}
                color={ShelloTema.cores.textoS}
                style={estilos.modalIconeBusca}
              />
              <TextInput
                style={estilos.modalInputBusca}
                placeholder="Buscar memória..."
                placeholderTextColor={ShelloTema.cores.textoS}
                value={buscaMemoria}
                onChangeText={setBuscaMemoria}
                autoCorrect={false}
                autoCapitalize="none"
                clearButtonMode="while-editing"
              />
            </View>

            {/* Lista */}
            <FlatList
              data={memoriasModalFiltradas}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <CardMemoria
                  memoria={item}
                  aoRemover={handleRemoverMemoria}
                />
              )}
              contentContainerStyle={estilos.modalListaConteudo}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={estilos.modalListaVazia}>
                  <Feather name="inbox" size={28} color={ShelloTema.cores.textoS} />
                  <Text style={estilos.modalListaVaziaTexto}>
                    {buscaMemoria ? 'Nenhuma memória encontrada.' : 'Sem memórias ainda.'}
                  </Text>
                </View>
              }
            />
          </View>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

// ─── Estilos principais da TelaPerfil ────────────────────────────────────────

const estilos = StyleSheet.create({
  // Área segura e scroll
  areaSegura: {
    flex: 1,
    backgroundColor: ShelloTema.cores.fundo,
  },
  scrollView: {
    flex: 1,
  },
  conteudoScroll: {
    paddingHorizontal: ShelloTema.espacamento.lg,
    paddingTop: ShelloTema.espacamento.lg,
  },

  // ── Cabeçalho ──────────────────────────────────────────────────────────────
  cabecalho: {
    alignItems: 'center',
    paddingVertical: ShelloTema.espacamento.xl,
    marginBottom: ShelloTema.espacamento.md,
  },
  // Anel verde ao redor do avatar
  avatarWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: ShelloTema.cores.marca,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ShelloTema.espacamento.md,
    ...ShelloTema.sombra.media,
  },
  avatarImagem: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  nomeUsuario: {
    fontFamily: 'serif',
    fontSize: 24,
    fontWeight: '700',
    color: ShelloTema.cores.textoP,
    marginBottom: ShelloTema.espacamento.xs,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 14,
    color: ShelloTema.cores.textoS,
    textAlign: 'center',
  },

  // ── Seções gerais ──────────────────────────────────────────────────────────
  secao: {
    backgroundColor: ShelloTema.cores.superficie,
    borderRadius: ShelloTema.forma.bordaMedia,
    padding: ShelloTema.espacamento.lg,
    marginBottom: ShelloTema.espacamento.md,
    ...ShelloTema.sombra.suave,
  },
  tituloSecao: {
    fontSize: 18,
    fontWeight: '700',
    color: ShelloTema.cores.textoP,
    marginBottom: ShelloTema.espacamento.xs,
  },
  descricaoSecao: {
    fontSize: 13,
    color: ShelloTema.cores.textoS,
    marginBottom: ShelloTema.espacamento.md,
    lineHeight: 18,
  },

  // ── Nome de referência editável ────────────────────────────────────────────
  labelCampo: {
    fontSize: 12,
    color: ShelloTema.cores.textoS,
    marginBottom: ShelloTema.espacamento.xs,
    fontWeight: '500',
  },
  linhaInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ShelloTema.espacamento.sm,
  },
  inputNome: {
    flex: 1,
    backgroundColor: ShelloTema.cores.fundo,
    borderRadius: ShelloTema.forma.bordaPill,
    paddingHorizontal: ShelloTema.espacamento.md,
    paddingVertical: ShelloTema.espacamento.sm,
    fontSize: 15,
    color: ShelloTema.cores.textoP,
    borderWidth: 1,
    borderColor: ShelloTema.cores.marcaClaro,
  },
  botaoSalvarNome: {
    backgroundColor: ShelloTema.cores.marca,
    borderRadius: ShelloTema.forma.bordaPill,
    paddingVertical: ShelloTema.espacamento.sm,
    paddingHorizontal: ShelloTema.espacamento.md,
  },
  botaoSalvarNomeDesabilitado: {
    opacity: 0.6,
  },
  textoBotaoSalvar: {
    fontSize: 13,
    fontWeight: '700',
    color: ShelloTema.cores.superficie,
  },

  // ── Seletor de formalidade ──────────────────────────────────────────────────
  seletorFormalidade: {
    flexDirection: 'row',
    gap: ShelloTema.espacamento.sm,
    justifyContent: 'space-between',
    marginBottom: ShelloTema.espacamento.md,
  },
  botaoFormalidade: {
    flex: 1,
    paddingVertical: ShelloTema.espacamento.sm,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoFormalidadeAtivo: {
    backgroundColor: ShelloTema.cores.marca,
  },
  botaoFormalidadeInativo: {
    backgroundColor: ShelloTema.cores.superficie,
    borderWidth: 1,
    borderColor: ShelloTema.cores.textoS,
  },
  textoBotaoFormalidade: {
    fontSize: 13,
    fontWeight: '600',
  },
  textoBotaoAtivo: {
    color: ShelloTema.cores.superficie,
  },
  textoBotaoInativo: {
    color: ShelloTema.cores.textoS,
  },
  // Indicador descritivo do efeito da formalidade
  indicadorFormalidade: {
    backgroundColor: ShelloTema.cores.fundo,
    borderRadius: ShelloTema.forma.bordaPequena,
    paddingVertical: ShelloTema.espacamento.sm,
    paddingHorizontal: ShelloTema.espacamento.md,
  },
  textoIndicadorFormalidade: {
    fontSize: 13,
    color: ShelloTema.cores.textoS,
    textAlign: 'center',
    lineHeight: 18,
  },

  // ── Painel de memórias ─────────────────────────────────────────────────────
  cabecalhoSecaoMemorias: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: ShelloTema.espacamento.md,
  },
  textosCabecalhoMemorias: {
    flex: 1,
    marginRight: ShelloTema.espacamento.sm,
  },
  iconeDecorativo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ShelloTema.cores.marcaClaro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  estadoVazioMemorias: {
    alignItems: 'center',
    paddingVertical: ShelloTema.espacamento.xl,
    gap: ShelloTema.espacamento.sm,
  },
  estadoVazioMemoriasTexto: {
    fontSize: 13,
    color: ShelloTema.cores.textoS,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 260,
  },
  notaRodape: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: ShelloTema.espacamento.sm,
    backgroundColor: ShelloTema.cores.fundo,
    borderRadius: ShelloTema.forma.bordaPequena,
    padding: ShelloTema.espacamento.sm,
  },
  iconeNota: {
    marginRight: ShelloTema.espacamento.xs,
    marginTop: 1,
  },
  textoNota: {
    flex: 1,
    fontSize: 12,
    color: ShelloTema.cores.textoS,
    lineHeight: 17,
  },

  // ── Seção de conta ─────────────────────────────────────────────────────────
  linhaInfoConta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ShelloTema.espacamento.md,
    marginTop: ShelloTema.espacamento.xs,
  },
  iconeInfoConta: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ShelloTema.cores.marcaClaro,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ShelloTema.espacamento.md,
  },
  textoInfoConta: {
    flex: 1,
  },
  labelInfoConta: {
    fontSize: 12,
    color: ShelloTema.cores.textoS,
    marginBottom: 2,
  },
  valorInfoConta: {
    fontSize: 15,
    fontWeight: '600',
    color: ShelloTema.cores.textoP,
  },
  separador: {
    height: 1,
    backgroundColor: ShelloTema.cores.fundo,
    marginBottom: ShelloTema.espacamento.xs,
  },
  botaoSair: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ShelloTema.cores.terracota,
    borderRadius: 50,
    paddingVertical: ShelloTema.espacamento.md,
    paddingHorizontal: ShelloTema.espacamento.xl,
    marginTop: ShelloTema.espacamento.sm,
    ...ShelloTema.sombra.suave,
  },
  iconeBotaoSair: {
    marginRight: ShelloTema.espacamento.sm,
  },
  textoBotaoSair: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B5E3C',
  },

  // Espaçamento extra no final do scroll
  espacamentoInferior: {
    height: ShelloTema.espacamento.xl,
  },
  modalAreaSegura: {
    flex: 1,
    backgroundColor: ShelloTema.cores.fundo,
  },
  modalCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ShelloTema.espacamento.md,
    paddingVertical: ShelloTema.espacamento.sm,
    borderBottomWidth: 1,
    borderBottomColor: ShelloTema.cores.marcaClaro + '40',
    backgroundColor: ShelloTema.cores.superficie,
  },
  modalBotaoFechar: {
    padding: 8,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: ShelloTema.cores.textoP,
    fontFamily: 'serif',
  },
  modalConteudo: {
    flex: 1,
    padding: ShelloTema.espacamento.lg,
  },
  modalSubtitulo: {
    fontSize: 13,
    color: ShelloTema.cores.textoS,
    lineHeight: 18,
    marginBottom: ShelloTema.espacamento.md,
  },
  modalContainerBusca: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ShelloTema.cores.superficie,
    borderRadius: ShelloTema.forma.bordaPill,
    paddingHorizontal: ShelloTema.espacamento.md,
    height: 44,
    borderWidth: 1,
    borderColor: ShelloTema.cores.marcaClaro + '60',
    marginBottom: ShelloTema.espacamento.md,
    ...ShelloTema.sombra.suave,
  },
  modalIconeBusca: {
    marginRight: ShelloTema.espacamento.sm,
  },
  modalInputBusca: {
    flex: 1,
    height: '100%',
    color: ShelloTema.cores.textoP,
    fontSize: 14,
  },
  modalListaConteudo: {
    paddingBottom: ShelloTema.espacamento.xl,
  },
  modalListaVazia: {
    alignItems: 'center',
    paddingVertical: ShelloTema.espacamento.xxl,
    gap: ShelloTema.espacamento.sm,
  },
  modalListaVaziaTexto: {
    fontSize: 13,
    color: ShelloTema.cores.textoS,
    textAlign: 'center',
  },
  botaoVerTodas: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ShelloTema.cores.marcaClaro + '30',
    borderRadius: ShelloTema.forma.bordaPill,
    paddingVertical: ShelloTema.espacamento.sm,
    paddingHorizontal: ShelloTema.espacamento.md,
    marginTop: ShelloTema.espacamento.sm,
    borderWidth: 1,
    borderColor: ShelloTema.cores.marca + '30',
    gap: ShelloTema.espacamento.sm,
  },
  textoBotaoVerTodas: {
    fontSize: 13,
    fontWeight: '700',
    color: ShelloTema.cores.marca,
  },
});
