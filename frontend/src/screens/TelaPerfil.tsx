// TelaPerfil.tsx — Tela de Perfil do Usuário
// Exibe dados do perfil, personalidade da IA, memórias e opções de conta

import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { ShelloTema } from '../styles/tema';
import { useShello } from '../contexts/ShelloContext';
import { MemoriaIA, NivelFormalidade } from '../types';

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
    rotulo: '[PREFERÊNCIA]',
    fundoBadge: ShelloTema.cores.marcaClaro,
    textoBadge: ShelloTema.cores.marca,
  },
  FATO: {
    rotulo: '[FATO]',
    fundoBadge: '#E8F4FD',
    textoBadge: '#1565C0',
  },
  OBJETIVO: {
    rotulo: '[OBJETIVO]',
    fundoBadge: ShelloTema.cores.terracota,
    textoBadge: '#8B5E3C',
  },
};

// ─── Componente interno: CardMemoria ─────────────────────────────────────────
// Gerencia seu próprio Animated.Value para a animação de remoção

interface CardMemoriaProps {
  memoria: MemoriaIA;
  aoRemover: (id: string) => void;
}

function CardMemoria({ memoria, aoRemover }: CardMemoriaProps) {
  // Cada card controla sua própria opacidade animada
  const opacidade = useRef(new Animated.Value(1)).current;
  const config = CONFIGURACAO_TIPO[memoria.tipo];

  // Anima a saída do card antes de chamar a remoção real
  const handleRemover = useCallback(() => {
    Animated.timing(opacidade, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      aoRemover(memoria.id);
    });
  }, [opacidade, aoRemover, memoria.id]);

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
          accessibilityLabel="Remover memória"
          accessibilityRole="button"
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

// ─── Componente principal: TelaPerfil ────────────────────────────────────────

export default function TelaPerfil() {
  const {
    nomeUsuario,
    memorias,
    removerMemoria,
    nivelFormalidade,
    setNivelFormalidade,
    concluirOnboarding,
  } = useShello();

  // Usa memórias reais se existirem, caso contrário exibe os mocks
  const listaMemorias = memorias.length > 0 ? memorias : MEMORIAS_MOCK;

  // Handler de remoção: chama a função do contexto com o id da memória
  const handleRemoverMemoria = useCallback(
    async (id: string) => {
      // Se for uma memória mockada, não tenta remover do serviço
      if (id.startsWith('mock-')) return;
      try {
        await removerMemoria(id);
      } catch (erro) {
        console.error('Erro ao remover memória:', erro);
      }
    },
    [removerMemoria]
  );

  // Handler de saída: limpa os dados do contexto com valores vazios
  const handleSair = useCallback(() => {
    Alert.alert(
      'Sair da conta',
      'Deseja mesmo sair? Seus dados salvos serão mantidos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await concluirOnboarding({ nome: '', estiloDeVida: '', metaAtual: '' });
            } catch (erro) {
              console.error('Erro ao sair:', erro);
            }
          },
        },
      ]
    );
  }, [concluirOnboarding]);

  // Obtém o primeiro nome do usuário para exibição
  const primeiroNome = nomeUsuario.split(' ')[0] || 'Usuário';

  return (
    <SafeAreaView style={estilos.areaSegura}>
      <ScrollView
        style={estilos.scrollView}
        contentContainerStyle={estilos.conteudoScroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Cabeçalho ──────────────────────────────────────────────────── */}
        <View style={estilos.cabecalho}>
          {/* Avatar circular com ícone de usuário */}
          <View style={estilos.avatarCirculo}>
            <Feather name="user" size={40} color={ShelloTema.cores.superficie} />
          </View>

          {/* Nome do usuário em fonte serifada */}
          <Text style={estilos.nomeUsuario}>{nomeUsuario || 'Meu Perfil'}</Text>

          {/* Subtítulo descritivo */}
          <Text style={estilos.subtitulo}>{'Meu Perfil & Contexto da IA'}</Text>
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
          {listaMemorias.map((memoria) => (
            <CardMemoria
              key={memoria.id}
              memoria={memoria}
              aoRemover={handleRemoverMemoria}
            />
          ))}

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

          {/* Linha de informação do usuário */}
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

          {/* Botão Sair */}
          <TouchableOpacity
            style={estilos.botaoSair}
            onPress={handleSair}
            accessibilityRole="button"
            accessibilityLabel="Sair da conta"
          >
            <Feather
              name="log-out"
              size={18}
              color="#8B5E3C"
              style={estilos.iconeBotaoSair}
            />
            <Text style={estilos.textoBotaoSair}>Sair</Text>
          </TouchableOpacity>
        </View>

        {/* Espaçamento inferior */}
        <View style={estilos.espacamentoInferior} />
      </ScrollView>
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
  avatarCirculo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ShelloTema.cores.marca,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ShelloTema.espacamento.md,
    ...ShelloTema.sombra.media,
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

  // ── Seletor de formalidade ──────────────────────────────────────────────────
  seletorFormalidade: {
    flexDirection: 'row',
    gap: ShelloTema.espacamento.sm,
    justifyContent: 'space-between',
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
    marginTop: ShelloTema.espacamento.sm,
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
    fontSize: 16,
    fontWeight: '600',
    color: ShelloTema.cores.textoP,
  },
  separador: {
    height: 1,
    backgroundColor: ShelloTema.cores.fundo,
    marginBottom: ShelloTema.espacamento.md,
  },
  botaoSair: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ShelloTema.cores.terracota,
    borderRadius: 50,
    paddingVertical: ShelloTema.espacamento.md,
    paddingHorizontal: ShelloTema.espacamento.xl,
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
});
