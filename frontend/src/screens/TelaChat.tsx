// TelaChat.tsx — Tela de conversa com a IA Shello
// Inclui balões de mensagem, shimmer loader animado, sugestões rápidas e card de tarefa sugerida

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { ShelloTema } from '../styles/tema';
import { useShello } from '../contexts/ShelloContext';
import { MensagemChat } from '../types';

// ─── Utilitário: hora atual formatada ────────────────────────────────────────

function obterHoraAtual(): string {
  const agora = new Date();
  const horas = agora.getHours().toString().padStart(2, '0');
  const minutos = agora.getMinutes().toString().padStart(2, '0');
  return `${horas}:${minutos}`;
}

// ─── Utilitário: gerar ID único simples ──────────────────────────────────────

function gerarId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Respostas mockadas da IA ─────────────────────────────────────────────────

const RESPOSTAS_MOCKADAS: string[] = [
  'Que reflexão poderosa! Me conta mais sobre como você está se sentindo nesse momento. 🌿',
  'Adoro sua disposição para o crescimento! Vamos explorar isso juntos, passo a passo.',
  'É muito bonito você dedicar tempo para si mesmo. O que você gostaria de sentir ao final do dia?',
  'Sua intenção é clara e genuína. Que tal transformarmos isso em uma pequena ação concreta hoje?',
  'Obrigado por compartilhar! Às vezes, colocar os pensamentos em palavras já é o primeiro passo.',
];

function obterRespostaMockada(): string {
  const indice = Math.floor(Math.random() * RESPOSTAS_MOCKADAS.length);
  return RESPOSTAS_MOCKADAS[indice];
}

// ─── Sugestões de mensagem rápida ────────────────────────────────────────────

interface Sugestao {
  id: string;
  texto: string;
  icone: keyof typeof Feather.glyphMap;
}

const SUGESTOES: Sugestao[] = [
  { id: 's1', texto: 'Me ajude a refletir sobre o meu dia', icone: 'sun' },
  { id: 's2', texto: 'Prática de gratidão', icone: 'heart' },
  { id: 's3', texto: 'Ideias para o diário', icone: 'book' },
];

// ─── Componente: ShimmerLoader ────────────────────────────────────────────────

