// TelaTarefas.tsx — Tela "Sua Jornada" do Shello
// Redesenhada conforme ui_ux.md §6 e feedbacks do usuário:
// Título serifado, pills brancas, checkbox animado, badge de atraso com borda
// lateral vermelha, cards de rotina, modal de criação com campo de data.

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
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Animated,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { ShelloTema } from '../styles/tema';
import { useShello } from '../contexts/ShelloContext';
import { Tarefa, Rotina } from '../types';

// ─── Paleta extra ──────────────────────────────────────────────────────────────
const COR_PESSEGO = '#F2D4C8';          // fundo do botão '+' (terracota claro)
const COR_PESSEGO_ICONE = '#A05A44';    // ícone dentro do botão '+' (marrom sage)
const COR_ROTINA_MANHA = '#EEF4F0';    // verde-creme para rotina manhã
const COR_ROTINA_TARDE = '#EADCD6';    // salmão/terracota para rotina tarde
const COR_ROTINA_NOITE = '#E8E4F0';    // lavanda suave para rotina noite

// ─── Utilitário: verifica se uma tarefa está atrasada ─────────────────────────

function estaAtrasada(tarefa: Tarefa): boolean {
  if (!tarefa.data || tarefa.concluida) return false;
  const vencimento = new Date(tarefa.data);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  vencimento.setHours(0, 0, 0, 0);
  return vencimento < hoje;
}

// ─── Utilitário: formata data para exibição ────────────────────────────────────

function formatarData(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return iso;
  }
}

// ─── Mapa de ícone por período de rotina ──────────────────────────────────────

function iconeRotina(periodo: Rotina['periodo']): keyof typeof Feather.glyphMap {
  switch (periodo) {
    case 'manha': return 'sunrise';
    case 'tarde':  return 'sun';
    case 'noite':  return 'moon';
    default:       return 'star';
  }
}

function corFundoRotina(periodo: Rotina['periodo']): string {
  switch (periodo) {
    case 'manha': return COR_ROTINA_MANHA;
    case 'tarde':  return COR_ROTINA_TARDE;
    case 'noite':  return COR_ROTINA_NOITE;
    default:       return ShelloTema.cores.marcaClaro;
  }
}

// ─── Rotinas estáticas de fallback ─────────────────────────────────────────────

const ROTINAS_PADRAO: Rotina[] = [
  {
    id: 'padrao-manha',
    titulo: 'Rotina Matinal',
    atividades: ['Acordar às 7h', 'Meditar por 10 min', 'Escrever no diário'],
    periodo: 'manha',
  },
  {
    id: 'padrao-tarde',
    titulo: 'Reset do Meio-dia',
    atividades: ['Alongamento de 5 min', 'Revisão de tarefas', 'Beber água'],
    periodo: 'tarde',
  },
];

// ─── Componente: ItemTarefa ────────────────────────────────────────────────────

interface ItemTarefaProps {
  tarefa: Tarefa;
  onAlternar: (id: string) => void;
}

