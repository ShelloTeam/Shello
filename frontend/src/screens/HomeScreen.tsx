// HomeScreen.tsx — Tela inicial do Shello
// Exibe saudação personalizada, card do diário do dia, atalhos e FAB

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { ShelloTema } from '../styles/tema';
import { useShello } from '../contexts/ShelloContext';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface HomeScreenProps {
  navigation: {
    navigate: (rota: string) => void;
  };
}

// ─── Utilitário de data em português ─────────────────────────────────────────

function formatarDataPtBR(): string {
  const agora = new Date();
  // Formata como: 'Quinta-feira, 4 de Junho'
  const diaFormatado = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(agora);
  // Capitaliza a primeira letra
  return diaFormatado.charAt(0).toUpperCase() + diaFormatado.slice(1);
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { nomeUsuario, adicionarNota } = useShello();

  // Estado do mini-editor do card
  const [textoNota, setTextoNota] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Animação do FAB (escala ao pressionar)
  const escalaFab = useRef(new Animated.Value(1)).current;

  const dataFormatada = formatarDataPtBR();

  // ─── Handlers ────────────────────────────────────────────────────────────

  // Salva a nota rápida do card de hoje
  async function handleSalvarNota() {
    if (!textoNota.trim() || salvando) return;
    setSalvando(true);
    try {
      await adicionarNota(textoNota.trim());
      setTextoNota('');
    } finally {
      setSalvando(false);
    }
  }

  // Animação de pressão no FAB
  function handleFabPressIn() {
    Animated.spring(escalaFab, {
      toValue: 0.88,
      useNativeDriver: true,
      speed: 30,
    }).start();
  }

  function handleFabPressOut() {
    Animated.spring(escalaFab, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start();
  }

  // Navega para a aba do Diário
  function irParaDiario() {
    navigation.navigate('DiarioTab');
  }

  // Navega para a aba do Chat
  function irParaChat() {
    navigation.navigate('ChatTab');
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={estilos.areaSegura} edges={['top']}>
      {/* ScrollView principal */}
      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.conteudoScroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Cabeçalho com data ── */}
        <View style={estilos.cabecalho}>
          <Feather
            name="calendar"
            size={16}
            color={ShelloTema.cores.textoS}
            style={estilos.iconeCalendario}
          />
          <Text style={estilos.textoData}>{dataFormatada}</Text>
        </View>

        {/* ── Saudação personalizada ── */}
        <View style={estilos.blocoSaudacao}>
          <Text style={estilos.saudacaoLinha1}>Bom dia,</Text>
          <Text style={estilos.saudacaoNome}>
            {nomeUsuario || 'Amigo'} 🌿
          </Text>
          <Text style={estilos.subtitulo}>
            Sua mente é um jardim. Cultive-a diariamente.
          </Text>
        </View>

        {/* ── Badges de progresso ── */}
        <View style={estilos.filhaBadges}>
          {/* Badge verde — sequência de dias */}
          <View style={[estilos.badge, estilos.badgeVerde]}>
            <Text style={estilos.textoBadgeVerde}>🔥 7 dias seguidos</Text>
          </View>

          {/* Badge terracota — total de entradas */}
          <View style={[estilos.badge, estilos.badgeTerracota]}>
            <Text style={estilos.textoBadgeTerracota}>✍️ 24 entradas</Text>
          </View>
        </View>

        {/* ── Card central do diário de hoje ── */}
        <View style={estilos.cardDiario}>
          {/* Cabeçalho interno do card */}
          <View style={estilos.cardCabecalho}>
            <View style={estilos.circuloIcone}>
              <Feather
                name="feather"
                size={18}
                color={ShelloTema.cores.marca}
              />
            </View>
            <Text style={estilos.cardTitulo}>Diário de Hoje</Text>
          </View>

          {/* Pergunta motivacional */}
          <Text style={estilos.cardPergunta}>
            Que momentos trouxeram paz para você hoje?
          </Text>

          {/* Campo de texto rápido */}
          <TextInput
            style={estilos.inputNota}
            value={textoNota}
            onChangeText={setTextoNota}
            placeholder="Começar a escrever..."
            placeholderTextColor={ShelloTema.cores.textoS}
            multiline
            textAlignVertical="top"
          />

          {/* Botão inline de salvar */}
          <TouchableOpacity
            style={[
              estilos.botaoSalvarNota,
              salvando && estilos.botaoSalvarNotaDesabilitado,
            ]}
            onPress={handleSalvarNota}
            disabled={salvando}
            activeOpacity={0.8}
          >
            <Text style={estilos.textoBotaoSalvar}>
              {salvando ? 'Salvando...' : 'Salvar nota'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Cards de atalho ── */}
        <View style={estilos.filhaAtalhos}>
          {/* Atalho — Escrever no Diário */}
          <TouchableOpacity
            style={[estilos.cardAtalho, estilos.cardAtalhoVerde]}
            onPress={irParaDiario}
            activeOpacity={0.85}
          >
            <View style={estilos.atalhoIconeWrapper}>
              <Feather
                name="book-open"
                size={22}
                color={ShelloTema.cores.marca}
              />
            </View>
            <Text style={estilos.atalhoTitulo}>Escrever{'\n'}no Diário</Text>
            <Text style={estilos.atalhoSubtexto}>Registre seu dia</Text>
          </TouchableOpacity>

          {/* Atalho — Conversar com Shello */}
          <TouchableOpacity
            style={[estilos.cardAtalho, estilos.cardAtalhoTerracota]}
            onPress={irParaChat}
            activeOpacity={0.85}
          >
            <View style={estilos.atalhoIconeWrapper}>
              <Feather
                name="zap"
                size={22}
                color="#B5856A"
              />
            </View>
            <Text style={[estilos.atalhoTitulo, estilos.atalhoTituloTerracota]}>
              Conversar{'\n'}com Shello
            </Text>
            <Text style={estilos.atalhoSubtexto}>Bater um papo</Text>
          </TouchableOpacity>
        </View>

        {/* Espaço inferior para o FAB não cobrir conteúdo */}
        <View style={estilos.espacamentoInferior} />
      </ScrollView>

      {/* ── FAB redondo ── */}
      <Animated.View
        style={[estilos.fabWrapper, { transform: [{ scale: escalaFab }] }]}
      >
        <TouchableOpacity
          style={estilos.fab}
          onPress={irParaChat}
          onPressIn={handleFabPressIn}
          onPressOut={handleFabPressOut}
          activeOpacity={1}
        >
          <Feather name="message-circle" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        {/* Ponto laranja de notificação */}
        <View style={estilos.fabNotificacao} />
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const { width: LARGURA_TELA } = Dimensions.get('window');

const estilos = StyleSheet.create({
  // Layout base
  areaSegura: {
    flex: 1,
    backgroundColor: ShelloTema.cores.fundo,
  },
  scroll: {
    flex: 1,
  },
  conteudoScroll: {
    paddingHorizontal: ShelloTema.espacamento.lg,
    paddingTop: ShelloTema.espacamento.md,
    paddingBottom: ShelloTema.espacamento.xl,
  },

  // ── Cabeçalho de data ──
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ShelloTema.espacamento.lg,
  },
  iconeCalendario: {
    marginRight: ShelloTema.espacamento.xs,
  },
  textoData: {
    fontSize: 13,
    color: ShelloTema.cores.textoS,
    fontFamily: Platform.OS === 'android' ? 'Roboto' : 'System',
  },

  // ── Saudação ──
  blocoSaudacao: {
    marginBottom: ShelloTema.espacamento.lg,
  },
  saudacaoLinha1: {
    fontSize: 22,
    fontFamily: 'serif',
    color: ShelloTema.cores.textoS,
    lineHeight: 28,
  },
  saudacaoNome: {
    fontSize: 32,
    fontFamily: 'serif',
    fontWeight: '700',
    color: ShelloTema.cores.textoP,
    lineHeight: 40,
    marginBottom: ShelloTema.espacamento.sm,
  },
  subtitulo: {
    fontSize: 14,
    fontStyle: 'italic',
    color: ShelloTema.cores.textoS,
    lineHeight: 20,
  },

  // ── Badges ──
  filhaBadges: {
    flexDirection: 'row',
    gap: ShelloTema.espacamento.sm,
    marginBottom: ShelloTema.espacamento.lg,
  },
  badge: {
    borderRadius: 50,
    paddingHorizontal: ShelloTema.espacamento.md,
    paddingVertical: ShelloTema.espacamento.sm,
  },
  badgeVerde: {
    backgroundColor: ShelloTema.cores.marcaClaro,
    borderWidth: 1,
    borderColor: ShelloTema.cores.marca,
  },
  badgeTerracota: {
    backgroundColor: ShelloTema.cores.terracota,
  },
  textoBadgeVerde: {
    fontSize: 13,
    color: ShelloTema.cores.marca,
    fontWeight: '600',
  },
  textoBadgeTerracota: {
    fontSize: 13,
    color: '#B5856A',
    fontWeight: '600',
  },

  // ── Card central do diário ──
  cardDiario: {
    backgroundColor: ShelloTema.cores.superficie,
    borderRadius: ShelloTema.forma.bordaGrande,
    padding: ShelloTema.espacamento.lg,
    marginBottom: ShelloTema.espacamento.lg,
    ...ShelloTema.sombra.suave,
  },
  cardCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ShelloTema.espacamento.md,
    gap: ShelloTema.espacamento.sm,
  },
  circuloIcone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ShelloTema.cores.marcaClaro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitulo: {
    fontSize: 18,
    fontFamily: 'serif',
    color: ShelloTema.cores.textoP,
    fontWeight: '600',
  },
  cardPergunta: {
    fontSize: 14,
    color: ShelloTema.cores.textoS,
    lineHeight: 20,
    marginBottom: ShelloTema.espacamento.md,
    fontStyle: 'italic',
  },
  inputNota: {
    backgroundColor: ShelloTema.cores.fundo,
    borderRadius: ShelloTema.forma.bordaPequena,
    padding: ShelloTema.espacamento.md,
    fontSize: 15,
    color: ShelloTema.cores.textoP,
    minHeight: 90,
    lineHeight: 22,
    marginBottom: ShelloTema.espacamento.md,
    textAlignVertical: 'top',
  },
  botaoSalvarNota: {
    alignSelf: 'flex-end',
    backgroundColor: ShelloTema.cores.marca,
    borderRadius: 50,
    paddingHorizontal: ShelloTema.espacamento.md,
    paddingVertical: ShelloTema.espacamento.sm,
  },
  botaoSalvarNotaDesabilitado: {
    opacity: 0.6,
  },
  textoBotaoSalvar: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Cards de atalho ──
  filhaAtalhos: {
    flexDirection: 'row',
    gap: ShelloTema.espacamento.md,
  },
  cardAtalho: {
    flex: 1,
    borderRadius: ShelloTema.forma.bordaMedia,
    padding: ShelloTema.espacamento.md,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  cardAtalhoVerde: {
    backgroundColor: ShelloTema.cores.marcaClaro,
  },
  cardAtalhoTerracota: {
    backgroundColor: ShelloTema.cores.terracota,
  },
  atalhoIconeWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ShelloTema.espacamento.sm,
  },
  atalhoTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: ShelloTema.cores.textoP,
    lineHeight: 20,
    flex: 1,
  },
  atalhoTituloTerracota: {
    color: ShelloTema.cores.textoP,
  },
  atalhoSubtexto: {
    fontSize: 12,
    color: ShelloTema.cores.textoS,
    marginTop: ShelloTema.espacamento.xs,
  },

  // ── FAB ──
  fabWrapper: {
    position: 'absolute',
    bottom: ShelloTema.espacamento.xl,
    right: ShelloTema.espacamento.lg,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ShelloTema.cores.marca,
    alignItems: 'center',
    justifyContent: 'center',
    ...ShelloTema.sombra.media,
  },
  fabNotificacao: {
    position: 'absolute',
    top: 0,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E8895A',
    borderWidth: 1.5,
    borderColor: ShelloTema.cores.fundo,
  },

  // Espaço para o FAB não cobrir conteúdo
  espacamentoInferior: {
    height: 80,
  },
});
