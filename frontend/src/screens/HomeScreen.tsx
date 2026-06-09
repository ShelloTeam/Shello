// HomeScreen.tsx — Tela inicial limpa do Shello
// Saudação personalizada, badges de progresso e atalhos rápidos (sem input inline)

import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { ShelloTema } from '../styles/tema';
import { useShello } from '../contexts/ShelloContext';

// ─── Constantes de cor terracota (tokens pendentes no ShelloTema) ─────────────
// TODO: mover para ShelloTema quando os tokens forem oficializados
const COR_TERRACOTA_ICONE = '#B5856A';
const COR_TERRACOTA_TITULO = '#8B5E4A';
const COR_TERRACOTA_TEXTO = '#B5856A';

// ─── Tipo da navegação raiz (Bottom Tabs) ────────────────────────────────────
type RootTabNavigation = BottomTabNavigationProp<{
  DiarioTab: undefined;
  TarefasTab: undefined;
  ChatTab: undefined;
  HomeTab: undefined;
}>;

// ─── Utilitário de data em português ──────────────────────────────────────────

function formatarDataPtBR(): string {
  const agora = new Date();
  const diaFormatado = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(agora);
  return diaFormatado.charAt(0).toUpperCase() + diaFormatado.slice(1);
}

// ─── Streak: dias consecutivos com entrada no diário ─────────────────────────

function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function calcularDiasSequencia(entradas: { dataCriacao: string }[]): number {
  if (entradas.length === 0) return 0;

  const diasComEntrada = new Set(
    entradas.map((e) => localDateKey(new Date(e.dataCriacao)))
  );

  const hoje = new Date();
  const hojeKey = localDateKey(hoje);
  const ontemKey = localDateKey(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 1));

  // Streak começa hoje se já tem entrada, senão começa ontem (ainda no prazo)
  const inicio = diasComEntrada.has(hojeKey) ? 0 : 1;
  if (inicio === 1 && !diasComEntrada.has(ontemKey)) return 0;

  let streak = 0;
  for (let i = inicio; i < 365; i++) {
    const dia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - i);
    if (diasComEntrada.has(localDateKey(dia))) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// ─── Saudação baseada no horário ──────────────────────────────────────────────

