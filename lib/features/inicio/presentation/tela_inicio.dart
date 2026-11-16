import 'package:material_ui/material_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../app/router/rotas.dart';
import '../../../app/theme/shello_theme.dart';
import '../../../app/theme/shello_tokens.dart';
import '../../../core/providers.dart';
import '../../../core/utils/texto.dart';
import '../../../shared/animations/animacoes_shello.dart';
import '../../../shared/widgets/shello_componentes.dart';
import '../../autenticacao/presentation/sessao_providers.dart';
import '../../perfil/domain/memoria.dart';
import '../../perfil/presentation/perfil_providers.dart';
import '../../preferencias/presentation/preferencias_providers.dart';
import '../domain/estatisticas.dart';
import 'inicio_providers.dart';

/// Home: saudação, constância da semana, números de hoje e atalhos.
class TelaInicio extends ConsumerWidget {
  const TelaInicio({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cores = context.cores;
    final agora = ref.watch(relogioProvider)();
    final estatisticas = ref.watch(estatisticasInicioProvider);
    final nome = _nomeDeExibicao(ref);

    return Scaffold(
      body: EntradaAnimada(
        child: SafeArea(
          bottom: false,
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(
              ShelloEspaco.lg,
              ShelloEspaco.md,
              ShelloEspaco.lg,
              ShelloEspaco.xl,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  _dataPorExtenso(agora),
                  style: TextStyle(
                    color: cores.textoS,
                    fontSize: 13,
                    letterSpacing: 0.2,
                  ),
                ),
                const SizedBox(height: ShelloEspaco.lg),
                Text(
                  saudacaoPorHorario(agora),
                  style: TextStyle(
                    color: cores.textoS,
                    fontFamily: ShelloTipo.titulo,
                    fontSize: 28,
                    height: 1.3,
                  ),
                ),
                Text(
                  nome,
                  style: TextStyle(
                    color: cores.textoP,
                    fontFamily: ShelloTipo.titulo,
                    fontSize: 28,
                    fontWeight: FontWeight.w700,
                    height: 1.3,
                  ),
                ),
                const SizedBox(height: ShelloEspaco.lg),
                _Constancia(estatisticas: estatisticas, agora: agora),
                const SizedBox(height: ShelloEspaco.md),
                _Hoje(estatisticas: estatisticas),
                const SizedBox(height: ShelloEspaco.xl),
                const TituloSecao('Atalhos rápidos'),
                const SizedBox(height: ShelloEspaco.sm),
                _ListaAtalhos(estatisticas: estatisticas),
                const SizedBox(height: ShelloEspaco.md),
                _AtalhoContexto(
                  chave: const Key('atalho-contexto'),
                  aoTocar: () => _abrirNovoContexto(context),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _nomeDeExibicao(WidgetRef ref) {
    final preferido = ref.watch(preferenciasProvider).nomeReferencia;
    if (preferido.isNotEmpty) return preferido;
    final sessao = ref.watch(sessaoProvider);
    return sessao?.nome.split(' ').first ?? 'Amigo';
  }

  static String _dataPorExtenso(DateTime agora) {
    final texto = DateFormat("EEEE, d 'de' MMMM", 'pt_BR').format(agora);
    return capitalizarPrimeiraLetra(texto);
  }

  Future<void> _abrirNovoContexto(BuildContext context) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (contexto) => const _FolhaNovoContexto(),
    );
  }
}

/// Sequência de dias com entrada, em destaque, e a faixa dos últimos sete dias.
class _Constancia extends StatelessWidget {
  const _Constancia({required this.estatisticas, required this.agora});

  final EstatisticasInicio estatisticas;
  final DateTime agora;

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    final dias = estatisticas.sequenciaDias;
    final entradas = estatisticas.totalEntradas;
    final faixa = estatisticas.faixaSemana;

    return ShelloCard(
      padding: const EdgeInsets.all(ShelloEspaco.lg),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$dias',
                  key: const Key('sequencia-dias'),
                  style: TextStyle(
                    color: cores.marca,
                    fontFamily: ShelloTipo.titulo,
                    fontSize: 52,
                    fontWeight: FontWeight.w700,
                    height: 1,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  dias == 1 ? 'dia seguido' : 'dias seguidos',
                  style: TextStyle(
                    color: cores.textoP,
                    fontSize: ShelloTipo.pequeno,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  entradas == 1 ? '1 entrada' : '$entradas entradas',
                  style: TextStyle(
                    color: cores.textoS,
                    fontSize: ShelloTipo.minusculo,
                  ),
                ),
              ],
            ),
          ),
          Row(
            key: const Key('faixa-semana'),
            mainAxisSize: MainAxisSize.min,
            children: [
              for (var i = 0; i < faixa.length; i++)
                Padding(
                  padding: const EdgeInsets.only(left: 6),
                  child: _DiaDaSemana(
                    key: ValueKey('dia-semana-$i'),
                    comEntrada: faixa[i],
                    letra: DateFormat('EEEEE', 'pt_BR').format(
                      agora.subtract(Duration(days: faixa.length - 1 - i)),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _DiaDaSemana extends StatelessWidget {
  const _DiaDaSemana({
    super.key,
    required this.comEntrada,
    required this.letra,
  });

  final bool comEntrada;
  final String letra;

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    return Column(
      children: [
        Container(
          width: 16,
          height: 16,
          decoration: BoxDecoration(
            color: comEntrada ? cores.marca : cores.marcaClaro,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          letra.toUpperCase(),
          style: TextStyle(color: cores.textoS, fontSize: 11),
        ),
      ],
    );
  }
}

/// Números do dia, lado a lado, sem caixa: a leitura é de relance.
class _Hoje extends StatelessWidget {
  const _Hoje({required this.estatisticas});

  final EstatisticasInicio estatisticas;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _Numero(
            valor: '${estatisticas.pendentesHoje}',
            rotulo: 'Para hoje',
          ),
        ),
        Expanded(
          child: _Numero(
            valor: '${estatisticas.concluidasHoje}',
            rotulo: 'Concluídas hoje',
          ),
        ),
      ],
    );
  }
}

class _Numero extends StatelessWidget {
  const _Numero({required this.valor, required this.rotulo});

  final String valor;
  final String rotulo;

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: ShelloEspaco.sm),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            valor,
            style: TextStyle(
              color: cores.textoP,
              fontFamily: ShelloTipo.titulo,
              fontSize: 34,
              fontWeight: FontWeight.w700,
              height: 1,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            rotulo,
            style: TextStyle(
              color: cores.textoS,
              fontSize: ShelloTipo.minusculo,
            ),
          ),
        ],
      ),
    );
  }
}

