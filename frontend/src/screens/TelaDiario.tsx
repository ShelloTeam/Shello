// TelaDiario.tsx — Lista de entradas do Diário (v3)
// Exibe todas as entradas agrupadas por data + botão "Nova Entrada"
// Regra 4.3: entradas >100 chars exibem indicador pulsante "Shello está lendo..." por ~5s

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Animated,
  ListRenderItemInfo,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ShelloTema } from '../styles/tema';
import { useShello } from '../contexts/ShelloContext';
import { EntradaDiario } from '../types';
import { DiarioStackParamList } from '../navigation/NavegacaoDiario';

// ─── Constantes ────────────────────────────────────────────────────────────────

const DURACAO_IA_LENDO_MS = 5000;

// ─── Tipos locais ──────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<DiarioStackParamList, 'ListaEntradas'>;

interface GrupoEntradas {
  titulo: string;
  dados: EntradaDiario[];
}

type ItemLista =
  | { tipo: 'cabecalho'; titulo: string }
  | { tipo: 'entrada'; entrada: EntradaDiario; iaLendo: boolean };

// ─── Utilitários ───────────────────────────────────────────────────────────────

function inicioDoDia(data: Date): Date {
  const d = new Date(data);
  d.setHours(0, 0, 0, 0);
  return d;
}

function agruparEntradas(
  entradas: EntradaDiario[],
  idIaLendo: string | null
): ItemLista[] {
  const agora = new Date();
  const hoje = inicioDoDia(agora);
  const ontem = new Date(hoje);
  ontem.setDate(ontem.getDate() - 1);
  const semanaAtras = new Date(hoje);
  semanaAtras.setDate(semanaAtras.getDate() - 7);

  const grupos: GrupoEntradas[] = [
    { titulo: 'Hoje', dados: [] },
    { titulo: 'Ontem', dados: [] },
    { titulo: 'Semana Passada', dados: [] },
    { titulo: 'Mais Antigas', dados: [] },
  ];

  entradas.forEach((entrada) => {
    const dataEntrada = inicioDoDia(new Date(entrada.dataCriacao));
    if (dataEntrada.getTime() === hoje.getTime()) {
      grupos[0].dados.push(entrada);
    } else if (dataEntrada.getTime() === ontem.getTime()) {
      grupos[1].dados.push(entrada);
    } else if (dataEntrada >= semanaAtras) {
      grupos[2].dados.push(entrada);
    } else {
      grupos[3].dados.push(entrada);
    }
  });

  const lista: ItemLista[] = [];
  grupos.forEach((grupo) => {
    if (grupo.dados.length > 0) {
      lista.push({ tipo: 'cabecalho', titulo: grupo.titulo });
      grupo.dados.forEach((entrada) =>
        lista.push({
          tipo: 'entrada',
          entrada,
          iaLendo: entrada.id === idIaLendo,
        })
      );
    }
  });

  return lista;
}

function formatarDataEntrada(isoString: string): string {
  const data = new Date(isoString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(data);
}

// ─── Componente: Indicador de Pulse da IA ─────────────────────────────────────

function PulseIALendo() {
  const opacidade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacidade, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacidade, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacidade]);

  return (
    <Animated.View style={[estilos.iaLendoContainer, { opacity: opacidade }]}>
      <Feather
        name="cpu"
        size={11}
        color={ShelloTema.cores.marca}
        style={estilos.iaLendoIcone}
      />
      <Text style={estilos.iaLendoTexto}>Shello está lendo...</Text>
    </Animated.View>
  );
}

// ─── Componente: Card de Entrada ──────────────────────────────────────────────

interface CardEntradaProps {
  entrada: EntradaDiario;
  iaLendo: boolean;
  onPress: () => void;
}

