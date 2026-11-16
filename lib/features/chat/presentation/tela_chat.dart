import 'package:material_ui/material_ui.dart';
import 'package:flutter_markdown_plus/flutter_markdown_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../app/router/rotas.dart';
import '../../../app/theme/shello_theme.dart';
import '../../../app/theme/shello_tokens.dart';
import '../../../core/domain/erro_regra_negocio.dart';
import '../../../shared/animations/animacoes_shello.dart';
import '../../../shared/widgets/shello_avatar.dart';
import '../../../shared/widgets/shello_componentes.dart';
import '../../preferencias/presentation/preferencias_providers.dart';
import '../domain/mensagem_chat.dart';
import '../domain/motor_respostas.dart';
import 'chat_providers.dart';

const List<(String, IconData)> _sugestoesRapidas = [
  ('Me ajude a refletir sobre meu dia', Icons.wb_sunny_outlined),
  ('Prática de gratidão', Icons.favorite_border),
  ('Ideias para o meu diário', Icons.menu_book_outlined),
];

/// Conversa com o Shello: mensagens, sugestões de tarefa e limite de 20 mensagens.
class TelaChat extends ConsumerStatefulWidget {
  const TelaChat({super.key});

  @override
  ConsumerState<TelaChat> createState() => _TelaChatState();
}

class _TelaChatState extends ConsumerState<TelaChat> {
  final _mensagem = TextEditingController();
  bool _inicializado = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _iniciar());
  }

  Future<void> _iniciar() async {
    if (_inicializado) return;
    _inicializado = true;
    await ref.read(chatProvider.notifier).carregar(_nomeReferencia());
  }

  @override
  void dispose() {
    _mensagem.dispose();
    super.dispose();
  }

  String _nomeReferencia() {
    final nome = ref.read(preferenciasProvider).nomeReferencia;
    return nome.isEmpty ? 'amigo' : nome;
  }

  /// Envia o que está no campo de digitação e limpa o campo após o envio.
  Future<void> _enviarDoCampo() async {
    final enviado = await _enviarTexto(_mensagem.text);
    if (enviado) _mensagem.clear();
  }

  /// Envia um texto qualquer (sugestões rápidas) sem mexer no campo de digitação.
  Future<bool> _enviarTexto(String texto) async {
    final limpo = texto.trim();
    if (limpo.isEmpty) return false;
    try {
      await ref.read(chatProvider.notifier).enviar(limpo);
      return true;
    } on ErroRegraNegocio catch (erro) {
      if (mounted) mostrarAviso(context, erro.mensagem);
      return false;
    }
  }

  Future<void> _confirmarSugestao(MensagemChat mensagem) async {
    await ref.read(chatProvider.notifier).confirmarSugestao(mensagem.id);
    if (mounted) mostrarAviso(context, 'Tarefa adicionada à sua jornada!');
  }

  Future<void> _recusarSugestao(MensagemChat mensagem) async {
    await ref.read(chatProvider.notifier).recusarSugestao(mensagem.id);
  }

  Future<void> _novoChat() async {
    final confirmado = await confirmarAcao(
      context,
      titulo: 'Novo Chat',
      mensagem: 'Tem certeza? A conversa atual será encerrada.',
      rotuloConfirmar: 'Iniciar',
      rotuloCancelar: 'Cancelar',
    );
    if (confirmado) {
      await ref.read(chatProvider.notifier).novaConversa(_nomeReferencia());
    }
  }

  @override
  Widget build(BuildContext context) {
    final estado = ref.watch(chatProvider);
    final conversa = estado.conversa;
    final mensagens = conversa?.mensagens ?? const <MensagemChat>[];
    final contaveis = conversa?.mensagensContaveis ?? 0;
    final limiteAtingido = !RegrasConversa.podeEnviar(contaveis);
    final expressaoAtual = _ultimaExpressao(mensagens);
    final pendente = _sugestaoPendente(mensagens);
    final mostrarSugestoes = contaveis == 0 && _mensagem.text.trim().isEmpty;

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            _Cabecalho(
              expressao: expressaoAtual,
              aoHistorico: () => context.push(Rotas.historicoChat),
              aoNovoChat: _novoChat,
            ),
            Expanded(
              child: ListView.builder(
                reverse: true,
                padding: const EdgeInsets.symmetric(
                  horizontal: ShelloEspaco.md,
                  vertical: ShelloEspaco.sm,
                ),
                itemCount: mensagens.length + (estado.digitando ? 1 : 0),
                itemBuilder: (context, indice) {
                  if (estado.digitando && indice == 0) {
                    return _IndicadorDigitacao(expressao: expressaoAtual);
                  }
                  final ajustado = estado.digitando ? indice - 1 : indice;
                  final mensagem = mensagens[mensagens.length - 1 - ajustado];
                  return _Bolha(mensagem: mensagem);
                },
              ),
            ),
            if (pendente != null)
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: ShelloEspaco.md,
                ),
                child: _CardSugestao(
                  titulo: pendente.sugestaoTitulo!,
                  aoConfirmar: () => _confirmarSugestao(pendente),
                  aoCancelar: () => _recusarSugestao(pendente),
                ),
              ),
            if (mostrarSugestoes)
              SizedBox(
                height: 150,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(
                    horizontal: ShelloEspaco.md,
                  ),
                  children: [
                    for (final sugestao in _sugestoesRapidas)
                      Padding(
                        padding: const EdgeInsets.only(
                          right: ShelloEspaco.sm,
                          top: ShelloEspaco.sm,
                        ),
                        child: _CartaoSugestaoRapida(
                          rotulo: sugestao.$1,
                          icone: sugestao.$2,
                          aoTocar: () => _enviarTexto(sugestao.$1),
                        ),
                      ),
                  ],
                ),
              ),
            if (limiteAtingido) _AvisoLimite(aoNovaConversa: _novoChat),
            _BarraEntrada(
              controller: _mensagem,
              desabilitada: limiteAtingido || estado.digitando,
              aoEnviar: (_) => _enviarDoCampo(),
              aoMudar: () => setState(() {}),
            ),
          ],
        ),
      ),
    );
  }

  ExpressaoShello _ultimaExpressao(List<MensagemChat> mensagens) {
    for (final mensagem in mensagens.reversed) {
      if (mensagem.remetente == RemetenteChat.shello &&
          mensagem.expressao != null) {
        return mensagem.expressao!;
      }
    }
    return ExpressaoShello.feliz;
  }

  MensagemChat? _sugestaoPendente(List<MensagemChat> mensagens) {
    for (final mensagem in mensagens.reversed) {
      if (mensagem.temSugestaoPendente) return mensagem;
    }
    return null;
  }
}