/// Atalhos como lista com divisórias, não como grade de cartões com ícones.
class _ListaAtalhos extends StatelessWidget {
  const _ListaAtalhos({required this.estatisticas});

  final EstatisticasInicio estatisticas;

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    final memorias = estatisticas.memoriasAtivas;
    return ShelloCard(
      padding: EdgeInsets.zero,
      child: Column(
        children: [
          _LinhaAtalho(
            chave: const Key('atalho-diario'),
            titulo: 'Diário',
            subtitulo: 'Registre seus pensamentos',
            aoTocar: () => context.go(Rotas.diario),
          ),
          _Divisoria(cor: cores.marcaClaro),
          _LinhaAtalho(
            chave: const Key('atalho-tarefas'),
            titulo: 'Tarefas',
            subtitulo: 'Organize sua rotina',
            aoTocar: () => context.go(Rotas.tarefas),
          ),
          _Divisoria(cor: cores.marcaClaro),
          _LinhaAtalho(
            chave: const Key('atalho-chat'),
            titulo: 'Falar com Shello',
            subtitulo: 'Desabafe e tire dúvidas',
            aoTocar: () => context.go(Rotas.chat),
          ),
          _Divisoria(cor: cores.marcaClaro),
          _LinhaAtalho(
            chave: const Key('atalho-perfil'),
            titulo: 'Meu Perfil',
            subtitulo: memorias == 1
                ? '1 memória sobre você'
                : '$memorias memórias sobre você',
            aoTocar: () => context.go(Rotas.perfil),
          ),
        ],
      ),
    );
  }
}

class _Divisoria extends StatelessWidget {
  const _Divisoria({required this.cor});

  final Color cor;

  @override
  Widget build(BuildContext context) {
    return Divider(
      height: 1,
      thickness: 1,
      color: cor,
      indent: ShelloEspaco.lg,
    );
  }
}

class _LinhaAtalho extends StatelessWidget {
  const _LinhaAtalho({
    required this.chave,
    required this.titulo,
    required this.subtitulo,
    required this.aoTocar,
  });