function CardEntrada({ entrada, iaLendo, onPress }: CardEntradaProps) {
  const preview = entrada.conteudo.slice(0, 80) +
    (entrada.conteudo.length > 80 ? '...' : '');

  return (
    <TouchableOpacity
      style={estilos.cardEntrada}
      onPress={onPress}
      activeOpacity={0.78}
      accessibilityLabel={`Entrada: ${entrada.titulo}`}
      accessibilityRole="button"
    >
      {/* Título da entrada */}
      <Text style={estilos.cardEntradaTitulo} numberOfLines={1}>
        {entrada.titulo}
      </Text>

      {/* Preview do conteúdo */}
      <Text style={estilos.cardEntradaTexto} numberOfLines={2}>
        {preview}
      </Text>

      {/* Rodapé: data + badge de contexto */}
      <View style={estilos.cardEntradaRodape}>
        <Text style={estilos.cardEntradaData}>
          {formatarDataEntrada(entrada.dataCriacao)}
        </Text>
        {entrada.adicionadaAoContexto && (
          <View style={estilos.badgeContexto}>
            <Feather
              name="check-circle"
              size={10}
              color={ShelloTema.cores.marca}
            />
            <Text style={estilos.badgeContextoTexto}>No contexto do Shello</Text>
          </View>
        )}
      </View>

      {/* Indicador de IA lendo */}
      {iaLendo && <PulseIALendo />}
    </TouchableOpacity>
  );
}

// ─── Componente: Estado Vazio ──────────────────────────────────────────────────

interface EstadoVazioProps {
  onNova: () => void;
}

