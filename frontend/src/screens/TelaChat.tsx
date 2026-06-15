// TelaChat.tsx — Tela de conversa com a IA Shello (v3)
// Mascote expressivo que responde com base no contexto do usuário.
// Regra 4.1: limite de 20 mensagens por conversa.
// Regra 4.2: card de confirmação de tarefa sugerida pela IA.

import Markdown from 'react-native-markdown-display';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ScrollView,
  Image,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { ShelloTema } from '../styles/tema';
import { useShello } from '../contexts/ShelloContext';
import { MensagemChat, ExpressaoShello } from '../types';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DialogShello from '../components/DialogShello';

const markdownEstilos = {
  body: {
    fontSize: 15,
    color: ShelloTema.cores.textoP,
    lineHeight: 22,
  },
  strong: {
    fontWeight: '700' as const,
    color: ShelloTema.cores.textoP,
  },
  em: {
    fontStyle: 'italic' as const,
  },
  bullet_list: { marginVertical: 4 },
  ordered_list: { marginVertical: 4 },
  list_item: { marginVertical: 2 },
  paragraph: { marginVertical: 0 },
};

// Sprite sheet: 4 quadros lado a lado (neutro, duvidoso, surpreso, feliz)
const SPRITE_SHELLO = require('../../assets/shello-expressoes.jpeg');

const INDICE_EXPRESSAO: Record<ExpressaoShello, number> = {
  neutro: 0,
  duvidoso: 1,
  surpreso: 2,
  feliz: 3,
};

// ─── Utilitários ──────────────────────────────────────────────────────────────

function horaAtual(): string {
  const agora = new Date();
  return `${agora.getHours().toString().padStart(2, '0')}:${agora.getMinutes().toString().padStart(2, '0')}`;
}

function gerarId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function mapearExpressaoShello(texto: string): ExpressaoShello {
  const t = texto.toLowerCase();
  
  if (/🎉|😊|😄|❤️|🚀|parabéns|ótimo|excelente|feliz|sucesso|conseguiu|boa!|maravilha|oba|legal|comemora/i.test(t)) {
    return 'feliz';
  }
  
  if (/talvez|se |porém|mas |dúvida|difícil|estranho|confuso|problema|erro|infelizmente|desculpe|ops/i.test(t)) {
    return 'duvidoso';
  }
  
  if (/uau|nossa|sério|incrível|caramba|eita|caraca|olha só|!|\?/i.test(t)) {
    return 'surpreso';
  }
  
  return 'neutro';
}

// ─── Sugestões rápidas ────────────────────────────────────────────────────────

interface Sugestao {
  id: string;
  texto: string;
  icone: keyof typeof Feather.glyphMap;
}

const SUGESTOES: Sugestao[] = [
  { id: 's1', texto: 'Me ajude a refletir sobre meu dia', icone: 'sun' },
  { id: 's2', texto: 'Prática de gratidão', icone: 'heart' },
  { id: 's3', texto: 'Ideias para o meu diário', icone: 'book-open' },
];

// ─── Componente: AvatarShello ─────────────────────────────────────────────────

interface AvatarShelloProps {
  expressao: ExpressaoShello;
  tamanho: number;
}

function AvatarShello({ expressao, tamanho }: AvatarShelloProps): React.JSX.Element {
  const indice = INDICE_EXPRESSAO[expressao];
  const deslocamento = -(tamanho * indice);

  return (
    <View
      style={[
        estilos.avatarContainer,
        { width: tamanho, height: tamanho, borderRadius: tamanho / 2 },
      ]}
    >
      <Image
        source={SPRITE_SHELLO}
        style={[
          estilos.avatarSprite,
          { width: tamanho * 4, height: tamanho, marginLeft: deslocamento },
        ]}
        resizeMode="cover"
      />
    </View>
  );
}

// ─── Componente: ShimmerLoader ────────────────────────────────────────────────

