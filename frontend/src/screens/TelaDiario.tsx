// TelaDiario.tsx — Tela do Diário do Shello
// Permite escrever reflexões, visualizar entradas anteriores e salvar memórias da IA

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  Animated,
  KeyboardAvoidingView,
  ActivityIndicator,
  Platform,
  Dimensions,
  ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { ShelloTema } from '../styles/tema';
import { useShello } from '../contexts/ShelloContext';
import { NotaDiario } from '../types';

// ─── Tipos locais ─────────────────────────────────────────────────────────────

// Grupo de notas por período (Hoje, Ontem, Esta semana)
interface GrupoNotas {
  titulo: string;
  dados: NotaDiario[];
}

// Item da lista: pode ser um cabeçalho de seção ou uma nota
type ItemLista =
  | { tipo: 'cabecalho'; titulo: string }
  | { tipo: 'nota'; nota: NotaDiario };

// ─── Utilitários de agrupamento ──────────────────────────────────────────────

// Retorna o início do dia (00:00:00.000)
function inicioDoDia(data: Date): Date {
  const d = new Date(data);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Agrupa as notas em: Hoje, Ontem, Esta semana e retorna lista plana com cabeçalhos
function agruparNotas(notas: NotaDiario[]): ItemLista[] {
  const agora = new Date();
  const hoje = inicioDoDia(agora);
  const ontem = new Date(hoje);
  ontem.setDate(ontem.getDate() - 1);
  const semanaPassada = new Date(hoje);
  semanaPassada.setDate(semanaPassada.getDate() - 7);

  const grupos: GrupoNotas[] = [
    { titulo: 'Hoje', dados: [] },
    { titulo: 'Ontem', dados: [] },
    { titulo: 'Esta semana', dados: [] },
  ];

  notas.forEach((nota) => {
    const dataNota = inicioDoDia(new Date(nota.dataCriacao));
    if (dataNota.getTime() === hoje.getTime()) {
      grupos[0].dados.push(nota);
    } else if (dataNota.getTime() === ontem.getTime()) {
      grupos[1].dados.push(nota);
    } else if (dataNota >= semanaPassada) {
      grupos[2].dados.push(nota);
    }
  });

  // Monta a lista plana com cabeçalhos e notas intercaladas
  const lista: ItemLista[] = [];
  grupos.forEach((grupo) => {
    if (grupo.dados.length > 0) {
      lista.push({ tipo: 'cabecalho', titulo: grupo.titulo });
      grupo.dados.forEach((nota) =>
        lista.push({ tipo: 'nota', nota })
      );
    }
  });

  return lista;
}

// Formata data/hora em português para exibir no card da nota
function formatarDataNota(isoString: string): string {
  const data = new Date(isoString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(data);
}

// ─── Componente de Card de Nota ───────────────────────────────────────────────

interface CardNotaProps {
  nota: NotaDiario;
}

function CardNota({ nota }: CardNotaProps) {
  return (
    <View style={estilos.cardNota}>
      <Text style={estilos.cardNotaTexto} numberOfLines={3}>
        {nota.conteudo}
      </Text>
      <Text style={estilos.cardNotaData}>{formatarDataNota(nota.dataCriacao)}</Text>
    </View>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function TelaDiario() {
  const { notas, adicionarNota, adicionarMemoria } = useShello();

  // Estado do editor
  const [textoReflexao, setTextoReflexao] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Estado do modal de insights
  const [modalVisivel, setModalVisivel] = useState(false);

  // Animação de slide do modal vinda de baixo para cima
  const transicaoModal = useRef(new Animated.Value(0)).current;

  // ─── Handlers ────────────────────────────────────────────────────────────

  // Abre o modal com animação
  const abrirModal = useCallback(() => {
    setModalVisivel(true);
    Animated.spring(transicaoModal, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [transicaoModal]);

  // Fecha o modal com animação de saída
  const fecharModal = useCallback(() => {
    Animated.timing(transicaoModal, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setModalVisivel(false));
  }, [transicaoModal]);

  // Salva reflexão: mostra indicador, chama serviço e abre modal de insight
  async function handleSalvarReflexao() {
    if (!textoReflexao.trim() || salvando) return;

    setSalvando(true);

    // Simula processamento de 1.5s (como especificado)
    await new Promise<void>((resolve) => setTimeout(resolve, 1500));

    try {
      await adicionarNota(textoReflexao.trim());
      setTextoReflexao('');
      abrirModal();
    } finally {
      setSalvando(false);
    }
  }

  // Salva a memória mockada e fecha o modal
  async function handleGuardarMemoria() {
    await adicionarMemoria(
      '✨ Você valoriza momentos de tranquilidade e reflexão',
      'PREFERENCIA'
    );
    fecharModal();
  }

  // ─── Renderização da lista plana ─────────────────────────────────────────

  const itensLista: ItemLista[] = agruparNotas(notas);

  // Cabeçalho da FlatList — contém o editor + botão de salvar
  const renderCabecalhoLista = useCallback(
    () => (
      <View>
        {/* ── Título da tela ── */}
        <View style={estilos.cabecalhoTela}>
          <Text style={estilos.tituloDiario}>Meu Diário</Text>
          <Feather name="edit-3" size={24} color={ShelloTema.cores.textoP} />
        </View>

        {/* ── Área de escrita ── */}
        <View style={estilos.areaEscrita}>
          <TextInput
            style={estilos.inputReflexao}
            value={textoReflexao}
            onChangeText={setTextoReflexao}
            placeholder="Como foi o seu dia? O que você está sentindo?"
            placeholderTextColor={ShelloTema.cores.textoS}
            multiline
            textAlignVertical="top"
          />
          {/* Borda inferior decorativa */}
          <View style={estilos.bordaInferiorInput} />
        </View>

        {/* ── Botão salvar reflexão ── */}
        <TouchableOpacity
          style={[estilos.botaoSalvar, salvando && estilos.botaoSalvarDesabilitado]}
          onPress={handleSalvarReflexao}
          disabled={salvando}
          activeOpacity={0.82}
        >
          {salvando ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={estilos.textoBotaoSalvar}>Salvar reflexão</Text>
          )}
        </TouchableOpacity>

        {/* ── Separador de seção ── */}
        {itensLista.length > 0 && (
          <Text style={estilos.tituloSecaoEntradas}>Entradas anteriores</Text>
        )}
      </View>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [textoReflexao, salvando, itensLista.length]
  );

  // Renderiza cada item da lista plana (cabeçalho de grupo ou card de nota)
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ItemLista>) => {
      if (item.tipo === 'cabecalho') {
        return <Text style={estilos.cabecalhoGrupo}>{item.titulo}</Text>;
      }
      return <CardNota nota={item.nota} />;
    },
    []
  );

  const keyExtractor = useCallback(
    (item: ItemLista, index: number) =>
      item.tipo === 'cabecalho' ? `cabecalho-${item.titulo}` : item.nota.id || String(index),
    []
  );

  // ─── Interpolação da animação do modal ──────────────────────────────────

  const { height: ALTURA_TELA } = Dimensions.get('window');

  const translateYModal = transicaoModal.interpolate({
    inputRange: [0, 1],
    outputRange: [ALTURA_TELA, 0],
  });

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={estilos.areaSegura} edges={['top']}>
      <KeyboardAvoidingView
        style={estilos.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Lista principal com cabeçalho embutido */}
        <FlatList<ItemLista>
          data={itensLista}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={renderCabecalhoLista}
          contentContainerStyle={estilos.conteudoLista}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={estilos.listaVazia}>
              <Feather
                name="book-open"
                size={36}
                color={ShelloTema.cores.marcaClaro}
              />
              <Text style={estilos.textoListaVazia}>
                Nenhuma entrada ainda.{'\n'}Escreva sua primeira reflexão!
              </Text>
            </View>
          }
        />
      </KeyboardAvoidingView>

      {/* ── Modal de Insights da IA ── */}
      <Modal
        transparent
        visible={modalVisivel}
        animationType="none"
        onRequestClose={fecharModal}
        statusBarTranslucent
      >
        {/* Fundo escuro semi-transparente */}
        <TouchableOpacity
          style={estilos.modalOverlay}
          activeOpacity={1}
          onPress={fecharModal}
        >
          {/* Card branco animado vindo de baixo */}
          <Animated.View
            style={[
              estilos.modalCard,
              { transform: [{ translateY: translateYModal }] },
            ]}
          >
            {/* Impede que toques no card fechem o modal */}
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              {/* Barra decorativa de arrasto */}
              <View style={estilos.modalAlca} />

              {/* Ícone e título do insight */}
              <View style={estilos.modalCabecalho}>
                <View style={estilos.modalCirculoIcone}>
                  <Feather
                    name="cpu"
                    size={22}
                    color={ShelloTema.cores.marca}
                  />
                </View>
                <Text style={estilos.modalTituloIA}>
                  Shello identificou algo sobre você:
                </Text>
              </View>

              {/* Memória mockada */}
              <View style={estilos.modalMemoriaContainer}>
                <Text style={estilos.modalTextoMemoria}>
                  ✨ Você valoriza momentos de tranquilidade e reflexão
                </Text>
              </View>

              {/* Botão — Guardar memória */}
              <TouchableOpacity
                style={estilos.botaoGuardar}
                onPress={handleGuardarMemoria}
                activeOpacity={0.82}
              >
                <Text style={estilos.textoBotaoGuardar}>Guardar memória</Text>
              </TouchableOpacity>

              {/* Botão — Ignorar */}
              <TouchableOpacity
                style={estilos.botaoIgnorar}
                onPress={fecharModal}
                activeOpacity={0.7}
              >
                <Text style={estilos.textoBotaoIgnorar}>Ignorar</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  // Layout base
  areaSegura: {
    flex: 1,
    backgroundColor: ShelloTema.cores.superficie,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  conteudoLista: {
    paddingHorizontal: ShelloTema.espacamento.lg,
    paddingBottom: ShelloTema.espacamento.xl,
  },

  // ── Cabeçalho da tela ──
  cabecalhoTela: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: ShelloTema.espacamento.md,
    marginBottom: ShelloTema.espacamento.lg,
  },
  tituloDiario: {
    fontSize: 28,
    fontFamily: 'serif',
    fontWeight: '700',
    color: ShelloTema.cores.textoP,
  },

  // ── Área de escrita ──
  areaEscrita: {
    marginBottom: ShelloTema.espacamento.md,
  },
  inputReflexao: {
    fontSize: 16,
    color: ShelloTema.cores.textoP,
    lineHeight: 26,
    minHeight: 200,
    backgroundColor: 'transparent',
    textAlignVertical: 'top',
    paddingVertical: ShelloTema.espacamento.sm,
  },
  bordaInferiorInput: {
    height: 1.5,
    backgroundColor: ShelloTema.cores.marcaClaro,
    marginTop: ShelloTema.espacamento.xs,
  },

  // ── Botão salvar reflexão ──
  botaoSalvar: {
    backgroundColor: ShelloTema.cores.marca,
    borderRadius: 50,
    paddingVertical: ShelloTema.espacamento.md,
    paddingHorizontal: ShelloTema.espacamento.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ShelloTema.espacamento.xl,
    minHeight: 52,
    ...ShelloTema.sombra.suave,
  },
  botaoSalvarDesabilitado: {
    opacity: 0.65,
  },
  textoBotaoSalvar: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // ── Seção de entradas ──
  tituloSecaoEntradas: {
    fontSize: 13,
    fontWeight: '700',
    color: ShelloTema.cores.textoS,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: ShelloTema.espacamento.md,
  },

  // ── Cabeçalho de grupo (Hoje, Ontem, Esta semana) ──
  cabecalhoGrupo: {
    fontSize: 14,
    fontWeight: '700',
    color: ShelloTema.cores.marca,
    marginTop: ShelloTema.espacamento.md,
    marginBottom: ShelloTema.espacamento.sm,
    fontFamily: 'serif',
  },

  // ── Card de nota ──
  cardNota: {
    backgroundColor: ShelloTema.cores.superficie,
    borderRadius: ShelloTema.forma.bordaPequena,
    padding: ShelloTema.espacamento.md,
    marginBottom: ShelloTema.espacamento.sm,
    borderWidth: 1,
    borderColor: ShelloTema.cores.marcaClaro,
    ...ShelloTema.sombra.suave,
  },
  cardNotaTexto: {
    fontSize: 14,
    color: ShelloTema.cores.textoP,
    lineHeight: 22,
    marginBottom: ShelloTema.espacamento.sm,
  },
  cardNotaData: {
    fontSize: 12,
    color: ShelloTema.cores.textoS,
  },

  // ── Lista vazia ──
  listaVazia: {
    alignItems: 'center',
    paddingVertical: ShelloTema.espacamento.xl,
    gap: ShelloTema.espacamento.md,
  },
  textoListaVazia: {
    fontSize: 14,
    color: ShelloTema.cores.textoS,
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Modal overlay ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },

  // ── Card do modal ──
  modalCard: {
    backgroundColor: ShelloTema.cores.superficie,
    borderTopLeftRadius: ShelloTema.forma.bordaMedia,
    borderTopRightRadius: ShelloTema.forma.bordaMedia,
    paddingHorizontal: ShelloTema.espacamento.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : ShelloTema.espacamento.xl,
    paddingTop: ShelloTema.espacamento.md,
  },

  // Barra de arrasto decorativa
  modalAlca: {
    width: 40,
    height: 4,
    backgroundColor: ShelloTema.cores.marcaClaro,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: ShelloTema.espacamento.lg,
  },

  // Cabeçalho do modal
  modalCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ShelloTema.espacamento.sm,
    marginBottom: ShelloTema.espacamento.lg,
  },
  modalCirculoIcone: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ShelloTema.cores.marcaClaro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTituloIA: {
    fontSize: 15,
    fontWeight: '600',
    color: ShelloTema.cores.textoP,
    flex: 1,
    lineHeight: 20,
  },

  // Bloco da memória mockada
  modalMemoriaContainer: {
    backgroundColor: ShelloTema.cores.fundo,
    borderRadius: ShelloTema.forma.bordaPequena,
    padding: ShelloTema.espacamento.md,
    marginBottom: ShelloTema.espacamento.lg,
    borderLeftWidth: 3,
    borderLeftColor: ShelloTema.cores.marca,
  },
  modalTextoMemoria: {
    fontSize: 15,
    color: ShelloTema.cores.textoP,
    lineHeight: 22,
    fontStyle: 'italic',
  },

  // Botão — Guardar memória
  botaoGuardar: {
    backgroundColor: ShelloTema.cores.marca,
    borderRadius: 50,
    paddingVertical: ShelloTema.espacamento.md,
    alignItems: 'center',
    marginBottom: ShelloTema.espacamento.sm,
    ...ShelloTema.sombra.suave,
  },
  textoBotaoGuardar: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  // Botão — Ignorar
  botaoIgnorar: {
    paddingVertical: ShelloTema.espacamento.md,
    alignItems: 'center',
  },
  textoBotaoIgnorar: {
    fontSize: 15,
    color: ShelloTema.cores.textoS,
  },
});