  final Key chave;
  final String titulo;
  final String subtitulo;
  final VoidCallback aoTocar;

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    return InkWell(
      key: chave,
      onTap: aoTocar,
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: ShelloEspaco.lg,
          vertical: ShelloEspaco.md,
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    titulo,
                    style: TextStyle(
                      color: cores.textoP,
                      fontFamily: ShelloTipo.titulo,
                      fontSize: ShelloTipo.medio,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitulo,
                    style: TextStyle(
                      color: cores.textoS,
                      fontSize: ShelloTipo.minusculo,
                    ),
                  ),
                ],
              ),
            ),
            Text('›', style: TextStyle(color: cores.marca, fontSize: 22)),
          ],
        ),
      ),
    );
  }
}

class _AtalhoContexto extends StatelessWidget {
  const _AtalhoContexto({required this.chave, required this.aoTocar});

  final Key chave;
  final VoidCallback aoTocar;

  @override
  Widget build(BuildContext context) {
    return ShelloCard(
      key: chave,
      cor: context.cores.marca,
      padding: const EdgeInsets.all(ShelloEspaco.md),
      onTap: aoTocar,
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              shape: BoxShape.circle,
            ),
            child: Text(
              '+',
              style: TextStyle(
                color: Colors.white,
                fontFamily: ShelloTipo.titulo,
                fontSize: 26,
                height: 1,
              ),
            ),
          ),
          const SizedBox(width: ShelloEspaco.md),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Adicionar Contexto',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: ShelloTipo.medio,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  'Ensine algo novo ao Shello sobre você',
                  style: TextStyle(
                    color: Color(0xCCFFFFFF),
                    fontSize: ShelloTipo.minusculo,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Folha para criar uma memória de contexto a partir da Home.
class _FolhaNovoContexto extends ConsumerStatefulWidget {
  const _FolhaNovoContexto();

  @override
  ConsumerState<_FolhaNovoContexto> createState() => _FolhaNovoContextoState();
}

class _FolhaNovoContextoState extends ConsumerState<_FolhaNovoContexto> {
  final _texto = TextEditingController();
  TipoMemoria _tipo = TipoMemoria.fato;
  bool _salvando = false;

  static const Map<TipoMemoria, String> _rotulos = {
    TipoMemoria.objetivo: 'Meta',
    TipoMemoria.preferencia: 'Preferência',
    TipoMemoria.fato: 'Fato',
  };

  @override
  void dispose() {
    _texto.dispose();
    super.dispose();
  }

  Future<void> _salvar() async {
    final conteudo = _texto.text.trim();
    if (conteudo.isEmpty || _salvando) return;
    setState(() => _salvando = true);
    await ref
        .read(memoriasProvider.notifier)
        .adicionar(conteudo: conteudo, tipo: _tipo);
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    final podeSalvar = _texto.text.trim().isNotEmpty && !_salvando;
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: Container(
        margin: const EdgeInsets.all(ShelloEspaco.md),
        padding: const EdgeInsets.all(ShelloEspaco.lg),
        decoration: BoxDecoration(
          color: cores.superficie,
          borderRadius: ShelloForma.raio(ShelloForma.bordaMedia),
          boxShadow: ShelloSombra.media(cores.textoP),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Novo Contexto',
                    style: TextStyle(
                      color: cores.textoP,
                      fontSize: ShelloTipo.medio,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                IconButton(
                  tooltip: 'Fechar',
                  onPressed: () => Navigator.of(context).pop(),
                  icon: Icon(Icons.close, color: cores.textoS),
                ),
              ],
            ),
            ShelloCampo(
              chave: const Key('campo-contexto'),
              controller: _texto,
              dica: 'Ex: Quero aprender francês...',
              linhas: 3,
              altura: 84,
              maximo: 250,
              autofocus: true,
              aoMudar: (_) => setState(() {}),
            ),
            const SizedBox(height: ShelloEspaco.md),
            Wrap(
              spacing: ShelloEspaco.xs,
              children: [
                for (final tipo in _rotulos.keys)
                  ShelloChip(
                    key: Key('tipo-${tipo.name.toUpperCase()}'),
                    rotulo: _rotulos[tipo]!,
                    selecionado: _tipo == tipo,
                    onTap: () => setState(() => _tipo = tipo),
                  ),
              ],
            ),
            const SizedBox(height: ShelloEspaco.md),
            ShelloBotaoPrincipal(
              key: const Key('botao-salvar-contexto'),
              rotulo: _salvando ? 'Salvando...' : 'Salvar Contexto',
              onPressed: podeSalvar ? _salvar : null,
            ),
          ],
        ),
      ),
    );
  }
}