function ShimmerLoader({ expressao }: { expressao: ExpressaoShello }): React.JSX.Element {
  const opacidade = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animacao = Animated.loop(
      Animated.sequence([
        Animated.timing(opacidade, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacidade, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    );
    animacao.start();
    return () => animacao.stop();
  }, [opacidade]);

  return (
    <View style={estilos.shimmerContainer}>
      <AvatarShello expressao={expressao} tamanho={28} />
      <View style={estilos.shimmerBalao}>
        <Animated.View style={[estilos.shimmerBarra, { width: '65%', opacity: opacidade }]} />
        <Animated.View style={[estilos.shimmerBarra, { width: '45%', opacity: opacidade }]} />
        <Animated.View style={[estilos.shimmerBarra, { width: '78%', opacity: opacidade }]} />
      </View>
    </View>
  );
}

// ─── Componente: BalaoChatIA ──────────────────────────────────────────────────

function BalaoChatIA({ mensagem }: { mensagem: MensagemChat }): React.JSX.Element {
  const expressao: ExpressaoShello = mensagem.expressao ?? 'neutro';
  return (
    <View style={estilos.linhaIA}>
      <AvatarShello expressao={expressao} tamanho={30} />
      <View style={estilos.balaoIAWrapper}>
        <View style={estilos.balaoIA}>
          <Markdown style={markdownEstilos}>{mensagem.conteudo}</Markdown>
        </View>
        <Text style={estilos.horario}>{mensagem.horario}</Text>
      </View>
    </View>
  );
}

// ─── Componente: BalaoChatUsuario ─────────────────────────────────────────────

function BalaoChatUsuario({ mensagem }: { mensagem: MensagemChat }): React.JSX.Element {
  return (
    <View style={estilos.linhaUsuario}>
      <View style={estilos.balaoUsuarioWrapper}>
        <View style={estilos.balaoUsuario}>
          <Text style={estilos.balaoUsuarioTexto}>{mensagem.conteudo}</Text>
        </View>
        <Text style={[estilos.horario, estilos.horarioUsuario]}>{mensagem.horario}</Text>
      </View>
    </View>
  );
}

// ─── Componente: CardTarefaSugerida ───────────────────────────────────────────

interface CardTarefaProps {
  titulo: string;
  aoConfirmar: () => void;
  aoCancelar: () => void;
}

function CardTarefaSugerida({ titulo, aoConfirmar, aoCancelar }: CardTarefaProps): React.JSX.Element {
  return (
    <View style={estilos.cardTarefa}>
      <View style={estilos.cardTarefaHeader}>
        <Feather name="plus-circle" size={16} color={ShelloTema.cores.marca} />
        <Text style={estilos.cardTarefaTitulo}>  Criar tarefa?</Text>
      </View>
      <Text style={estilos.cardTarefaTexto} numberOfLines={2}>{titulo}</Text>
      <View style={estilos.cardTarefaBotoes}>
        <TouchableOpacity style={estilos.botaoConfirmar} onPress={aoConfirmar} activeOpacity={0.8}>
          <Text style={estilos.botaoConfirmarTexto}>✓ Confirmar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={estilos.botaoCancelar} onPress={aoCancelar} activeOpacity={0.7}>
          <Text style={estilos.botaoCancelarTexto}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Tela Principal: TelaChat ─────────────────────────────────────────────────

export default function TelaChat(): React.JSX.Element {
  const { nomeUsuario, adicionarTarefaDeChat } = useShello();
  const insets = useSafeAreaInsets();

  const [tecladoVisivel, setTecladoVisivel] = useState(false);
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [inputTexto, setInputTexto] = useState('');
  const [pensando, setPensando] = useState(false);
  const [expressaoAtual, setExpressaoAtual] = useState<ExpressaoShello>('feliz');
  const [tarefaSugerida, setTarefaSugerida] = useState<string | null>(null);
  const [confirmacaoTarefa, setConfirmacaoTarefa] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversaSavedLoaded, setConversaSavedLoaded] = useState(false);
  const [modalNovoChat, setModalNovoChat] = useState(false);

  const flatListRef = useRef<FlatList<MensagemChat>>(null);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setTecladoVisivel(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setTecladoVisivel(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // ── Carrega a conversa salva ao montar a tela ──────────────────────────────
  useEffect(() => {
    const carregarConversaSalva = async () => {
      try {
        const [savedMsgs, savedConvId] = await Promise.all([
          AsyncStorage.getItem('@shello:chat_messages'),
          AsyncStorage.getItem('@shello:chat_conversation_id'),
        ]);

        if (savedMsgs) {
          const parsed = JSON.parse(savedMsgs);
          setMensagens(parsed);
          const ultimaMsgIA = parsed.find((m: MensagemChat) => m.remetente === 'ia');
          if (ultimaMsgIA && ultimaMsgIA.expressao) {
            setExpressaoAtual(ultimaMsgIA.expressao);
          }
        } else {
          const nome = nomeUsuario || 'amigo';
          const boasVindas: MensagemChat = {
            id: gerarId(),
            remetente: 'ia',
            conteudo: `Olá, ${nome}! 🌿 Sou o Shello, seu companheiro de crescimento pessoal. O que você quer explorar hoje?`,
            horario: horaAtual(),
            expressao: 'feliz',
          };
          setMensagens([boasVindas]);
        }

        if (savedConvId) {
          setConversationId(savedConvId);
        }
      } catch (e) {
        console.error('Erro ao carregar conversa:', e);
      } finally {
        setConversaSavedLoaded(true);
      }
    };

    carregarConversaSalva();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Salva a conversa sempre que mudar (após carregada) ──────────────────
  useEffect(() => {
    if (!conversaSavedLoaded) return;

    const salvarConversa = async () => {
      try {
        await AsyncStorage.setItem('@shello:chat_messages', JSON.stringify(mensagens));
        if (conversationId) {
          await AsyncStorage.setItem('@shello:chat_conversation_id', conversationId);
        } else {
          await AsyncStorage.removeItem('@shello:chat_conversation_id');
        }
      } catch (e) {
        console.error('Erro ao salvar conversa:', e);
      }
    };
    salvarConversa();
  }, [mensagens, conversationId, conversaSavedLoaded]);

  const mostrarSugestoes = mensagens.length < 3 && !tecladoVisivel;

  // ── Enviar mensagem ──────────────────────────────────────────────────────
  const enviarMensagem = useCallback(
    async (texto: string) => {
      const txt = texto.trim();
      if (!txt || pensando) return;

      const msgUsuario: MensagemChat = {
        id: gerarId(),
        remetente: 'usuario',
        conteudo: txt,
        horario: horaAtual(),
      };
      setMensagens((ant) => [msgUsuario, ...ant]);
      setInputTexto('');
      setPensando(true);
      setTarefaSugerida(null);
      setConfirmacaoTarefa(null);

      try {
        const { data } = await api.post('/api/chat', {
          message: txt,
          conversation_id: conversationId ?? undefined,
        });

        const expressao = mapearExpressaoShello(data.response);
        setExpressaoAtual(expressao);
        setConversationId(data.conversation_id);
        if (data.suggest_task) {
          setTarefaSugerida(data.suggest_task);
        }

        const msgIA: MensagemChat = {
          id: gerarId(),
          remetente: 'ia',
          conteudo: data.response,
          horario: horaAtual(),
          expressao,
        };
        setMensagens((ant) => [msgIA, ...ant]);
      } catch (err: any) {
        const status = err?.response?.status;
        const detalhe = err?.response?.data?.detail ?? '';
        const isLimite = status === 400 && detalhe.toLowerCase().includes('limite');
        const msgErro: MensagemChat = {
          id: gerarId(),
          remetente: 'ia',
          conteudo: isLimite
            ? 'Atingimos o limite de mensagens desta conversa. Inicie uma nova conversa para continuar. 🐢'
            : 'Não consegui me conectar agora. Tente novamente em instantes. 🐢',
          horario: horaAtual(),
          expressao: 'duvidoso',
        };
        setMensagens((ant) => [msgErro, ...ant]);
      } finally {
        setPensando(false);
      }
    },
    [pensando, conversationId]
  );

  // ── Confirmar tarefa sugerida ────────────────────────────────────────────
  const confirmarTarefa = useCallback(async () => {
    if (!tarefaSugerida) return;
    try {
      await adicionarTarefaDeChat(tarefaSugerida);
      setConfirmacaoTarefa(tarefaSugerida);
      // Auto-reset do feedback após 4 s para não ficar visível permanentemente
      setTimeout(() => setConfirmacaoTarefa(null), 4000);
    } catch (e) {
      console.error('Erro ao adicionar tarefa:', e);
    } finally {
      setTarefaSugerida(null);
    }
  }, [tarefaSugerida, adicionarTarefaDeChat]);

  // ── Novo chat ────────────────────────────────────────────────────────────
  const iniciarNovoChat = useCallback(() => {
    const nome = nomeUsuario || 'amigo';
    const novaBoasVindas: MensagemChat = {
      id: gerarId(),
      remetente: 'ia',
      conteudo: `Nova conversa! 🌿 Estou aqui, ${nome}. O que você quer explorar agora?`,
      horario: horaAtual(),
      expressao: 'feliz',
    };
    setMensagens([novaBoasVindas]);
    setTarefaSugerida(null);
    setConfirmacaoTarefa(null);
    setExpressaoAtual('feliz');
    setConversationId(null);
  }, [nomeUsuario]);

  // ── Renderização de mensagem ──────────────────────────────────────────────
  const renderMensagem = useCallback(
    ({ item }: { item: MensagemChat }) =>
      item.remetente === 'ia' ? <BalaoChatIA mensagem={item} /> : <BalaoChatUsuario mensagem={item} />,
    []
  );

  return (
    <SafeAreaView style={estilos.safeArea} edges={['top', 'left', 'right']}>
      {/* ── Cabeçalho ──────────────────────────────────────────────────── */}
      <View style={estilos.cabecalho}>
        <View style={estilos.avatarWrapper}>
          <AvatarShello expressao={expressaoAtual} tamanho={48} />
          <View style={estilos.statusOnline} />
        </View>
        <View style={estilos.cabecalhoTextos}>
          <Text style={estilos.cabecalhoNome}>Shello</Text>
          <Text style={estilos.cabecalhoSubtitulo}>Seu Companheiro de IA</Text>
        </View>
        {/* Botão Novo Chat */}
        <TouchableOpacity
          style={estilos.botaoNovoChatHeader}
          onPress={() => setModalNovoChat(true)}
          activeOpacity={0.75}
          accessibilityLabel="Iniciar nova conversa"
          accessibilityRole="button"
        >
          <Feather name="refresh-cw" size={18} color={ShelloTema.cores.marca} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={estilos.tela}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* ── Lista de mensagens ────────────────────────────────────────── */}
        <FlatList
          ref={flatListRef}
          data={mensagens}
          keyExtractor={(item) => item.id}
          renderItem={renderMensagem}
          inverted
          style={estilos.listaContainer}
          contentContainerStyle={estilos.listaMensagens}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            pensando ? <ShimmerLoader expressao={expressaoAtual} /> : null
          }
        />

        {/* ── Sugestões rápidas ─────────────────────────────────────────── */}
        {mostrarSugestoes && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={estilos.sugestoesScroll}
            contentContainerStyle={estilos.sugestoesContent}
          >
            {SUGESTOES.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={estilos.cardSugestao}
                onPress={() => enviarMensagem(s.texto)}
                activeOpacity={0.75}
              >
                <View style={estilos.cardSugestaoIcone}>
                  <Feather name={s.icone} size={17} color={ShelloTema.cores.marca} />
                </View>
                <Text style={estilos.cardSugestaoTexto}>{s.texto}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* ── Card de tarefa sugerida ───────────────────────────────────── */}
        {tarefaSugerida && (
          <CardTarefaSugerida
            titulo={tarefaSugerida}
            aoConfirmar={confirmarTarefa}
            aoCancelar={() => setTarefaSugerida(null)}
          />
        )}

        {/* ── Feedback de tarefa confirmada ─────────────────────────────── */}
        {confirmacaoTarefa && (
          <View style={estilos.feedbackTarefa}>
            <Feather name="check-circle" size={15} color={ShelloTema.cores.marca} />
            <Text style={estilos.feedbackTarefaTexto}>  Tarefa adicionada à sua jornada!</Text>
          </View>
        )}

        {/* ── Barra de entrada ─────────────────────────────────────────── */}
        <View style={[
          estilos.barraEntrada,
          {
            paddingBottom: tecladoVisivel
              ? ShelloTema.espacamento.sm
              : Math.max(insets.bottom, ShelloTema.espacamento.md)
          }
        ]}>
          <TextInput
            testID="chat-input"
            style={estilos.input}
            value={inputTexto}
            onChangeText={setInputTexto}
            placeholder="Compartilhe seus pensamentos..."
            placeholderTextColor={ShelloTema.cores.textoS}
            multiline
            maxLength={500}
            returnKeyType="default"
          />
          <TouchableOpacity
            testID="chat-send-button"
            style={[
              estilos.botaoEnviar,
              (!inputTexto.trim() || pensando) && estilos.botaoEnviarDesabilitado,
            ]}
            onPress={() => enviarMensagem(inputTexto)}
            activeOpacity={0.8}
            disabled={!inputTexto.trim() || pensando}
          >
            <Feather name="send" size={20} color={ShelloTema.cores.superficie} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Dialog: confirmar novo chat */}
      <DialogShello
        visible={modalNovoChat}
        onClose={() => setModalNovoChat(false)}
        title="Nova Conversa"
        message="O histórico desta conversa será apagado localmente. Deseja continuar?"
        confirmLabel="Nova conversa"
        cancelLabel="Cancelar"
        onConfirm={iniciarNovoChat}
      />
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: ShelloTema.cores.fundo },
  tela: { flex: 1 },
  listaContainer: { flex: 1 },

  // Cabeçalho
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ShelloTema.espacamento.lg,
    paddingVertical: ShelloTema.espacamento.md,
    backgroundColor: ShelloTema.cores.superficie,
    borderBottomWidth: 1,
    borderBottomColor: ShelloTema.cores.marcaClaro,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarWrapper: { position: 'relative', marginRight: ShelloTema.espacamento.md },
  avatarContainer: { overflow: 'hidden', backgroundColor: ShelloTema.cores.marcaClaro },
  avatarSprite: {},
  statusOnline: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: ShelloTema.cores.superficie,
  },
  cabecalhoTextos: { flex: 1 },
  cabecalhoNome: {
    fontSize: 17,
    fontWeight: 'bold',
    color: ShelloTema.cores.textoP,
    letterSpacing: 0.2,
  },
  cabecalhoSubtitulo: { fontSize: 12, color: ShelloTema.cores.textoS, marginTop: 1 },
  botaoNovoChatHeader: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ShelloTema.cores.marcaClaro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contadorWrapper: { alignItems: 'center' },
  contadorTexto: { fontSize: 11, color: ShelloTema.cores.textoS, fontWeight: '500' },
  contadorTextoAlerta: { color: ShelloTema.cores.erro, fontWeight: '700' },

  // Banner de limite
  bannerLimite: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ShelloTema.cores.terracota,
    paddingHorizontal: ShelloTema.espacamento.md,
    paddingVertical: ShelloTema.espacamento.sm,
  },
  bannerLimiteTexto: {
    flex: 1,
    fontSize: 13,
    color: '#8B5E3C',
    fontWeight: '500',
  },
  botaoNovoChat: {
    backgroundColor: ShelloTema.cores.marca,
    borderRadius: ShelloTema.forma.bordaPill,
    paddingHorizontal: ShelloTema.espacamento.md,
    paddingVertical: ShelloTema.espacamento.xs,
  },
  botaoNovoChatTexto: { fontSize: 13, color: '#FFF', fontWeight: '700' },

  // Sugestões
  sugestoesScroll: { flexGrow: 0, paddingVertical: ShelloTema.espacamento.md },
  sugestoesContent: { paddingHorizontal: ShelloTema.espacamento.md },
  cardSugestao: {
    backgroundColor: ShelloTema.cores.superficie,
    borderRadius: ShelloTema.forma.bordaPequena,
    padding: ShelloTema.espacamento.md,
    maxWidth: 160,
    minWidth: 130,
    marginRight: ShelloTema.espacamento.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardSugestaoIcone: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ShelloTema.cores.marcaClaro,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ShelloTema.espacamento.sm,
  },
  cardSugestaoTexto: {
    fontSize: 12,
    color: ShelloTema.cores.textoP,
    lineHeight: 16,
    fontWeight: '500',
  },

  // Lista
  listaMensagens: {
    paddingHorizontal: ShelloTema.espacamento.md,
    paddingVertical: ShelloTema.espacamento.sm,
  },

  // Balão IA
  linhaIA: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: ShelloTema.espacamento.md,
  },
  balaoIAWrapper: {
    flex: 1,
    alignItems: 'flex-start',
    maxWidth: '80%',
    marginLeft: ShelloTema.espacamento.sm,
  },
  balaoIA: {
    backgroundColor: ShelloTema.cores.superficie,
    borderRadius: ShelloTema.forma.bordaMedia,
    borderTopLeftRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  balaoIATexto: { fontSize: 15, color: ShelloTema.cores.textoP, lineHeight: 22 },

  // Balão Usuário
  linhaUsuario: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: ShelloTema.espacamento.md,
  },
  balaoUsuarioWrapper: { alignItems: 'flex-end', maxWidth: '80%' },
  balaoUsuario: {
    backgroundColor: ShelloTema.cores.marca,
    borderRadius: ShelloTema.forma.bordaMedia,
    borderTopRightRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  balaoUsuarioTexto: { fontSize: 15, color: '#FFF', lineHeight: 22 },

  // Horário
  horario: {
    fontSize: 11,
    color: ShelloTema.cores.textoS,
    marginTop: ShelloTema.espacamento.xs,
    marginLeft: ShelloTema.espacamento.xs,
  },
  horarioUsuario: { marginLeft: 0, marginRight: ShelloTema.espacamento.xs, textAlign: 'right' },

  // Shimmer
  shimmerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: ShelloTema.espacamento.md,
  },
  shimmerBalao: {
    flex: 1,
    backgroundColor: ShelloTema.cores.superficie,
    borderRadius: ShelloTema.forma.bordaMedia,
    borderTopLeftRadius: 4,
    paddingVertical: ShelloTema.espacamento.md,
    paddingHorizontal: ShelloTema.espacamento.md,
    gap: ShelloTema.espacamento.sm,
    maxWidth: '75%',
    marginLeft: ShelloTema.espacamento.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  shimmerBarra: {
    height: 12,
    borderRadius: 8,
    backgroundColor: ShelloTema.cores.marcaClaro,
  },

  // Card de tarefa sugerida
  cardTarefa: {
    marginHorizontal: ShelloTema.espacamento.md,
    marginBottom: ShelloTema.espacamento.sm,
    backgroundColor: ShelloTema.cores.superficie,
    borderRadius: ShelloTema.forma.bordaMedia,
    padding: ShelloTema.espacamento.md,
    borderLeftWidth: 3,
    borderLeftColor: ShelloTema.cores.marca,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTarefaHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  cardTarefaTitulo: {
    fontSize: 13,
    fontWeight: '700',
    color: ShelloTema.cores.marca,
    letterSpacing: 0.2,
  },
  cardTarefaTexto: {
    fontSize: 14,
    color: ShelloTema.cores.textoP,
    marginBottom: ShelloTema.espacamento.md,
    lineHeight: 20,
  },
  cardTarefaBotoes: { flexDirection: 'row', gap: ShelloTema.espacamento.sm },
  botaoConfirmar: {
    flex: 1,
    backgroundColor: ShelloTema.cores.marca,
    borderRadius: ShelloTema.forma.bordaPill,
    paddingVertical: ShelloTema.espacamento.sm,
    alignItems: 'center',
  },
  botaoConfirmarTexto: { fontSize: 13, color: '#FFF', fontWeight: '700' },
  botaoCancelar: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: ShelloTema.cores.textoS,
    borderRadius: ShelloTema.forma.bordaPill,
    paddingVertical: ShelloTema.espacamento.sm,
    alignItems: 'center',
  },
  botaoCancelarTexto: { fontSize: 13, color: ShelloTema.cores.textoS, fontWeight: '600' },

  // Feedback tarefa confirmada
  feedbackTarefa: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ShelloTema.espacamento.lg,
    paddingVertical: ShelloTema.espacamento.xs,
    backgroundColor: ShelloTema.cores.marcaClaro,
  },
  feedbackTarefaTexto: { fontSize: 13, color: ShelloTema.cores.marca, fontWeight: '600' },

  // Barra de entrada
  barraEntrada: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: ShelloTema.espacamento.md,
    paddingTop: ShelloTema.espacamento.md,
    paddingBottom: ShelloTema.espacamento.lg,
    backgroundColor: ShelloTema.cores.fundo,
    gap: ShelloTema.espacamento.sm,
    borderTopWidth: 1,
    borderTopColor: ShelloTema.cores.marcaClaro,
  },
  input: {
    flex: 1,
    backgroundColor: ShelloTema.cores.superficie,
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 15,
    color: ShelloTema.cores.textoP,
    maxHeight: 120,
    lineHeight: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  inputDesabilitado: { backgroundColor: ShelloTema.cores.fundo, color: ShelloTema.cores.textoS },
  botaoEnviar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: ShelloTema.cores.marca,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ShelloTema.cores.marca,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  botaoEnviarDesabilitado: {
    backgroundColor: ShelloTema.cores.marcaClaro,
    shadowOpacity: 0,
    elevation: 0,
  },
  botaoNovoChat2: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: ShelloTema.cores.marca,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ShelloTema.cores.marca,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