function ShimmerLoader(): React.JSX.Element {
  // Animação de pulsação de opacidade para simular carregamento
  const opacidade = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animacao = Animated.loop(
      Animated.sequence([
        Animated.timing(opacidade, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacidade, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animacao.start();
    return () => animacao.stop();
  }, [opacidade]);

  return (
    <View style={estilos.shimmerContainer}>
      {/* Avatar da IA */}
      <View style={estilos.avatarPequeno}>
        <Feather name="cpu" size={14} color={ShelloTema.cores.superficie} />
      </View>
      <View style={estilos.shimmerBalao}>
        {/* Três barras de larguras diferentes para simular texto */}
        <Animated.View
          style={[estilos.shimmerBarra, { width: '70%', opacity: opacidade }]}
        />
        <Animated.View
          style={[estilos.shimmerBarra, { width: '50%', opacity: opacidade }]}
        />
        <Animated.View
          style={[estilos.shimmerBarra, { width: '85%', opacity: opacidade }]}
        />
      </View>
    </View>
  );
}

// ─── Componente: CardTarefaSugerida ──────────────────────────────────────────

interface CardTarefaSugeridaProps {
  titulo: string;
  onConfirmar: () => void;
  onCancelar: () => void;
}

function CardTarefaSugerida({
  titulo,
  onConfirmar,
  onCancelar,
}: CardTarefaSugeridaProps): React.JSX.Element {
  return (
    <View style={estilos.cardTarefa}>
      <Feather
        name="check-circle"
        size={16}
        color={ShelloTema.cores.marca}
        style={estilos.cardTarefaIcone}
      />
      <Text style={estilos.cardTarefaTexto}>
        Criar tarefa: "{titulo}"?
      </Text>
      <View style={estilos.cardTarefaBotoes}>
        <TouchableOpacity
          style={estilos.botaoConfirmar}
          onPress={onConfirmar}
          activeOpacity={0.8}
        >
          <Text style={estilos.botaoConfirmarTexto}>Confirmar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={estilos.botaoCancelar}
          onPress={onCancelar}
          activeOpacity={0.8}
        >
          <Text style={estilos.botaoCancelarTexto}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Componente: BalaoChatIA ──────────────────────────────────────────────────

interface BalaoChatIAProps {
  mensagem: MensagemChat;
  onConfirmarTarefa: (id: string, titulo: string) => void;
  onCancelarTarefa: (id: string) => void;
  tarefasCanceladas: Set<string>;
}

function BalaoChatIA({
  mensagem,
  onConfirmarTarefa,
  onCancelarTarefa,
  tarefasCanceladas,
}: BalaoChatIAProps): React.JSX.Element {
  const mostrarCardTarefa =
    !!mensagem.tarefaSugerida && !tarefasCanceladas.has(mensagem.id);

  return (
    <View style={estilos.linhaIA}>
      {/* Avatar da IA */}
      <View style={estilos.avatarPequeno}>
        <Feather name="cpu" size={14} color={ShelloTema.cores.superficie} />
      </View>
      <View style={estilos.balaoIAWrapper}>
        {/* Balão principal */}
        <View style={estilos.balaoIA}>
          <Text style={estilos.balaoIATexto}>{mensagem.conteudo}</Text>
        </View>
        {/* Card de tarefa sugerida — exibido abaixo do balão */}
        {mostrarCardTarefa && (
          <CardTarefaSugerida
            titulo={mensagem.tarefaSugerida!}
            onConfirmar={() =>
              onConfirmarTarefa(mensagem.id, mensagem.tarefaSugerida!)
            }
            onCancelar={() => onCancelarTarefa(mensagem.id)}
          />
        )}
        <Text style={estilos.horario}>{mensagem.horario}</Text>
      </View>
    </View>
  );
}

// ─── Componente: BalaoChatUsuario ─────────────────────────────────────────────

function BalaoChatUsuario({
  mensagem,
}: {
  mensagem: MensagemChat;
}): React.JSX.Element {
  return (
    <View style={estilos.linhaUsuario}>
      <View style={estilos.balaoUsuarioWrapper}>
        <View style={estilos.balaoUsuario}>
          <Text style={estilos.balaoUsuarioTexto}>{mensagem.conteudo}</Text>
        </View>
        <Text style={[estilos.horario, estilos.horarioUsuario]}>
          {mensagem.horario}
        </Text>
      </View>
    </View>
  );
}

// ─── Tela Principal: TelaChat ─────────────────────────────────────────────────

export default function TelaChat(): React.JSX.Element {
  const { adicionarTarefa } = useShello();

  // ── Estado local ──────────────────────────────────────────────────────────
  const [mensagens, setMensagens] = useState<MensagemChat[]>([
    {
      id: gerarId(),
      remetente: 'ia',
      conteudo:
        'Olá! Sou o Shello, seu companheiro de crescimento pessoal. Como posso te ajudar hoje? 🌿',
      horario: obterHoraAtual(),
    },
  ]);
  const [inputTexto, setInputTexto] = useState('');
  const [pensando, setPensando] = useState(false);
  // IDs das mensagens cujo card de tarefa foi cancelado pelo usuário
  const [tarefasCanceladas, setTarefasCanceladas] = useState<Set<string>>(
    new Set()
  );

  const flatListRef = useRef<FlatList<MensagemChat>>(null);

  // ── Exibir sugestões apenas quando há poucas mensagens ───────────────────
  const mostrarSugestoes = mensagens.length < 2;

  // ── Enviar mensagem do usuário e acionar resposta da IA ──────────────────
  const enviarMensagem = useCallback(
    (texto: string) => {
      const textoTrimado = texto.trim();
      if (!textoTrimado || pensando) return;

      // Adiciona mensagem do usuário
      const novaMensagemUsuario: MensagemChat = {
        id: gerarId(),
        remetente: 'usuario',
        conteudo: textoTrimado,
        horario: obterHoraAtual(),
      };

      setMensagens((anterior) => [novaMensagemUsuario, ...anterior]);
      setInputTexto('');
      setPensando(true);

      // Simula resposta da IA após 3 segundos
      setTimeout(() => {
        const respostaTexto = obterRespostaMockada();
        const novaMensagemIA: MensagemChat = {
          id: gerarId(),
          remetente: 'ia',
          conteudo: respostaTexto,
          horario: obterHoraAtual(),
          // Card de tarefa sugerida junto com a resposta mockada
          tarefaSugerida: 'Meditar por 10 minutos',
        };
        setMensagens((anterior) => [novaMensagemIA, ...anterior]);
        setPensando(false);
      }, 3000);
    },
    [pensando]
  );

  // ── Confirmar criação de tarefa sugerida ─────────────────────────────────
  const confirmarTarefa = useCallback(
    async (idMensagem: string, tituloTarefa: string) => {
      await adicionarTarefa(tituloTarefa);
      // Remove o card de tarefa após confirmação ocultando-o via canceladas
      setTarefasCanceladas((anterior) => new Set([...anterior, idMensagem]));
    },
    [adicionarTarefa]
  );

  // ── Cancelar card de tarefa sugerida ─────────────────────────────────────
  const cancelarTarefa = useCallback((idMensagem: string) => {
    setTarefasCanceladas((anterior) => new Set([...anterior, idMensagem]));
  }, []);

  // ── Renderiza cada item da FlatList invertida ─────────────────────────────
  const renderizarMensagem = useCallback(
    ({ item }: { item: MensagemChat }) => {
      if (item.remetente === 'ia') {
        return (
          <BalaoChatIA
            mensagem={item}
            onConfirmarTarefa={confirmarTarefa}
            onCancelarTarefa={cancelarTarefa}
            tarefasCanceladas={tarefasCanceladas}
          />
        );
      }
      return <BalaoChatUsuario mensagem={item} />;
    },
    [confirmarTarefa, cancelarTarefa, tarefasCanceladas]
  );

  return (
    <SafeAreaView style={estilos.safeArea}>
      <KeyboardAvoidingView
        style={estilos.tela}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* ── Cabeçalho ────────────────────────────────────────────────── */}
        <View style={estilos.cabecalho}>
          {/* Avatar com indicador de status online */}
          <View style={estilos.avatarWrapper}>
            <View style={estilos.avatarGrande}>
              <Feather name="cpu" size={28} color={ShelloTema.cores.superficie} />
            </View>
            {/* Bolinha verde de status online */}
            <View style={estilos.statusOnline} />
          </View>
          {/* Informações de texto do cabeçalho */}
          <View style={estilos.cabecalhoTextos}>
            <Text style={estilos.cabecalhoNome}>Shello</Text>
            <Text style={estilos.cabecalhoSubtitulo}>Seu Companheiro de IA</Text>
          </View>
        </View>

        {/* ── Cards de sugestões rápidas ───────────────────────────────── */}
        {mostrarSugestoes && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={estilos.sugestoesScroll}
            contentContainerStyle={estilos.sugestoesContent}
          >
            {SUGESTOES.map((sugestao) => (
              <TouchableOpacity
                key={sugestao.id}
                style={estilos.cardSugestao}
                onPress={() => enviarMensagem(sugestao.texto)}
                activeOpacity={0.75}
              >
                <View style={estilos.cardSugestaoIconeWrapper}>
                  <Feather
                    name={sugestao.icone}
                    size={18}
                    color={ShelloTema.cores.marca}
                  />
                </View>
                <Text style={estilos.cardSugestaoTexto}>{sugestao.texto}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* ── Lista de mensagens (invertida) ───────────────────────────── */}
        <FlatList
          ref={flatListRef}
          data={mensagens}
          keyExtractor={(item) => item.id}
          renderItem={renderizarMensagem}
          inverted
          contentContainerStyle={estilos.listaMensagens}
          showsVerticalScrollIndicator={false}
          // Shimmer de "pensando" aparece no topo da lista invertida (= fundo visual)
          ListHeaderComponent={pensando ? <ShimmerLoader /> : null}
        />

        {/* ── Barra de entrada de texto ─────────────────────────────────── */}
        <View style={estilos.barraEntrada}>
          <TextInput
            style={estilos.input}
            value={inputTexto}
            onChangeText={setInputTexto}
            placeholder="Compartilhe seus pensamentos..."
            placeholderTextColor={ShelloTema.cores.textoS}
            multiline
            maxLength={500}
            returnKeyType="default"
          />
          {/* Botão de envio circular */}
          <TouchableOpacity
            style={[
              estilos.botaoEnviar,
              !inputTexto.trim() && estilos.botaoEnviarDesabilitado,
            ]}
            onPress={() => enviarMensagem(inputTexto)}
            activeOpacity={0.8}
            disabled={!inputTexto.trim() || pensando}
          >
            <Feather name="send" size={22} color={ShelloTema.cores.superficie} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  // ── Estrutura base ────────────────────────────────────────────────────────
  safeArea: {
    flex: 1,
    backgroundColor: ShelloTema.cores.fundo,
  },
  tela: {
    flex: 1,
  },

  // ── Cabeçalho ─────────────────────────────────────────────────────────────
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ShelloTema.espacamento.lg,
    paddingVertical: ShelloTema.espacamento.md,
    backgroundColor: ShelloTema.cores.superficie,
    borderBottomWidth: 1,
    borderBottomColor: ShelloTema.cores.marcaClaro,
    // Sombra suave no cabeçalho
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: ShelloTema.espacamento.md,
  },
  avatarGrande: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ShelloTema.cores.marca,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Indicador de status online — bolinha verde no canto inferior direito
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
  cabecalhoTextos: {
    flex: 1,
  },
  cabecalhoNome: {
    fontSize: 17,
    fontWeight: 'bold',
    color: ShelloTema.cores.textoP,
    letterSpacing: 0.2,
  },
  cabecalhoSubtitulo: {
    fontSize: 12,
    color: ShelloTema.cores.textoS,
    marginTop: 1,
  },

  // ── Cards de sugestão ─────────────────────────────────────────────────────
  sugestoesScroll: {
    flexGrow: 0,
    paddingVertical: ShelloTema.espacamento.md,
  },
  sugestoesContent: {
    paddingHorizontal: ShelloTema.espacamento.md,
    gap: ShelloTema.espacamento.sm,
  },
  cardSugestao: {
    backgroundColor: ShelloTema.cores.superficie,
    borderRadius: ShelloTema.forma.bordaPequena,
    padding: ShelloTema.espacamento.md,
    maxWidth: 160,
    minWidth: 130,
    // Sombra suave
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardSugestaoIconeWrapper: {
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
    lineHeight: 17,
    fontWeight: '500',
  },

  // ── Lista de mensagens ────────────────────────────────────────────────────
  listaMensagens: {
    paddingHorizontal: ShelloTema.espacamento.md,
    paddingVertical: ShelloTema.espacamento.sm,
  },

  // ── Balão da IA ───────────────────────────────────────────────────────────
  linhaIA: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: ShelloTema.espacamento.md,
  },
  avatarPequeno: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: ShelloTema.cores.marca,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ShelloTema.espacamento.sm,
    flexShrink: 0,
  },
  balaoIAWrapper: {
    flex: 1,
    alignItems: 'flex-start',
    maxWidth: '80%',
  },
  balaoIA: {
    backgroundColor: ShelloTema.cores.superficie,
    borderRadius: ShelloTema.forma.bordaMedia,
    // Cantos: sem canto superior esquerdo (próximo ao avatar)
    borderTopLeftRadius: 4,
    padding: ShelloTema.espacamento.md,
    // Sombra suave
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  balaoIATexto: {
    fontSize: 15,
    color: ShelloTema.cores.textoP,
    lineHeight: 22,
  },

  // ── Balão do usuário ──────────────────────────────────────────────────────
  linhaUsuario: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: ShelloTema.espacamento.md,
  },
  balaoUsuarioWrapper: {
    alignItems: 'flex-end',
    maxWidth: '80%',
  },
  balaoUsuario: {
    backgroundColor: ShelloTema.cores.marca,
    borderRadius: ShelloTema.forma.bordaMedia,
    // Cantos: sem canto superior direito
    borderTopRightRadius: 4,
    padding: ShelloTema.espacamento.md,
  },
  balaoUsuarioTexto: {
    fontSize: 15,
    color: ShelloTema.cores.superficie,
    lineHeight: 22,
  },

  // ── Horário das mensagens ─────────────────────────────────────────────────
  horario: {
    fontSize: 11,
    color: ShelloTema.cores.textoS,
    marginTop: ShelloTema.espacamento.xs,
    marginLeft: ShelloTema.espacamento.xs,
  },
  horarioUsuario: {
    marginLeft: 0,
    marginRight: ShelloTema.espacamento.xs,
    textAlign: 'right',
  },

  // ── Shimmer loader (IA pensando) ──────────────────────────────────────────
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
    padding: ShelloTema.espacamento.md,
    gap: ShelloTema.espacamento.sm,
    maxWidth: '75%',
    // Sombra suave
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  shimmerBarra: {
    height: 14,
    borderRadius: 8,
    backgroundColor: ShelloTema.cores.marcaClaro,
  },

  // ── Card de tarefa sugerida ───────────────────────────────────────────────
  cardTarefa: {
    backgroundColor: ShelloTema.cores.marcaClaro,
    borderRadius: ShelloTema.forma.bordaPequena,
    padding: ShelloTema.espacamento.md,
    marginTop: ShelloTema.espacamento.sm,
    width: '100%',
  },
  cardTarefaIcone: {
    marginBottom: ShelloTema.espacamento.xs,
  },
  cardTarefaTexto: {
    fontSize: 13,
    color: ShelloTema.cores.textoP,
    fontWeight: '500',
    marginBottom: ShelloTema.espacamento.sm,
    lineHeight: 19,
  },
  cardTarefaBotoes: {
    flexDirection: 'row',
    gap: ShelloTema.espacamento.sm,
  },
  botaoConfirmar: {
    backgroundColor: ShelloTema.cores.marca,
    borderRadius: 50,
    paddingVertical: ShelloTema.espacamento.xs + 2,
    paddingHorizontal: ShelloTema.espacamento.md,
  },
  botaoConfirmarTexto: {
    fontSize: 12,
    color: ShelloTema.cores.superficie,
    fontWeight: '700',
  },
  botaoCancelar: {
    backgroundColor: ShelloTema.cores.terracota,
    borderRadius: 50,
    paddingVertical: ShelloTema.espacamento.xs + 2,
    paddingHorizontal: ShelloTema.espacamento.md,
  },
  botaoCancelarTexto: {
    fontSize: 12,
    color: ShelloTema.cores.textoP,
    fontWeight: '600',
  },

  // ── Barra de entrada ──────────────────────────────────────────────────────
  barraEntrada: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: ShelloTema.espacamento.md,
    paddingVertical: ShelloTema.espacamento.md,
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
    paddingHorizontal: ShelloTema.espacamento.lg,
    paddingVertical: ShelloTema.espacamento.md,
    fontSize: 15,
    color: ShelloTema.cores.textoP,
    maxHeight: 120,
    lineHeight: 22,
    // Sombra suave
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  botaoEnviar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: ShelloTema.cores.marca,
    alignItems: 'center',
    justifyContent: 'center',
    // Sombra do botão de envio
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
});