function ItemTarefa({ tarefa, onAlternar }: ItemTarefaProps): React.JSX.Element {
  const opacidade = useRef(new Animated.Value(tarefa.concluida ? 0.5 : 1)).current;
  const escala    = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(opacidade, {
      toValue:         tarefa.concluida ? 0.5 : 1,
      duration:        300,
      useNativeDriver: true,
    }).start();
  }, [tarefa.concluida, opacidade]);

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(escala, { toValue: 0.85, duration: 80,  useNativeDriver: true }),
      Animated.timing(escala, { toValue: 1,    duration: 130, useNativeDriver: true }),
    ]).start(() => onAlternar(tarefa.id));
  }, [escala, onAlternar, tarefa.id]);

  const atrasada = estaAtrasada(tarefa);

  return (
    <Animated.View
      style={[
        estilos.cardTarefa,
        atrasada && estilos.cardTarefaAtrasada,
        { opacity: opacidade },
      ]}
    >
      {/* Checkbox circular com micro-pulso */}
      <Animated.View style={{ transform: [{ scale: escala }] }}>
        <TouchableOpacity
          onPress={handlePress}
          style={[estilos.checkbox, tarefa.concluida && estilos.checkboxConcluido]}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: tarefa.concluida }}
        >
          {tarefa.concluida && (
            <Feather name="check" size={13} color={ShelloTema.cores.superficie} />
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Conteúdo */}
      <View style={estilos.tarefaConteudo}>
        <Text
          style={[
            estilos.tarefaTitulo,
            tarefa.concluida && estilos.tarefaTituloConcluida,
          ]}
          numberOfLines={2}
        >
          {tarefa.titulo}
        </Text>

        <View style={estilos.tarefaRodape}>
          {atrasada && (
            <View style={estilos.badgeAtrasada}>
              <Feather name="alert-circle" size={11} color={ShelloTema.cores.erro} />
              <Text style={estilos.badgeAtrasadaTexto}>Atrasada</Text>
            </View>
          )}

          {tarefa.data && !atrasada && !tarefa.concluida && (
            <View style={estilos.badgeData}>
              <Feather name="calendar" size={11} color={ShelloTema.cores.marca} />
              <Text style={estilos.badgeDataTexto}>{formatarData(tarefa.data)}</Text>
            </View>
          )}

          {tarefa.concluida && (
            <View style={estilos.badgeConcluida}>
              <Feather name="check-circle" size={11} color={ShelloTema.cores.marca} />
              <Text style={estilos.badgeConcluidaTexto}>Concluída</Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Componente: ModalNovaTarefa ───────────────────────────────────────────────

interface ModalNovaTarefaProps {
  visivel:    boolean;
  onFechar:   () => void;
  onAdicionar: (titulo: string, data?: string) => void;
}

function ModalNovaTarefa({
  visivel,
  onFechar,
  onAdicionar,
}: ModalNovaTarefaProps): React.JSX.Element {
  const [titulo,    setTitulo]    = useState('');
  const [dataTexto, setDataTexto] = useState('');
  const [erroData,  setErroData]  = useState('');

  // Converte dd/mm/aaaa → ISO 8601 (AAAA-MM-DD)
  function parseDataBR(texto: string): string | undefined {
    if (!texto.trim()) return undefined;
    const partes = texto.split('/');
    if (partes.length !== 3) return undefined;
    const [dia, mes, ano] = partes;
    const iso = `${ano.padStart(4, '0')}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return undefined;
    return iso;
  }

  const handleFechar = useCallback(() => {
    setTitulo('');
    setDataTexto('');
    setErroData('');
    onFechar();
  }, [onFechar]);

  const handleAdicionar = useCallback(() => {
    const tituloTrimado = titulo.trim();
    if (!tituloTrimado) return;

    let dataISO: string | undefined;
    if (dataTexto.trim()) {
      dataISO = parseDataBR(dataTexto.trim());
      if (!dataISO) {
        setErroData('Formato inválido. Use dd/mm/aaaa');
        return;
      }
    }

    onAdicionar(tituloTrimado, dataISO);
    setTitulo('');
    setDataTexto('');
    setErroData('');
    onFechar();
  }, [titulo, dataTexto, onAdicionar, onFechar]);

  const podeCriar = titulo.trim().length > 0;

  return (
    <Modal
      visible={visivel}
      animationType="slide"
      transparent
      onRequestClose={handleFechar}
    >
      <KeyboardAvoidingView
        style={estilos.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Fundo escurecido — toque fecha */}
        <TouchableOpacity
          style={estilos.modalFundo}
          activeOpacity={1}
          onPress={handleFechar}
        />

        <View style={estilos.modalConteudo}>
          {/* Alça decorativa */}
          <View style={estilos.modalAlca} />

          <Text style={estilos.modalTitulo}>Nova Intenção</Text>
          <Text style={estilos.modalSubtitulo}>
            Qual tarefa ou ritual você quer adicionar à sua jornada?
          </Text>

          {/* Campo: Título */}
          <Text style={estilos.modalLabel}>Título</Text>
          <TextInput
            style={estilos.modalInput}
            value={titulo}
            onChangeText={setTitulo}
            placeholder="Ex: Meditar por 10 minutos..."
            placeholderTextColor={ShelloTema.cores.textoS}
            autoFocus
            returnKeyType="next"
            maxLength={100}
          />

          {/* Campo: Data opcional */}
          <Text style={estilos.modalLabel}>
            Data <Text style={estilos.modalLabelOpcional}>(opcional)</Text>
          </Text>
          <TextInput
            style={[estilos.modalInput, erroData ? estilos.modalInputErro : null]}
            value={dataTexto}
            onChangeText={(t) => { setDataTexto(t); setErroData(''); }}
            placeholder="dd/mm/aaaa"
            placeholderTextColor={ShelloTema.cores.textoS}
            keyboardType="numeric"
            returnKeyType="done"
            onSubmitEditing={handleAdicionar}
            maxLength={10}
          />
          {erroData ? (
            <Text style={estilos.modalErroTexto}>{erroData}</Text>
          ) : null}

          {/* Botões */}
          <View style={estilos.modalBotoes}>
            <TouchableOpacity
              style={estilos.botaoCancelarModal}
              onPress={handleFechar}
              activeOpacity={0.8}
            >
              <Text style={estilos.botaoCancelarModalTexto}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                estilos.botaoAdicionarModal,
                !podeCriar && estilos.botaoAdicionarModalDesabilitado,
              ]}
              onPress={handleAdicionar}
              activeOpacity={0.85}
              disabled={!podeCriar}
            >
              <Feather name="plus" size={16} color={ShelloTema.cores.superficie} />
              <Text style={estilos.botaoAdicionarModalTexto}>Criar Tarefa</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Componente: CardRotina ────────────────────────────────────────────────────

interface CardRotinaProps {
  rotina: Rotina;
}

function CardRotina({ rotina }: CardRotinaProps): React.JSX.Element {
  const icone    = iconeRotina(rotina.periodo);
  const corFundo = corFundoRotina(rotina.periodo);

  return (
    <View style={[estilos.cardRotina, { backgroundColor: corFundo }]}>
      {/* Cabeçalho: ícone em círculo branco + título */}
      <View style={estilos.cardRotinaCabecalho}>
        <View style={estilos.cardRotinaIconeWrapper}>
          <Feather name={icone} size={20} color={ShelloTema.cores.marca} />
        </View>
        <Text style={estilos.cardRotinaTitulo}>{rotina.titulo}</Text>
      </View>

      {/* Lista bulleted de atividades */}
      <View style={estilos.cardRotinaLista}>
        {rotina.atividades.map((atividade, indice) => (
          <View key={indice} style={estilos.cardRotinaAtividadeRow}>
            <View style={estilos.bullet} />
            <Text style={estilos.cardRotinaAtividade}>
              {atividade.startsWith('•') ? atividade.slice(1).trim() : atividade}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Componente: ProgressoPill ─────────────────────────────────────────────────

interface ProgressoPillProps {
  concluidas: number;
  total:      number;
}

function ProgressoPill({ concluidas, total }: ProgressoPillProps): React.JSX.Element | null {
  if (total === 0) return null;
  const percentual = Math.round((concluidas / total) * 100);
  return (
    <View style={estilos.progressoPill}>
      <Feather name="check-circle" size={12} color={ShelloTema.cores.marca} />
      <Text style={estilos.progressoTexto}>
        {concluidas}/{total} concluídas · {percentual}%
      </Text>
    </View>
  );
}

// ─── Componente: EstadoVazio ───────────────────────────────────────────────────

function EstadoVazio(): React.JSX.Element {
  return (
    <View style={estilos.estadoVazio}>
      <View style={estilos.estadoVazioIconeWrapper}>
        <Feather name="check-circle" size={48} color={ShelloTema.cores.marca} />
      </View>
      <Text style={estilos.estadoVazioTitulo}>Nenhuma tarefa ainda</Text>
      <Text style={estilos.estadoVazioTexto}>
        Adicione sua primeira intenção!{'\n'}Toque no{' '}
        <Text style={estilos.estadoVazioDestaque}>+</Text> acima para começar.
      </Text>
    </View>
  );
}

// ─── Tela Principal: TelaTarefas ───────────────────────────────────────────────

export default function TelaTarefas(): React.JSX.Element {
  const { tarefas, rotinas, adicionarTarefa, alternarTarefa } = useShello();
  const [modalVisivel, setModalVisivel] = useState(false);

  // Decide quais rotinas exibir: reais do contexto ou fallback padrão
  const rotinasExibidas = useMemo<Rotina[]>(
    () => (rotinas.length > 0 ? rotinas : ROTINAS_PADRAO),
    [rotinas]
  );

  // Separação pendentes / concluídas
  const tarefasPendentes  = useMemo(() => tarefas.filter((t) => !t.concluida), [tarefas]);
  const tarefasConcluidas = useMemo(() => tarefas.filter((t) => t.concluida),  [tarefas]);

  const handleAdicionarTarefa = useCallback(
    async (titulo: string, data?: string) => {
      await adicionarTarefa(titulo, undefined, data);
    },
    [adicionarTarefa]
  );

  const handleAlternarTarefa = useCallback(
    async (id: string) => {
      await alternarTarefa(id);
    },
    [alternarTarefa]
  );

  return (
    <SafeAreaView style={estilos.safeArea}>
      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Cabeçalho serifado ─────────────────────────────────────────── */}
        <View style={estilos.cabecalho}>
          <Text style={estilos.tituloPrincipal}>Sua Jornada</Text>
          <Text style={estilos.subtituloPrincipal}>
            Organize suas intenções e rituais diários
          </Text>

          {tarefas.length > 0 && (
            <View style={estilos.progressoWrapper}>
              <ProgressoPill
                concluidas={tarefasConcluidas.length}
                total={tarefas.length}
              />
            </View>
          )}
        </View>

        {/* ── Seção: Foco de Hoje ────────────────────────────────────────── */}
        <View style={estilos.secao}>
          <View style={estilos.secaoCabecalho}>
            <Text style={estilos.secaoTitulo}>Foco de Hoje</Text>

            {/* Botão circular '+' em terracota claro conforme spec */}
            <TouchableOpacity
              style={estilos.botaoAdicionar}
              onPress={() => setModalVisivel(true)}
              activeOpacity={0.8}
              accessibilityLabel="Adicionar nova tarefa"
              accessibilityRole="button"
            >
              <Feather name="plus" size={20} color={COR_PESSEGO_ICONE} />
            </TouchableOpacity>
          </View>

          {/* Estado vazio ou lista */}
          {tarefas.length === 0 ? (
            <EstadoVazio />
          ) : (
            <View style={estilos.listaTarefas}>
              {/* Pendentes primeiro */}
              {tarefasPendentes.map((tarefa) => (
                <ItemTarefa
                  key={tarefa.id}
                  tarefa={tarefa}
                  onAlternar={handleAlternarTarefa}
                />
              ))}

              {/* Separador visual entre pendentes e concluídas */}
              {tarefasConcluidas.length > 0 && tarefasPendentes.length > 0 && (
                <View style={estilos.divisorConcluidas}>
                  <View style={estilos.divisorLinha} />
                  <Text style={estilos.divisorTexto}>Concluídas</Text>
                  <View style={estilos.divisorLinha} />
                </View>
              )}

              {/* Apenas concluídas — sem separador se não há pendentes */}
              {tarefasConcluidas.length > 0 && tarefasPendentes.length === 0 && (
                <View style={estilos.secaoConcluidasHeader}>
                  <Feather name="check-circle" size={14} color={ShelloTema.cores.marca} />
                  <Text style={estilos.secaoConcluidasTexto}>
                    Tudo concluído hoje 🎉
                  </Text>
                </View>
              )}

              {/* Concluídas */}
              {tarefasConcluidas.map((tarefa) => (
                <ItemTarefa
                  key={tarefa.id}
                  tarefa={tarefa}
                  onAlternar={handleAlternarTarefa}
                />
              ))}
            </View>
          )}
        </View>

        {/* ── Seção: Rotinas Diárias ─────────────────────────────────────── */}
        <View style={estilos.secao}>
          <View style={estilos.secaoCabecalho}>
            <Text style={estilos.secaoTitulo}>Rotinas Diárias</Text>
            <View style={estilos.rotinaBadge}>
              <Text style={estilos.rotinaBadgeTexto}>{rotinasExibidas.length}</Text>
            </View>
          </View>

          <View style={estilos.listaRotinas}>
            {rotinasExibidas.map((rotina) => (
              <CardRotina key={rotina.id} rotina={rotina} />
            ))}
          </View>
        </View>

        {/* Espaço final */}
        <View style={estilos.espacoFinal} />
      </ScrollView>

      {/* ── Modal de nova tarefa ──────────────────────────────────────────── */}
      <ModalNovaTarefa
        visivel={modalVisivel}
        onFechar={() => setModalVisivel(false)}
        onAdicionar={handleAdicionarTarefa}
      />
    </SafeAreaView>
  );
}

// ─── Estilos ───────────────────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  // ── Estrutura base ──────────────────────────────────────────────────────────
  safeArea: {
    flex: 1,
    backgroundColor: ShelloTema.cores.fundo,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: ShelloTema.espacamento.lg,
  },

  // ── Cabeçalho ───────────────────────────────────────────────────────────────
  cabecalho: {
    paddingTop: ShelloTema.espacamento.xl,
    paddingBottom: ShelloTema.espacamento.md,
  },
  tituloPrincipal: {
    fontSize: 28,
    fontFamily: 'serif',
    fontWeight: '700',
    color: ShelloTema.cores.textoP,
    marginBottom: ShelloTema.espacamento.xs,
    letterSpacing: 0.2,
  },
  subtituloPrincipal: {
    fontSize: 14,
    color: ShelloTema.cores.textoS,
    lineHeight: 20,
    marginBottom: ShelloTema.espacamento.md,
  },
  progressoWrapper: {
    flexDirection: 'row',
  },

  // Pill de progresso
  progressoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ShelloTema.cores.marcaClaro,
    borderRadius: ShelloTema.forma.bordaPill,
    paddingHorizontal: ShelloTema.espacamento.md,
    paddingVertical: ShelloTema.espacamento.xs,
    gap: ShelloTema.espacamento.xs,
    alignSelf: 'flex-start',
  },
  progressoTexto: {
    fontSize: 12,
    color: ShelloTema.cores.marca,
    fontWeight: '600',
    letterSpacing: 0.1,
  },

  // ── Seções ──────────────────────────────────────────────────────────────────
  secao: {
    marginTop: ShelloTema.espacamento.lg,
    marginBottom: ShelloTema.espacamento.sm,
  },
  secaoCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ShelloTema.espacamento.md,
  },
  secaoTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: ShelloTema.cores.textoP,
    letterSpacing: 0.15,
  },

  // Botão circular '+' — fundo terracota claro (#F2D4C8) conforme spec
  botaoAdicionar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COR_PESSEGO,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C08070',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },

  // Badge de contagem de rotinas
  rotinaBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: ShelloTema.cores.marcaClaro,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  rotinaBadgeTexto: {
    fontSize: 13,
    fontWeight: '700',
    color: ShelloTema.cores.marca,
  },

  // ── Lista de tarefas ────────────────────────────────────────────────────────
  listaTarefas: {
    gap: ShelloTema.espacamento.sm,
  },

  // Divisor entre pendentes e concluídas
  divisorConcluidas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ShelloTema.espacamento.sm,
    marginVertical: ShelloTema.espacamento.xs,
  },
  divisorLinha: {
    flex: 1,
    height: 1,
    backgroundColor: ShelloTema.cores.marcaClaro,
  },
  divisorTexto: {
    fontSize: 12,
    color: ShelloTema.cores.textoS,
    fontWeight: '500',
  },

  // Header "Tudo concluído hoje 🎉"
  secaoConcluidasHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ShelloTema.espacamento.xs,
    marginBottom: ShelloTema.espacamento.xs,
  },
  secaoConcluidasTexto: {
    fontSize: 13,
    color: ShelloTema.cores.marca,
    fontWeight: '600',
  },

  // ── Card de tarefa (pill branca arredondada — borderRadius 24) ──────────────
  cardTarefa: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ShelloTema.cores.superficie,
    borderRadius: ShelloTema.forma.bordaMedia, // 24
    paddingHorizontal: ShelloTema.espacamento.md,
    paddingVertical: ShelloTema.espacamento.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  // Borda lateral esquerda vermelha para tarefas atrasadas
  cardTarefaAtrasada: {
    borderLeftWidth: 4,
    borderLeftColor: ShelloTema.cores.erro,
  },

  // ── Checkbox circular ────────────────────────────────────────────────────────
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: ShelloTema.cores.marca,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ShelloTema.espacamento.md,
    flexShrink: 0,
    backgroundColor: ShelloTema.cores.superficie,
  },
  checkboxConcluido: {
    backgroundColor: ShelloTema.cores.marca,
    borderColor:     ShelloTema.cores.marca,
  },

  // ── Conteúdo da tarefa ───────────────────────────────────────────────────────
  tarefaConteudo: {
    flex: 1,
  },
  tarefaTitulo: {
    fontSize: 15,
    color: ShelloTema.cores.textoP,
    lineHeight: 22,
    fontWeight: '500',
  },
  tarefaTituloConcluida: {
    color: ShelloTema.cores.textoS,
    textDecorationLine: 'line-through',
  },
  tarefaRodape: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ShelloTema.espacamento.sm,
    marginTop: 4,
    flexWrap: 'wrap',
  },

  // Badge: atrasada
  badgeAtrasada: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FDE8E8',
    borderRadius: ShelloTema.forma.bordaPill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeAtrasadaTexto: {
    fontSize: 11,
    color: ShelloTema.cores.erro,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // Badge: data futura
  badgeData: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: ShelloTema.cores.marcaClaro,
    borderRadius: ShelloTema.forma.bordaPill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeDataTexto: {
    fontSize: 11,
    color: ShelloTema.cores.marca,
    fontWeight: '500',
  },

  // Badge: concluída
  badgeConcluida: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  badgeConcluidaTexto: {
    fontSize: 11,
    color: ShelloTema.cores.marca,
    fontWeight: '500',
  },

  // ── Estado vazio ─────────────────────────────────────────────────────────────
  estadoVazio: {
    backgroundColor: ShelloTema.cores.superficie,
    borderRadius: ShelloTema.forma.bordaMedia,
    padding: ShelloTema.espacamento.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  estadoVazioIconeWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ShelloTema.cores.marcaClaro,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ShelloTema.espacamento.md,
  },
  estadoVazioTitulo: {
    fontSize: 17,
    fontWeight: '700',
    color: ShelloTema.cores.textoP,
    marginBottom: ShelloTema.espacamento.xs,
  },
  estadoVazioTexto: {
    fontSize: 14,
    color: ShelloTema.cores.textoS,
    textAlign: 'center',
    lineHeight: 22,
  },
  estadoVazioDestaque: {
    color: ShelloTema.cores.marca,
    fontWeight: '700',
    fontSize: 16,
  },

  // ── Lista de rotinas ──────────────────────────────────────────────────────────
  listaRotinas: {
    gap: ShelloTema.espacamento.md,
  },

  // ── Card de rotina ────────────────────────────────────────────────────────────
  cardRotina: {
    borderRadius: 20,
    padding: ShelloTema.espacamento.lg,
  },
  cardRotinaCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ShelloTema.espacamento.md,
  },
  cardRotinaIconeWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ShelloTema.cores.superficie,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ShelloTema.espacamento.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardRotinaTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: ShelloTema.cores.textoP,
    flex: 1,
    letterSpacing: 0.15,
  },
  cardRotinaLista: {
    gap: ShelloTema.espacamento.sm,
  },
  cardRotinaAtividadeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ShelloTema.espacamento.sm,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ShelloTema.cores.marca,
    marginTop: 8,
    flexShrink: 0,
  },
  cardRotinaAtividade: {
    flex: 1,
    fontSize: 14,
    color: ShelloTema.cores.textoP,
    lineHeight: 22,
  },

  // ── Modal de nova tarefa ──────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalFundo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  modalConteudo: {
    backgroundColor: ShelloTema.cores.superficie,
    borderTopLeftRadius:  ShelloTema.forma.bordaGrande,
    borderTopRightRadius: ShelloTema.forma.bordaGrande,
    padding:       ShelloTema.espacamento.xl,
    paddingBottom: ShelloTema.espacamento.xxl,
  },
  modalAlca: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: ShelloTema.cores.marcaClaro,
    alignSelf: 'center',
    marginBottom: ShelloTema.espacamento.lg,
  },
  modalTitulo: {
    fontSize: 22,
    fontFamily: 'serif',
    fontWeight: '700',
    color: ShelloTema.cores.textoP,
    marginBottom: ShelloTema.espacamento.xs,
    letterSpacing: 0.2,
  },
  modalSubtitulo: {
    fontSize: 14,
    color: ShelloTema.cores.textoS,
    marginBottom: ShelloTema.espacamento.lg,
    lineHeight: 20,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: ShelloTema.cores.textoP,
    marginBottom: ShelloTema.espacamento.xs,
  },
  modalLabelOpcional: {
    fontSize: 12,
    fontWeight: '400',
    color: ShelloTema.cores.textoS,
  },
  modalInput: {
    backgroundColor: ShelloTema.cores.fundo,
    borderRadius:    ShelloTema.forma.bordaPequena,
    paddingHorizontal: ShelloTema.espacamento.md,
    paddingVertical:   ShelloTema.espacamento.md,
    fontSize: 15,
    color: ShelloTema.cores.textoP,
    marginBottom: ShelloTema.espacamento.md,
    borderWidth: 1.5,
    borderColor: ShelloTema.cores.marcaClaro,
    lineHeight: 22,
  },
  modalInputErro: {
    borderColor: ShelloTema.cores.erro,
  },
  modalErroTexto: {
    fontSize: 12,
    color: ShelloTema.cores.erro,
    marginTop: -ShelloTema.espacamento.sm,
    marginBottom: ShelloTema.espacamento.sm,
  },
  modalBotoes: {
    flexDirection: 'row',
    gap: ShelloTema.espacamento.sm,
    marginTop: ShelloTema.espacamento.sm,
  },
  botaoCancelarModal: {
    flex: 1,
    paddingVertical: ShelloTema.espacamento.md,
    borderRadius:    ShelloTema.forma.bordaMedia,
    alignItems: 'center',
    backgroundColor: ShelloTema.cores.fundo,
    borderWidth: 1.5,
    borderColor: ShelloTema.cores.marcaClaro,
  },
  botaoCancelarModalTexto: {
    fontSize: 15,
    color: ShelloTema.cores.textoS,
    fontWeight: '600',
  },
  botaoAdicionarModal: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: ShelloTema.espacamento.md,
    borderRadius:    ShelloTema.forma.bordaMedia,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ShelloTema.cores.marca,
    gap: ShelloTema.espacamento.sm,
    shadowColor: ShelloTema.cores.marca,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  botaoAdicionarModalDesabilitado: {
    backgroundColor: ShelloTema.cores.marcaClaro,
    shadowOpacity: 0,
    elevation: 0,
  },
  botaoAdicionarModalTexto: {
    fontSize: 15,
    color: ShelloTema.cores.superficie,
    fontWeight: '700',
  },

  // ── Espaço final ──────────────────────────────────────────────────────────────
  espacoFinal: {
    height: ShelloTema.espacamento.xxl,
  },
});
