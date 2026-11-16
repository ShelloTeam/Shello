import 'package:material_ui/material_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../app/router/rotas.dart';
import '../../../app/theme/shello_theme.dart';
import '../../../app/theme/shello_tokens.dart';
import '../../../core/providers.dart';
import '../../../core/utils/texto.dart';
import '../../../shared/widgets/shello_componentes.dart';
import '../domain/entrada_diario.dart';
import 'diario_providers.dart';

/// Editor de uma entrada do diário. Sem [idEntrada] cria uma nova entrada.
class TelaEntradaDiario extends ConsumerStatefulWidget {
  const TelaEntradaDiario({super.key, this.idEntrada});

  final String? idEntrada;

  @override
  ConsumerState<TelaEntradaDiario> createState() => _TelaEntradaDiarioState();
}

class _TelaEntradaDiarioState extends ConsumerState<TelaEntradaDiario> {
  late final TextEditingController _texto;
  late final FocusNode _foco;
  String? _id;
  late String _textoSalvo;
  bool _ocupado = false;

  @override
  void initState() {
    super.initState();
    _id = widget.idEntrada;
    final existente = _entradaAtual();
    _texto = TextEditingController(text: existente?.conteudo ?? '');
    _textoSalvo = _texto.text;
    _foco = FocusNode();
    if (existente == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _foco.requestFocus();
      });
    }
  }

  @override
  void dispose() {
    _texto.dispose();
    _foco.dispose();
    super.dispose();
  }

  EntradaDiario? _entradaAtual() {
    final id = _id;
    if (id == null) return null;
    for (final entrada in ref.read(entradasProvider)) {
      if (entrada.id == id) return entrada;
    }
    return null;
  }

  bool get _ehNova => _id == null;

  /// Entrada existente mostra o dia em que foi escrita; uma nova mostra hoje.
  DateTime _dataDaEntrada() =>
      _entradaAtual()?.dataCriacao ?? ref.read(relogioProvider)();

  bool get _noContexto =>
      _id != null && ref.read(idsNoContextoProvider).contains(_id);

  bool get _temAlteracoesNaoSalvas => _texto.text.trim() != _textoSalvo.trim();

  /// Sai do editor. Com alterações ainda não salvas, pede confirmação antes de descartá-las.
  Future<void> _sair({bool ignorarAlteracoes = false}) async {
    if (!ignorarAlteracoes && _temAlteracoesNaoSalvas) {
      final descartar = await confirmarAcao(
        context,
        titulo: 'Descartar alterações?',
        mensagem: 'O que você escreveu ainda não foi salvo. Se sair agora, essas alterações se perdem.',
        rotuloConfirmar: 'Descartar',
        rotuloCancelar: 'Cancelar',
        destrutivo: true,
      );
      if (!descartar || !mounted) return;
    }
    if (context.canPop()) {
      context.pop();
    } else {
      context.go(Rotas.diario);
    }
  }

  /// Garante que a entrada exista (criando-a se for nova) e devolve o id.
  Future<String> _garantirSalva() async {
    final conteudo = _texto.text.trim();
    final id = _id;
    if (id == null) {
      final nova = await ref
          .read(entradasProvider.notifier)
          .adicionar(conteudo);
      _id = nova.id;
      _textoSalvo = conteudo;
      return nova.id;
    }
    await ref.read(entradasProvider.notifier).atualizar(id, conteudo);
    _textoSalvo = conteudo;
    return id;
  }

  Future<void> _finalizar() async {
    if (_ocupado) return;
    if (_texto.text.trim().isEmpty) {
      _sair();
      return;
    }
    setState(() => _ocupado = true);
    try {
      await _garantirSalva();
      if (mounted) _sair();
    } finally {
      if (mounted) setState(() => _ocupado = false);
    }
  }

  Future<void> _contexto() async {
    if (_ocupado || _texto.text.trim().isEmpty) return;
    final jaEstava = _noContexto;
    setState(() => _ocupado = true);
    try {
      final id = await _garantirSalva();
      if (!jaEstava) {
        await ref.read(entradasProvider.notifier).marcarComoContexto(id);
      }
      if (mounted) {
        mostrarAviso(
          context,
          jaEstava
              ? 'Contexto do Shello atualizado!'
              : 'Adicionado ao contexto do Shello!',
        );
        setState(() {});
      }
    } finally {
      if (mounted) setState(() => _ocupado = false);
    }
  }

  Future<void> _excluir() async {
    final id = _id;
    if (id == null) return;
    final confirmado = await confirmarAcao(
      context,
      titulo: 'Excluir Entrada',
      mensagem: 'Tem certeza que deseja apagar esta reflexão? Esta ação não pode ser desfeita.',
      rotuloConfirmar: 'Excluir',
      rotuloCancelar: 'Cancelar',
      destrutivo: true,
    );
    if (!confirmado) return;
    await ref.read(entradasProvider.notifier).excluir(id);
    if (mounted) _sair(ignorarAlteracoes: true);
  }

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    final caracteres = _texto.text.length;
    final rotuloContexto = _noContexto
        ? 'Atualizar contexto'
        : '+ Contexto Shello';
    final podeAcoes = _texto.text.trim().isNotEmpty && !_ocupado;
    final agora = _dataDaEntrada();
    final dataTexto = capitalizarPrimeiraLetra(
      DateFormat("EEEE, d 'de' MMMM", 'pt_BR').format(agora),
    );

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _sair();
      },
      child: Scaffold(
        body: SafeArea(
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: ShelloEspaco.md,
                  vertical: ShelloEspaco.sm,
                ),
                decoration: BoxDecoration(
                  color: cores.fundo,
                  border: Border(bottom: BorderSide(color: cores.marcaClaro)),
                ),
                child: Row(
                  children: [
                    IconButton(
                      key: const Key('botao-voltar-editor'),
                      tooltip: 'Voltar',
                      onPressed: _sair,
                      icon: Icon(Icons.arrow_back, color: cores.textoP),
                    ),
                    Expanded(
                      child: Text(
                        _ehNova ? 'Nova entrada' : 'Editar entrada',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: cores.textoS,
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    if (_id != null)
                      IconButton(
                        key: const Key('botao-excluir-entrada'),
                        tooltip: 'Excluir entrada',
                        onPressed: _ocupado ? null : _excluir,
                        icon: Icon(Icons.delete_outline, color: cores.erro),
                      )
                    else
                      const SizedBox(width: 48),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: ShelloEspaco.md,
                  vertical: ShelloEspaco.sm,
                ),
                decoration: BoxDecoration(
                  color: cores.superficie,
                  border: Border(bottom: BorderSide(color: cores.marcaClaro)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Opacity(
                        opacity: podeAcoes || _noContexto ? 1 : 0.6,
                        child: ShelloBotaoSecundario(
                          key: const Key('botao-contexto-shello'),
                          rotulo: rotuloContexto,
                          onPressed: podeAcoes ? _contexto : null,
                        ),
                      ),
                    ),
                    const SizedBox(width: ShelloEspaco.sm),
                    Expanded(
                      child: ShelloBotaoPrincipal(
                        key: const Key('botao-finalizar-entrada'),
                        rotulo: _ocupado ? 'Salvando...' : 'Finalizar entrada',
                        icone: Icons.check,
                        carregando: _ocupado,
                        compacto: true,
                        altura: 46,
                        onPressed: _ocupado ? null : _finalizar,
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(ShelloEspaco.lg),
                  children: [
                    Text(
                      dataTexto,
                      style: TextStyle(
                        color: cores.textoS,
                        fontStyle: FontStyle.italic,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: ShelloEspaco.lg),
                    TextField(
                      key: const Key('campo-texto-entrada'),
                      controller: _texto,
                      focusNode: _foco,
                      onChanged: (_) => setState(() {}),
                      maxLines: null,
                      minLines: 12,
                      keyboardType: TextInputType.multiline,
                      textCapitalization: TextCapitalization.sentences,
                      style: TextStyle(
                        color: cores.textoP,
                        fontFamily: ShelloTipo.titulo,
                        fontSize: 17,
                        height: 1.65,
                      ),
                      decoration: InputDecoration(
                        hintText: 'Comece a escrever sua reflexão de hoje...',
                        hintStyle: TextStyle(color: cores.textoS, fontSize: 17),
                        border: InputBorder.none,
                        isCollapsed: true,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: ShelloEspaco.lg,
                  vertical: ShelloEspaco.sm,
                ),
                decoration: BoxDecoration(
                  color: cores.fundo,
                  border: Border(top: BorderSide(color: cores.marcaClaro)),
                ),
                child: Row(
                  children: [
                    Text(
                      '$caracteres ${caracteres == 1 ? 'caractere' : 'caracteres'}',
                      style: TextStyle(
                        color: cores.textoS,
                        fontSize: ShelloTipo.minusculo,
                      ),
                    ),
                    const Spacer(),
                    if (caracteres > 100)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: ShelloEspaco.sm,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: cores.marcaClaro,
                          borderRadius: ShelloForma.raio(ShelloForma.bordaPill),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.visibility_outlined,
                              size: 11,
                              color: cores.marca,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              'Shello vai analisar',
                              style: TextStyle(
                                color: cores.marca,
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