function EstadoVazio({ onNova }: EstadoVazioProps) {
  return (
    <View style={estilos.vazioContainer}>
      <View style={estilos.vazioIconeCirculo}>
        <Feather name="book" size={36} color={ShelloTema.cores.marca} />
      </View>
      <Text style={estilos.vazioTitulo}>Seu diário está em branco</Text>
      <Text style={estilos.vazioSubtitulo}>
        Registre seus pensamentos, sentimentos e reflexões. Cada entrada é
        um passo na sua jornada.
      </Text>
      <TouchableOpacity
        style={estilos.vazioButtonCTA}
        onPress={onNova}
        activeOpacity={0.82}
        accessibilityLabel="Escrever primeira entrada no diário"
        accessibilityRole="button"
      >
        <Feather name="edit-3" size={16} color="#FFFFFF" style={estilos.vazioButtonIcone} />
        <Text style={estilos.vazioButtonTexto}>Escrever primeira entrada</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Componente: Estado Nenhum Resultado ───────────────────────────────────────

interface EstadoNenhumResultadoProps {
  busca: string;
  filtroAtivo: string;
  onLimpar: () => void;
}

function EstadoNenhumResultado({ busca, filtroAtivo, onLimpar }: EstadoNenhumResultadoProps) {
  return (
    <View style={estilos.vazioContainer}>
      <View style={estilos.vazioIconeCirculo}>
        <Feather name="search" size={36} color={ShelloTema.cores.textoS} />
      </View>
      <Text style={estilos.vazioTitulo}>Nenhuma entrada encontrada</Text>
      <Text style={estilos.vazioSubtitulo}>
        Não encontramos nenhuma reflexão com {busca ? `"${busca}"` : 'esse filtro'}. Tente ajustar sua busca ou limpar os filtros.
      </Text>
      <TouchableOpacity
        style={estilos.vazioButtonCTA}
        onPress={onLimpar}
        activeOpacity={0.82}
      >
        <Text style={estilos.vazioButtonTexto}>Limpar filtros e busca</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function TelaDiario({ navigation }: Props) {
  const { entradas } = useShello();

  // ID da entrada que está com "IA lendo" (gerenciado via param de retorno)
  const [idIaLendo, setIdIaLendo] = useState<string | null>(null);
  const timerIaLendo = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Limpa o timer ao desmontar
  useEffect(() => {
    return () => {
      if (timerIaLendo.current) clearTimeout(timerIaLendo.current);
    };
  }, []);

  // Escuta quando uma nova entrada foi criada (via route params)
  const dispararIaLendo = useCallback((entradaId: string) => {
    setIdIaLendo(entradaId);
    if (timerIaLendo.current) clearTimeout(timerIaLendo.current);
    timerIaLendo.current = setTimeout(() => {
      setIdIaLendo(null);
    }, DURACAO_IA_LENDO_MS);
  }, []);

  // Navegar para nova entrada
  const handleNovaEntrada = useCallback(() => {
    navigation.navigate('EntradaDiario', { nova: true });
  }, [navigation]);

  // Navegar para editar entrada existente
  const handleAbrirEntrada = useCallback(
    (entrada: EntradaDiario) => {
      navigation.navigate('EntradaDiario', { entrada });
    },
    [navigation]
  );

  // Escuta quando uma nova entrada foi criada (via route params)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const params = navigation.getState().routes.find(
        (r) => r.name === 'ListaEntradas'
      )?.params as { novaEntradaId?: string } | undefined;

      if (params?.novaEntradaId) {
        const entrada = entradas.find((e) => e.id === params.novaEntradaId);
        if (entrada && entrada.conteudo.length > 100) {
          dispararIaLendo(entrada.id);
        }
      }
    });
    return unsubscribe;
  }, [navigation, entradas, dispararIaLendo]);

  // ─── Busca e Filtros ────────────────────────────────────────────────────────

  const [busca, setBusca] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState<'todas' | 'contexto' | 'hoje' | 'ontem' | 'semana' | 'antigas'>('todas');

  const handleLimparFiltros = useCallback(() => {
    setBusca('');
    setFiltroAtivo('todas');
  }, []);

  const entradasFiltradas = useMemo(() => {
    return entradas.filter((entrada) => {
      // 1. Filtro de busca
      const matchBusca =
        entrada.titulo.toLowerCase().includes(busca.toLowerCase()) ||
        entrada.conteudo.toLowerCase().includes(busca.toLowerCase());

      if (!matchBusca) return false;

      // 2. Filtro de período/categoria
      if (filtroAtivo === 'todas') return true;
      if (filtroAtivo === 'contexto') return !!entrada.adicionadaAoContexto;

      const dataEntrada = inicioDoDia(new Date(entrada.dataCriacao));
      const agora = new Date();
      const hoje = inicioDoDia(agora);
      const ontem = new Date(hoje);
      ontem.setDate(ontem.getDate() - 1);
      const semanaAtras = new Date(hoje);
      semanaAtras.setDate(semanaAtras.getDate() - 7);

      if (filtroAtivo === 'hoje') {
        return dataEntrada.getTime() === hoje.getTime();
      }
      if (filtroAtivo === 'ontem') {
        return dataEntrada.getTime() === ontem.getTime();
      }
      if (filtroAtivo === 'semana') {
        return dataEntrada >= semanaAtras;
      }
      if (filtroAtivo === 'antigas') {
        return dataEntrada < semanaAtras;
      }

      return true;
    });
  }, [entradas, busca, filtroAtivo]);

  // ─── Lista plana com cabeçalhos ────────────────────────────────────────────

  const itensLista: ItemLista[] = agruparEntradas(entradasFiltradas, idIaLendo);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ItemLista>) => {
      if (item.tipo === 'cabecalho') {
        return (
          <View style={estilos.cabecalhoGrupoContainer}>
            <Text style={estilos.cabecalhoGrupo}>{item.titulo}</Text>
          </View>
        );
      }
      return (
        <CardEntrada
          entrada={item.entrada}
          iaLendo={item.iaLendo}
          onPress={() => handleAbrirEntrada(item.entrada)}
        />
      );
    },
    [handleAbrirEntrada]
  );

  const keyExtractor = useCallback(
    (item: ItemLista, index: number) =>
      item.tipo === 'cabecalho'
        ? `cabecalho-${item.titulo}`
        : item.entrada.id || String(index),
    []
  );

  // ─── Cabeçalho da FlatList ─────────────────────────────────────────────────

  const renderCabecalho = useCallback(
    () => (
      <View style={estilos.cabecalhoTela}>
        {/* Título */}
        <View style={estilos.cabecalhoTitulos}>
          <Text style={estilos.tituloDiario}>Meu Diário</Text>
          <Text style={estilos.subtituloDiario}>Suas reflexões e memórias</Text>
        </View>

        {/* Ícone decorativo */}
        <View style={estilos.cabecalhoIconeContainer}>
          <Feather name="book-open" size={20} color={ShelloTema.cores.marca} />
        </View>
      </View>
    ),
    []
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={estilos.areaSegura} edges={['top']}>
      {/* Botão proeminente "Nova Entrada" fixo no topo */}
      <View style={estilos.barraAcoesTopo}>
        {renderCabecalho()}
        <TouchableOpacity
          style={estilos.botaoNovaEntrada}
          onPress={handleNovaEntrada}
          activeOpacity={0.82}
        >
          <Feather name="plus" size={18} color="#FFFFFF" style={estilos.botaoIcone} />
          <Text style={estilos.botaoNovaEntradaTexto}>Nova Entrada</Text>
        </TouchableOpacity>

        {/* Input de busca */}
        <View style={estilos.containerBusca}>
          <Feather name="search" size={18} color={ShelloTema.cores.textoS} style={estilos.iconeBusca} />
          <TextInput
            style={estilos.inputBusca}
            placeholder="Buscar nas suas reflexões..."
            placeholderTextColor={ShelloTema.cores.textoS}
            value={busca}
            onChangeText={setBusca}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca('')} style={estilos.botaoLimpar}>
              <Feather name="x" size={16} color={ShelloTema.cores.textoS} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtros horizontais */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={estilos.containerFiltros}
          contentContainerStyle={estilos.conteudoFiltros}
        >
          {[
            { id: 'todas', rotulo: 'Todas' },
            { id: 'contexto', rotulo: 'No Contexto' },
            { id: 'hoje', rotulo: 'Hoje' },
            { id: 'ontem', rotulo: 'Ontem' },
            { id: 'semana', rotulo: 'Esta Semana' },
            { id: 'antigas', rotulo: 'Mais Antigas' },
          ].map((opcao) => {
            const ativo = filtroAtivo === opcao.id;
            return (
              <TouchableOpacity
                key={opcao.id}
                onPress={() => setFiltroAtivo(opcao.id as any)}
                style={[
                  estilos.pillFiltro,
                  ativo && estilos.pillFiltroAtivo,
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    estilos.textoPillFiltro,
                    ativo && estilos.textoPillFiltroAtivo,
                  ]}
                >
                  {opcao.rotulo}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Lista de entradas */}
      <FlatList<ItemLista>
        data={itensLista}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={[
          estilos.conteudoLista,
          itensLista.length === 0 && estilos.conteudoListaVazia,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          entradas.length === 0 ? (
            <EstadoVazio onNova={handleNovaEntrada} />
          ) : (
            <EstadoNenhumResultado
              busca={busca}
              filtroAtivo={filtroAtivo}
              onLimpar={handleLimparFiltros}
            />
          )
        }
      />
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  // ── Layout base ──
  areaSegura: {
    flex: 1,
    backgroundColor: ShelloTema.cores.fundo,
  },

  // ── Barra de ações do topo ──
  barraAcoesTopo: {
    paddingHorizontal: ShelloTema.espacamento.lg,
    paddingTop: ShelloTema.espacamento.md,
    paddingBottom: ShelloTema.espacamento.md,
    backgroundColor: ShelloTema.cores.fundo,
  },

  // ── Cabeçalho da tela ──
  cabecalhoTela: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: ShelloTema.espacamento.md,
  },
  cabecalhoTitulos: {
    flex: 1,
  },
  tituloDiario: {
    fontSize: ShelloTema.tipografia.tamanhos.grande,
    fontFamily: ShelloTema.tipografia.titulo,
    fontWeight: ShelloTema.tipografia.pesos.negrito,
    color: ShelloTema.cores.textoP,
    lineHeight: 34,
  },
  subtituloDiario: {
    fontSize: ShelloTema.tipografia.tamanhos.minusculo,
    color: ShelloTema.cores.textoS,
    marginTop: 2,
  },
  cabecalhoIconeContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ShelloTema.cores.marcaClaro,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Botão Nova Entrada ──
  botaoNovaEntrada: {
    backgroundColor: ShelloTema.cores.marca,
    borderRadius: ShelloTema.forma.bordaMedia,
    paddingVertical: ShelloTema.espacamento.md,
    paddingHorizontal: ShelloTema.espacamento.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    ...ShelloTema.sombra.media,
  },
  botaoIcone: {
    marginRight: ShelloTema.espacamento.sm,
  },
  botaoNovaEntradaTexto: {
    color: '#FFFFFF',
    fontSize: ShelloTema.tipografia.tamanhos.normal,
    fontWeight: ShelloTema.tipografia.pesos.negrito,
    letterSpacing: 0.3,
  },

  // ── Lista ──
  conteudoLista: {
    paddingHorizontal: ShelloTema.espacamento.lg,
    paddingBottom: ShelloTema.espacamento.xl,
  },
  conteudoListaVazia: {
    flexGrow: 1,
  },

  // ── Cabeçalho de grupo ──
  cabecalhoGrupoContainer: {
    marginTop: ShelloTema.espacamento.md,
    marginBottom: ShelloTema.espacamento.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ShelloTema.espacamento.sm,
  },
  cabecalhoGrupo: {
    fontSize: ShelloTema.tipografia.tamanhos.pequeno,
    fontWeight: ShelloTema.tipografia.pesos.negrito,
    color: ShelloTema.cores.marca,
    fontFamily: ShelloTema.tipografia.titulo,
    letterSpacing: 0.3,
  },

  // ── Card de entrada ──
  cardEntrada: {
    backgroundColor: ShelloTema.cores.superficie,
    borderRadius: ShelloTema.forma.bordaPequena,
    padding: ShelloTema.espacamento.md,
    marginBottom: ShelloTema.espacamento.sm,
    ...ShelloTema.sombra.suave,
    borderWidth: 1,
    borderColor: ShelloTema.cores.marcaClaro + '60',
  },
  cardEntradaTitulo: {
    fontSize: ShelloTema.tipografia.tamanhos.pequeno,
    fontWeight: ShelloTema.tipografia.pesos.negrito,
    color: ShelloTema.cores.textoP,
    fontFamily: ShelloTema.tipografia.titulo,
    marginBottom: ShelloTema.espacamento.xs,
  },
  cardEntradaTexto: {
    fontSize: ShelloTema.tipografia.tamanhos.pequeno,
    color: ShelloTema.cores.textoS,
    lineHeight: ShelloTema.tipografia.alturaLinha,
    marginBottom: ShelloTema.espacamento.sm,
  },
  cardEntradaRodape: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardEntradaData: {
    fontSize: ShelloTema.tipografia.tamanhos.minusculo,
    color: ShelloTema.cores.textoS,
  },
  badgeContexto: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ShelloTema.cores.marcaClaro,
    borderRadius: ShelloTema.forma.bordaPill,
    paddingHorizontal: ShelloTema.espacamento.sm,
    paddingVertical: 2,
    gap: 3,
  },
  badgeContextoTexto: {
    fontSize: 10,
    color: ShelloTema.cores.marca,
    fontWeight: ShelloTema.tipografia.pesos.medio,
  },

  // ── Indicador de IA lendo ──
  iaLendoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: ShelloTema.espacamento.sm,
    paddingTop: ShelloTema.espacamento.sm,
    borderTopWidth: 1,
    borderTopColor: ShelloTema.cores.marcaClaro,
    gap: 4,
  },
  iaLendoIcone: {
    marginRight: 2,
  },
  iaLendoTexto: {
    fontSize: 11,
    color: ShelloTema.cores.marca,
    fontWeight: ShelloTema.tipografia.pesos.medio,
    fontStyle: 'italic',
  },

  // ── Estado vazio ──
  vazioContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ShelloTema.espacamento.xxl,
    paddingHorizontal: ShelloTema.espacamento.xl,
    gap: ShelloTema.espacamento.md,
  },
  vazioIconeCirculo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ShelloTema.cores.marcaClaro,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ShelloTema.espacamento.sm,
  },
  vazioTitulo: {
    fontSize: ShelloTema.tipografia.tamanhos.medio,
    fontFamily: ShelloTema.tipografia.titulo,
    fontWeight: ShelloTema.tipografia.pesos.negrito,
    color: ShelloTema.cores.textoP,
    textAlign: 'center',
  },
  vazioSubtitulo: {
    fontSize: ShelloTema.tipografia.tamanhos.pequeno,
    color: ShelloTema.cores.textoS,
    textAlign: 'center',
    lineHeight: ShelloTema.tipografia.alturaLinha + 4,
    maxWidth: 280,
  },
  vazioButtonCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ShelloTema.cores.marca,
    borderRadius: ShelloTema.forma.bordaPill,
    paddingVertical: ShelloTema.espacamento.md,
    paddingHorizontal: ShelloTema.espacamento.xl,
    marginTop: ShelloTema.espacamento.sm,
    ...ShelloTema.sombra.suave,
  },
  vazioButtonIcone: {
    marginRight: ShelloTema.espacamento.sm,
  },
  vazioButtonTexto: {
    color: '#FFFFFF',
    fontSize: ShelloTema.tipografia.tamanhos.normal,
    fontWeight: ShelloTema.tipografia.pesos.negrito,
  },
  containerBusca: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ShelloTema.cores.superficie,
    borderRadius: ShelloTema.forma.bordaPill,
    paddingHorizontal: ShelloTema.espacamento.md,
    marginTop: ShelloTema.espacamento.md,
    height: 46,
    borderWidth: 1,
    borderColor: ShelloTema.cores.marcaClaro + '60',
    ...ShelloTema.sombra.suave,
  },
  iconeBusca: {
    marginRight: ShelloTema.espacamento.sm,
  },
  inputBusca: {
    flex: 1,
    height: '100%',
    color: ShelloTema.cores.textoP,
    fontSize: ShelloTema.tipografia.tamanhos.pequeno,
  },
  botaoLimpar: {
    padding: 4,
  },
  containerFiltros: {
    marginTop: ShelloTema.espacamento.sm,
    marginBottom: ShelloTema.espacamento.xs,
  },
  conteudoFiltros: {
    paddingVertical: 6,
    gap: ShelloTema.espacamento.sm,
  },
  pillFiltro: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: ShelloTema.forma.bordaPill,
    backgroundColor: ShelloTema.cores.superficie,
    borderWidth: 1,
    borderColor: ShelloTema.cores.marcaClaro + '40',
    ...ShelloTema.sombra.suave,
  },
  pillFiltroAtivo: {
    backgroundColor: ShelloTema.cores.marca,
    borderColor: ShelloTema.cores.marca,
  },
  textoPillFiltro: {
    fontSize: ShelloTema.tipografia.tamanhos.minusculo,
    color: ShelloTema.cores.textoS,
    fontWeight: ShelloTema.tipografia.pesos.medio,
  },
  textoPillFiltroAtivo: {
    color: '#FFFFFF',
    fontWeight: ShelloTema.tipografia.pesos.negrito,
  },
});