class _Cabecalho extends StatelessWidget {
  const _Cabecalho({
    required this.expressao,
    required this.aoHistorico,
    required this.aoNovoChat,
  });

  final ExpressaoShello expressao;
  final VoidCallback aoHistorico;
  final VoidCallback aoNovoChat;

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: ShelloEspaco.lg,
        vertical: ShelloEspaco.md,
      ),
      decoration: BoxDecoration(
        color: cores.superficie,
        border: Border(bottom: BorderSide(color: cores.marcaClaro)),
        boxShadow: ShelloSombra.suave(cores.textoP),
      ),
      child: Row(
        children: [
          Stack(
            clipBehavior: Clip.none,
            children: [
              ShelloAvatar(expressao: expressao, tamanho: 48),
              Positioned(
                right: 0,
                bottom: 0,
                child: Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    color: cores.online,
                    shape: BoxShape.circle,
                    border: Border.all(color: cores.superficie, width: 2),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(width: ShelloEspaco.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Shello',
                  style: TextStyle(
                    color: cores.textoP,
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(
                  'Seu Companheiro de IA',
                  style: TextStyle(
                    color: cores.textoS,
                    fontSize: ShelloTipo.minusculo,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            key: const Key('botao-historico-chat'),
            tooltip: 'Conversas anteriores',
            onPressed: aoHistorico,
            icon: Icon(Icons.history, color: cores.textoS),
          ),
          const SizedBox(width: ShelloEspaco.xs),
          Semantics(
            button: true,
            label: 'Novo chat',
            child: GestureDetector(
              key: const Key('botao-novo-chat'),
              behavior: HitTestBehavior.opaque,
              onTap: aoNovoChat,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: ShelloEspaco.md,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  border: Border.all(color: cores.marcaClaro, width: 1.5),
                  borderRadius: ShelloForma.raio(ShelloForma.bordaPill),
                ),
                child: Text(
                  'Novo chat',
                  style: TextStyle(
                    color: cores.marca,
                    fontSize: ShelloTipo.pequeno,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Bolha extends StatelessWidget {
  const _Bolha({required this.mensagem});

  final MensagemChat mensagem;

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    final hora = DateFormat('HH:mm').format(mensagem.horario);
    if (mensagem.remetente == RemetenteChat.usuario) {
      return Padding(
        padding: const EdgeInsets.only(bottom: ShelloEspaco.md),
        child: Align(
          alignment: Alignment.centerRight,
          child: ConstrainedBox(
            constraints: BoxConstraints(
              maxWidth: MediaQuery.sizeOf(context).width * 0.8,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  decoration: BoxDecoration(
                    color: cores.marca,
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(ShelloForma.bordaMedia),
                      topRight: Radius.circular(4),
                      bottomLeft: Radius.circular(ShelloForma.bordaMedia),
                      bottomRight: Radius.circular(ShelloForma.bordaMedia),
                    ),
                  ),
                  child: Text(
                    mensagem.conteudo,
                    style: TextStyle(
                      color: cores.textoSobreMarca,
                      fontSize: 15,
                      height: 1.45,
                    ),
                  ),
                ),
                const SizedBox(height: 4),
                Text(hora, style: TextStyle(color: cores.textoS, fontSize: 11)),
              ],
            ),
          ),
        ),
      );
    }

    final expressao = mensagem.expressao ?? ExpressaoShello.neutro;
    return Padding(
      padding: const EdgeInsets.only(bottom: ShelloEspaco.md),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          ShelloAvatar(expressao: expressao, tamanho: 30),
          const SizedBox(width: ShelloEspaco.sm),
          Flexible(
            child: ConstrainedBox(
              constraints: BoxConstraints(
                maxWidth: MediaQuery.sizeOf(context).width * 0.8,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      color: cores.superficie,
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(4),
                        topRight: Radius.circular(ShelloForma.bordaMedia),
                        bottomLeft: Radius.circular(ShelloForma.bordaMedia),
                        bottomRight: Radius.circular(ShelloForma.bordaMedia),
                      ),
                      boxShadow: ShelloSombra.suave(cores.textoP),
                    ),
                    child: MarkdownBody(
                      data: mensagem.conteudo,
                      styleSheet: MarkdownStyleSheet(
                        p: TextStyle(
                          color: cores.textoP,
                          fontSize: 15,
                          height: 1.45,
                        ),
                        strong: TextStyle(
                          color: cores.textoP,
                          fontWeight: FontWeight.w700,
                        ),
                        em: TextStyle(
                          color: cores.textoP,
                          fontStyle: FontStyle.italic,
                        ),
                        listBullet: TextStyle(color: cores.textoP),
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    hora,
                    style: TextStyle(color: cores.textoS, fontSize: 11),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _IndicadorDigitacao extends StatelessWidget {
  const _IndicadorDigitacao({required this.expressao});

  final ExpressaoShello expressao;

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    return Padding(
      padding: const EdgeInsets.only(bottom: ShelloEspaco.md),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          ShelloAvatar(expressao: expressao, tamanho: 28),
          const SizedBox(width: ShelloEspaco.sm),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: cores.superficie,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(4),
                topRight: Radius.circular(ShelloForma.bordaMedia),
                bottomLeft: Radius.circular(ShelloForma.bordaMedia),
                bottomRight: Radius.circular(ShelloForma.bordaMedia),
              ),
            ),
            child: IndicadorDigitando(cor: cores.marca),
          ),
        ],
      ),
    );
  }
}

class _CardSugestao extends StatelessWidget {
  const _CardSugestao({
    required this.titulo,
    required this.aoConfirmar,
    required this.aoCancelar,
  });

  final String titulo;
  final VoidCallback aoConfirmar;
  final VoidCallback aoCancelar;

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    return ShelloCard(
      key: const Key('card-sugestao-tarefa'),
      raio: ShelloForma.bordaMedia,
      padding: const EdgeInsets.all(ShelloEspaco.md),
      faixaEsquerda: BorderSide(color: cores.marca, width: 3),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Icon(Icons.add_circle_outline, size: 16, color: cores.marca),
              const SizedBox(width: 6),
              Text(
                'Criar tarefa?',
                style: TextStyle(
                  color: cores.marca,
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            titulo,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(color: cores.textoP, fontSize: 14, height: 1.4),
          ),
          const SizedBox(height: ShelloEspaco.md),
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  key: const Key('botao-confirmar-sugestao'),
                  onTap: aoConfirmar,
                  child: Container(
                    height: 40,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: cores.marca,
                      borderRadius: ShelloForma.raio(ShelloForma.bordaPill),
                    ),
                    child: Text(
                      '✓ Confirmar',
                      style: TextStyle(
                        color: cores.textoSobreMarca,
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: ShelloEspaco.sm),
              Expanded(
                child: ShelloBotaoSecundario(
                  key: const Key('botao-recusar-sugestao'),
                  rotulo: 'Cancelar',
                  onPressed: aoCancelar,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _CartaoSugestaoRapida extends StatelessWidget {
  const _CartaoSugestaoRapida({
    required this.rotulo,
    required this.icone,
    required this.aoTocar,
  });

  final String rotulo;
  final IconData icone;
  final VoidCallback aoTocar;

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    return ShelloCard(
      raio: ShelloForma.bordaPequena,
      padding: const EdgeInsets.all(ShelloEspaco.md),
      onTap: aoTocar,
      child: SizedBox(
        width: 150,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: cores.marcaClaro,
                shape: BoxShape.circle,
              ),
              child: Icon(icone, size: 17, color: cores.marca),
            ),
            const SizedBox(height: ShelloEspaco.sm),
            Text(
              rotulo,
              style: TextStyle(
                color: cores.textoP,
                fontSize: 12,
                height: 1.35,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AvisoLimite extends StatelessWidget {
  const _AvisoLimite({required this.aoNovaConversa});

  final VoidCallback aoNovaConversa;

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    return Container(
      margin: const EdgeInsets.fromLTRB(
        ShelloEspaco.md,
        ShelloEspaco.sm,
        ShelloEspaco.md,
        0,
      ),
      padding: const EdgeInsets.symmetric(
        horizontal: ShelloEspaco.md,
        vertical: ShelloEspaco.sm,
      ),
      decoration: BoxDecoration(
        color: cores.terracota,
        borderRadius: ShelloForma.raio(ShelloForma.bordaPequena),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              'Limite de 20 mensagens atingido. Inicie uma nova conversa para continuar.',
              style: TextStyle(
                color: cores.terracotaTitulo,
                fontSize: 13,
                height: 1.35,
              ),
            ),
          ),
          TextButton(
            onPressed: aoNovaConversa,
            child: Text(
              'Nova conversa',
              style: TextStyle(color: cores.marca, fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }
}

class _BarraEntrada extends StatelessWidget {
  const _BarraEntrada({
    required this.controller,
    required this.desabilitada,
    required this.aoEnviar,
    required this.aoMudar,
  });

  final TextEditingController controller;
  final bool desabilitada;
  final ValueChanged<String> aoEnviar;
  final VoidCallback aoMudar;

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    final podeEnviar = !desabilitada && controller.text.trim().isNotEmpty;
    return Container(
      padding: const EdgeInsets.fromLTRB(
        ShelloEspaco.md,
        ShelloEspaco.md,
        ShelloEspaco.md,
        ShelloEspaco.md,
      ),
      decoration: BoxDecoration(
        color: cores.fundo,
        border: Border(top: BorderSide(color: cores.marcaClaro)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: ShelloCampo(
              chave: const Key('campo-mensagem'),
              controller: controller,
              dica: 'Compartilhe seus pensamentos...',
              linhas: 4,
              altura: 52,
              maximo: 500,
              capitalizacao: TextCapitalization.sentences,
              aoMudar: (_) => aoMudar(),
              aoEnviar: podeEnviar ? aoEnviar : null,
            ),
          ),
          const SizedBox(width: ShelloEspaco.sm),
          Semantics(
            button: true,
            enabled: podeEnviar,
            label: 'Enviar mensagem',
            child: GestureDetector(
              key: const Key('botao-enviar'),
              onTap: podeEnviar ? () => aoEnviar(controller.text) : null,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: podeEnviar ? cores.marca : cores.marcaClaro,
                  boxShadow: podeEnviar
                      ? ShelloSombra.media(cores.marca)
                      : null,
                ),
                child: Icon(Icons.send, size: 20, color: cores.textoSobreMarca),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
