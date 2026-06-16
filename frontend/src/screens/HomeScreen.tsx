// HomeScreen.tsx — Tela inicial limpa do Shello
// Saudação personalizada, badges de progresso e atalhos rápidos (sem input inline)

import React, { useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { ShelloTema } from '../styles/tema';
import { useShello } from '../contexts/ShelloContext';
import { MemoriaIA } from '../types';



// ─── Tipo da navegação raiz (Bottom Tabs) ────────────────────────────────────
type RootTabNavigation = BottomTabNavigationProp<{
  DiarioTab: undefined;
  TarefasTab: undefined;
  ChatTab: undefined;
  HomeTab: undefined;
  PerfilTab: undefined;
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
  const { nomeUsuario, entradas, adicionarMemoria } = useShello();
  const navigation = useNavigation<RootTabNavigation>();

  const [modalContextoVisivel, setModalContextoVisivel] = useState(false);
  const [novoContextoTexto, setNovoContextoTexto] = useState('');
  const [novoContextoTipo, setNovoContextoTipo] = useState<MemoriaIA['tipo']>('FATO');
  const [salvandoContexto, setSalvandoContexto] = useState(false);



  const dataFormatada = formatarDataPtBR();
  const saudacao = obterSaudacao();
  const nome = nomeUsuario || 'Amigo';
  const totalEntradas = entradas.length;
  const diasSequencia = calcularDiasSequencia(entradas);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const irParaDiario = useCallback(() => navigation.navigate('DiarioTab'), [navigation]);
  const irParaTarefas = useCallback(() => navigation.navigate('TarefasTab'), [navigation]);
  const irParaChat = useCallback(() => navigation.navigate('ChatTab'), [navigation]);
  const irParaPerfil = useCallback(() => navigation.navigate('PerfilTab'), [navigation]);

  const handleSalvarContexto = useCallback(async () => {
    const textoTrimado = novoContextoTexto.trim();
    if (!textoTrimado) return;
    setSalvandoContexto(true);
    try {
      await adicionarMemoria(textoTrimado, novoContextoTipo);
      setNovoContextoTexto('');
      setNovoContextoTipo('FATO');
      setModalContextoVisivel(false);
    } catch (erro) {
      console.error('Erro ao salvar contexto:', erro);
    } finally {
      setSalvandoContexto(false);
    }
  }, [novoContextoTexto, novoContextoTipo, adicionarMemoria]);

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
        <View style={estilos.gridAtalhos}>
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
                  color={ShelloTema.cores.terracotaIcone}
                />
              </View>
              <Text style={[estilos.atalhoTitulo, estilos.atalhoTituloTerracota]}>
                Tarefas
              </Text>
              <Text style={estilos.atalhoSubtexto}>Organize sua rotina</Text>
            </TouchableOpacity>
          </View>

          <View style={estilos.filhaAtalhos}>
            {/* Card — Chat */}
            <TouchableOpacity
              style={[estilos.cardAtalho, estilos.cardAtalhoPessego]}
              onPress={irParaChat}
              activeOpacity={0.85}
              accessible
              accessibilityLabel="Conversar com o Shello"
              accessibilityRole="button"
            >
              <View style={[estilos.circuloIcone, estilos.circuloIconePessego]}>
                <Feather
                  name="message-circle"
                  size={24}
                  color={ShelloTema.cores.pessegoDark}
                />
              </View>
              <Text style={[estilos.atalhoTitulo, estilos.atalhoTituloPessego]}>
                Falar com Shello
              </Text>
              <Text style={estilos.atalhoSubtexto}>Desabafe e tire dúvidas</Text>
            </TouchableOpacity>

            {/* Card — Perfil */}
            <TouchableOpacity
              style={[estilos.cardAtalho, estilos.cardAtalhoPerfil]}
              onPress={irParaPerfil}
              activeOpacity={0.85}
              accessible
              accessibilityLabel="Ir para Perfil"
              accessibilityRole="button"
            >
              <View style={[estilos.circuloIcone, estilos.circuloIconePerfil]}>
                <Feather
                  name="user"
                  size={24}
                  color={ShelloTema.cores.marca}
                />
              </View>
              <Text style={estilos.atalhoTitulo}>Meu Perfil</Text>
              <Text style={estilos.atalhoSubtexto}>Sua evolução e memórias</Text>
            </TouchableOpacity>
          </View>

          {/* Atalho de Largura Total — Adicionar Contexto */}
          <TouchableOpacity
            style={estilos.cardAtalhoContexto}
            onPress={() => setModalContextoVisivel(true)}
            activeOpacity={0.85}
          >
            <View style={estilos.circuloIconeContexto}>
              <Feather name="plus-circle" size={24} color="#FFF" />
            </View>
            <View style={estilos.atalhoContextoTextos}>
              <Text style={estilos.atalhoTituloContexto}>Adicionar Contexto</Text>
              <Text style={estilos.atalhoSubtextoContexto}>Ensine algo novo ao Shello sobre você</Text>
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* ── Modal Adicionar Contexto ────────────────────────────────────────── */}
      <Modal
        visible={modalContextoVisivel}
        animationType="slide"
        transparent
        onRequestClose={() => setModalContextoVisivel(false)}
      >
        <KeyboardAvoidingView 
          style={estilos.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={estilos.modalCaixa}>
            <View style={estilos.modalCabecalho}>
              <Text style={estilos.modalTitulo}>Novo Contexto</Text>
              <TouchableOpacity onPress={() => setModalContextoVisivel(false)} style={estilos.modalFechar}>
                <Feather name="x" size={20} color={ShelloTema.cores.textoS} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={estilos.inputNovaMemoria}
              placeholder="Ex: Quero aprender francês..."
              placeholderTextColor={ShelloTema.cores.textoS}
              value={novoContextoTexto}
              onChangeText={setNovoContextoTexto}
              multiline
              maxLength={250}
              autoFocus
            />

            <View style={estilos.chipsTipoMemoria}>
              {(['OBJETIVO', 'PREFERENCIA', 'FATO'] as MemoriaIA['tipo'][]).map(tipo => {
                const rotulos: any = { OBJETIVO: 'Meta', PREFERENCIA: 'Preferência', FATO: 'Fato' };
                return (
                  <TouchableOpacity
                    key={tipo}
                    style={[estilos.chipTipo, novoContextoTipo === tipo && estilos.chipTipoAtivo]}
                    onPress={() => setNovoContextoTipo(tipo)}
                    activeOpacity={0.8}
                  >
                    <Text style={[estilos.chipTipoTexto, novoContextoTipo === tipo && estilos.chipTipoTextoAtivo]}>
                      {rotulos[tipo] || tipo}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[estilos.botaoSalvarContexto, (!novoContextoTexto.trim() || salvandoContexto) && { opacity: 0.6 }]}
              onPress={handleSalvarContexto}
              disabled={!novoContextoTexto.trim() || salvandoContexto}
              activeOpacity={0.8}
            >
              <Text style={estilos.botaoSalvarContextoTexto}>
                {salvandoContexto ? 'Salvando...' : 'Salvar Contexto'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
    color: ShelloTema.cores.terracotaTexto,
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
    color: ShelloTema.cores.terracotaTitulo,
  },
  atalhoSubtexto: {
    fontSize: ShelloTema.tipografia.tamanhos.minusculo,
    color: ShelloTema.cores.textoS,
    lineHeight: 16,
  },
  gridAtalhos: {
    gap: ShelloTema.espacamento.md,
  },
  cardAtalhoPessego: {
    backgroundColor: ShelloTema.cores.pessego,
  },
  cardAtalhoPerfil: {
    backgroundColor: ShelloTema.cores.superficie,
    borderWidth: 1,
    borderColor: ShelloTema.cores.marcaClaro + '80',
  },
  circuloIconePessego: {
    backgroundColor: 'rgba(160, 90, 68, 0.12)',
  },
  circuloIconePerfil: {
    backgroundColor: 'rgba(94, 131, 106, 0.1)',
  },
  atalhoTituloPessego: {
    color: ShelloTema.cores.pessegoDark,
  },

  // ── Atalho Adicionar Contexto ──
  cardAtalhoContexto: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ShelloTema.cores.marca,
    borderRadius: ShelloTema.forma.bordaMedia,
    padding: ShelloTema.espacamento.md,
    ...ShelloTema.sombra.suave,
  },
  circuloIconeContexto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ShelloTema.espacamento.md,
  },
  atalhoContextoTextos: {
    flex: 1,
  },
  atalhoTituloContexto: {
    fontSize: ShelloTema.tipografia.tamanhos.medio,
    fontWeight: ShelloTema.tipografia.pesos.negrito,
    color: '#FFF',
    marginBottom: 2,
  },
  atalhoSubtextoContexto: {
    fontSize: ShelloTema.tipografia.tamanhos.minusculo,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // ── Modal Adicionar Contexto ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: ShelloTema.espacamento.lg,
  },
  modalCaixa: {
    backgroundColor: ShelloTema.cores.superficie,
    borderRadius: ShelloTema.forma.bordaMedia,
    padding: ShelloTema.espacamento.lg,
    ...ShelloTema.sombra.media,
  },
  modalCabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ShelloTema.espacamento.md,
  },
  modalTitulo: {
    fontSize: ShelloTema.tipografia.tamanhos.medio,
    fontWeight: ShelloTema.tipografia.pesos.negrito,
    color: ShelloTema.cores.textoP,
  },
  modalFechar: {
    padding: ShelloTema.espacamento.xs,
  },
  inputNovaMemoria: {
    backgroundColor: ShelloTema.cores.fundo,
    borderRadius: ShelloTema.forma.bordaPequena,
    paddingHorizontal: ShelloTema.espacamento.md,
    paddingVertical: ShelloTema.espacamento.sm,
    fontSize: 14,
    color: ShelloTema.cores.textoP,
    minHeight: 60,
    marginBottom: ShelloTema.espacamento.md,
    borderWidth: 1,
    borderColor: ShelloTema.cores.marcaClaro,
  },
  chipsTipoMemoria: {
    flexDirection: 'row',
    gap: ShelloTema.espacamento.xs,
    marginBottom: ShelloTema.espacamento.md,
  },
  chipTipo: {
    backgroundColor: ShelloTema.cores.fundo,
    borderRadius: ShelloTema.forma.bordaPill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: ShelloTema.cores.marcaClaro,
  },
  chipTipoAtivo: {
    backgroundColor: ShelloTema.cores.marcaClaro,
    borderColor: ShelloTema.cores.marca,
  },
  chipTipoTexto: {
    fontSize: 11,
    fontWeight: '600',
    color: ShelloTema.cores.textoS,
  },
  chipTipoTextoAtivo: {
    color: ShelloTema.cores.marca,
  },
  botaoSalvarContexto: {
    backgroundColor: ShelloTema.cores.marca,
    borderRadius: ShelloTema.forma.bordaPill,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoSalvarContextoTexto: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