function obterSaudacao(): string {
  const hora = new Date().getHours();
  if (hora >= 5 && hora < 12) return 'Bom dia,';
  if (hora >= 12 && hora < 18) return 'Boa tarde,';
  return 'Boa noite,';
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function HomeScreen() {
  const { nomeUsuario, entradas } = useShello();
  const navigation = useNavigation<RootTabNavigation>();

  // Animação de pressão no FAB
  const escalaFab = useRef(new Animated.Value(1)).current;

  const dataFormatada = formatarDataPtBR();
  const saudacao = obterSaudacao();
  const nome = nomeUsuario || 'Amigo';
  const totalEntradas = entradas.length;
  const diasSequencia = calcularDiasSequencia(entradas);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleFabPressIn = useCallback(() => {
    Animated.spring(escalaFab, {
      toValue: 0.88,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  }, [escalaFab]);

  const handleFabPressOut = useCallback(() => {
    Animated.spring(escalaFab, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  }, [escalaFab]);

  const irParaDiario = useCallback(() => navigation.navigate('DiarioTab'), [navigation]);
  const irParaTarefas = useCallback(() => navigation.navigate('TarefasTab'), [navigation]);
  const irParaChat = useCallback(() => navigation.navigate('ChatTab'), [navigation]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={estilos.areaSegura} edges={['top']}>
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
          />
          <Text style={estilos.textoData}>{dataFormatada}</Text>
        </View>

        {/* ── Saudação em 2 linhas ── */}
        <View style={estilos.blocoSaudacao}>
          <Text style={estilos.saudacaoLinha1}>{saudacao}</Text>
          <Text style={estilos.saudacaoNome}>{nome} 🌿</Text>
          <Text style={estilos.subtitulo}>
            Sua mente é um jardim. Nutra-a diariamente.
          </Text>
        </View>

        {/* ── Badges pill lado a lado ── */}
        <View style={estilos.filhaBadges}>
          <View style={[estilos.badge, estilos.badgeVerde]}>
            <Text style={estilos.textoBadgeVerde}>🔥 {diasSequencia} {diasSequencia === 1 ? 'dia seguido' : 'dias seguidos'}</Text>
          </View>
          <View style={[estilos.badge, estilos.badgeTerracota]}>
            <Text style={estilos.textoBadgeTerracota}>
              ✍️ {totalEntradas} {totalEntradas === 1 ? 'entrada' : 'entradas'}
            </Text>
          </View>
        </View>

        {/* ── Seção de atalhos rápidos ── */}
        <Text style={estilos.secaoTitulo}>Atalhos rápidos</Text>
        <View style={estilos.filhaAtalhos}>
          {/* Card — Diário */}
          <TouchableOpacity
            style={[estilos.cardAtalho, estilos.cardAtalhoVerde]}
            onPress={irParaDiario}
            activeOpacity={0.85}
            accessible
            accessibilityLabel="Ir para o Diário"
            accessibilityRole="button"
          >
            <View style={[estilos.circuloIcone, estilos.circuloIconeVerde]}>
              <Feather
                name="book-open"
                size={24}
                color={ShelloTema.cores.marca}
              />
            </View>
            <Text style={estilos.atalhoTitulo}>Diário</Text>
            <Text style={estilos.atalhoSubtexto}>Registre seus pensamentos</Text>
          </TouchableOpacity>

          {/* Card — Tarefas */}
          <TouchableOpacity
            style={[estilos.cardAtalho, estilos.cardAtalhoTerracota]}
            onPress={irParaTarefas}
            activeOpacity={0.85}
            accessible
            accessibilityLabel="Ir para Tarefas"
            accessibilityRole="button"
          >
            <View style={[estilos.circuloIcone, estilos.circuloIconeTerracota]}>
              <Feather
                name="check-square"
                size={24}
                color={COR_TERRACOTA_ICONE}
              />
            </View>
            <Text style={[estilos.atalhoTitulo, estilos.atalhoTituloTerracota]}>
              Tarefas
            </Text>
            <Text style={estilos.atalhoSubtexto}>Organize sua rotina</Text>
          </TouchableOpacity>
        </View>

        {/* Espaço inferior para o FAB não cobrir conteúdo */}
        <View style={estilos.espacamentoInferior} />
      </ScrollView>

      {/* ── FAB com logo da tartaruga ── */}
      <Animated.View
        style={[estilos.fabWrapper, { transform: [{ scale: escalaFab }] }]}
      >
        <TouchableOpacity
          style={estilos.fab}
          onPress={irParaChat}
          onPressIn={handleFabPressIn}
          onPressOut={handleFabPressOut}
          activeOpacity={1}
          accessible
          accessibilityLabel="Abrir chat com Shello"
          accessibilityRole="button"
        >
          <Image
            source={require('../../assets/logoshello.jpeg')}
            style={estilos.fabImagem}
            resizeMode="cover"
          />
        </TouchableOpacity>
        {/* Ponto laranja de notificação */}
        <View style={estilos.fabNotificacao} />
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

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
    gap: ShelloTema.espacamento.sm,
    marginBottom: ShelloTema.espacamento.lg,
  },
  textoData: {
    fontSize: 13,
    color: ShelloTema.cores.textoS,
    letterSpacing: 0.2,
  },

  // ── Saudação ──
  blocoSaudacao: {
    marginBottom: ShelloTema.espacamento.lg,
  },
  saudacaoLinha1: {
    fontSize: 28,
    fontFamily: ShelloTema.tipografia.titulo,
    color: ShelloTema.cores.textoS,
    lineHeight: 36,
  },
  saudacaoNome: {
    fontSize: 28,
    fontFamily: ShelloTema.tipografia.titulo,
    fontWeight: ShelloTema.tipografia.pesos.negrito,
    color: ShelloTema.cores.textoP,
    lineHeight: 38,
    marginBottom: ShelloTema.espacamento.sm,
  },
  subtitulo: {
    fontSize: ShelloTema.tipografia.tamanhos.pequeno,
    fontStyle: 'italic',
    color: ShelloTema.cores.textoS,
    lineHeight: ShelloTema.tipografia.alturaLinha,
  },

  // ── Badges ──
  filhaBadges: {
    flexDirection: 'row',
    gap: ShelloTema.espacamento.sm,
    marginBottom: ShelloTema.espacamento.xl,
    flexWrap: 'wrap',
  },
  badge: {
    borderRadius: ShelloTema.forma.bordaPill,
    paddingHorizontal: ShelloTema.espacamento.md,
    paddingVertical: 6,
  },
  badgeVerde: {
    backgroundColor: ShelloTema.cores.marcaClaro,
    borderWidth: 1,
    borderColor: ShelloTema.cores.marca,
  },
  badgeTerracota: {
    backgroundColor: ShelloTema.cores.terracota,
    borderWidth: 1,
    borderColor: '#D4A896',
  },
  textoBadgeVerde: {
    fontSize: ShelloTema.tipografia.tamanhos.minusculo,
    color: ShelloTema.cores.marca,
    fontWeight: ShelloTema.tipografia.pesos.medio,
    letterSpacing: 0.2,
  },
  textoBadgeTerracota: {
    fontSize: ShelloTema.tipografia.tamanhos.minusculo,
    color: COR_TERRACOTA_TEXTO,
    fontWeight: ShelloTema.tipografia.pesos.medio,
    letterSpacing: 0.2,
  },

  // ── Seção de atalhos ──
  secaoTitulo: {
    fontSize: ShelloTema.tipografia.tamanhos.pequeno,
    fontWeight: ShelloTema.tipografia.pesos.medio,
    color: ShelloTema.cores.textoS,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: ShelloTema.espacamento.md,
  },
  filhaAtalhos: {
    flexDirection: 'row',
    gap: ShelloTema.espacamento.md,
  },
  cardAtalho: {
    flex: 1,
    borderRadius: ShelloTema.forma.bordaMedia,
    padding: ShelloTema.espacamento.lg,
    minHeight: 160,
    justifyContent: 'flex-end',
    ...ShelloTema.sombra.suave,
  },
  cardAtalhoVerde: {
    backgroundColor: ShelloTema.cores.marcaClaro,
  },
  cardAtalhoTerracota: {
    backgroundColor: ShelloTema.cores.terracota,
  },

  // Círculo com ícone no topo do card
  circuloIcone: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ShelloTema.espacamento.md,
  },
  circuloIconeVerde: {
    backgroundColor: 'rgba(94, 131, 106, 0.15)',
  },
  circuloIconeTerracota: {
    backgroundColor: 'rgba(181, 133, 106, 0.15)',
  },

  atalhoTitulo: {
    fontSize: ShelloTema.tipografia.tamanhos.medio,
    fontWeight: ShelloTema.tipografia.pesos.negrito,
    color: ShelloTema.cores.textoP,
    marginBottom: 4,
  },
  atalhoTituloTerracota: {
    color: COR_TERRACOTA_TITULO,
  },
  atalhoSubtexto: {
    fontSize: ShelloTema.tipografia.tamanhos.minusculo,
    color: ShelloTema.cores.textoS,
    lineHeight: 16,
  },

  // ── FAB com logo ──
  fabWrapper: {
    position: 'absolute',
    bottom: ShelloTema.espacamento.xl,
    right: ShelloTema.espacamento.lg,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    ...ShelloTema.sombra.media,
  },
  fabImagem: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  fabNotificacao: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#E8895A',
    borderWidth: 2,
    borderColor: ShelloTema.cores.fundo,
  },

  // Espaço para o FAB não cobrir conteúdo
  espacamentoInferior: {
    height: 90,
  },
});
