import 'package:material_ui/material_ui.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../app/router/rotas.dart';
import '../../../app/theme/shello_theme.dart';
import '../../../app/theme/shello_tokens.dart';
import '../../../shared/widgets/shello_avatar.dart';
import '../../../shared/widgets/shello_componentes.dart';
import '../domain/conversa.dart';
import '../domain/mensagem_chat.dart';
import 'chat_providers.dart';
import '../domain/motor_respostas.dart';

/// Histórico de conversas arquivadas. Conversas arquivadas são somente leitura.
class TelaHistoricoChat extends ConsumerWidget {
  const TelaHistoricoChat({super.key, this.idConversa});

  final String? idConversa;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final historico = ref.watch(chatProvider).historico;
    final id = idConversa;
    if (id != null) {
      final conversa = historico.where((c) => c.id == id).firstOrNull;
      return _Detalhe(conversa: conversa);
    }
    return _Lista(historico: historico);
  }
}

class _Lista extends StatelessWidget {
  const _Lista({required this.historico});

  final List<Conversa> historico;

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    return Scaffold(
      appBar: AppBar(
        backgroundColor: cores.fundo,
        elevation: 0,
        title: Text(
          'Conversas anteriores',
          style: TextStyle(
            color: cores.textoP,
            fontFamily: ShelloTipo.titulo,
            fontWeight: FontWeight.w700,
          ),
        ),
        leading: IconButton(
          tooltip: 'Voltar',
          icon: Icon(Icons.arrow_back, color: cores.textoP),
          onPressed: () =>
              context.canPop() ? context.pop() : context.go(Rotas.chat),
        ),
      ),
      body: historico.isEmpty
          ? const Center(
              child: Padding(
                padding: EdgeInsets.all(ShelloEspaco.lg),
                child: Text('Nenhuma conversa arquivada ainda.'),
              ),
            )
          : ListView.separated(
              padding: const EdgeInsets.all(ShelloEspaco.lg),
              itemCount: historico.length,
              separatorBuilder: (_, _) =>
                  const SizedBox(height: ShelloEspaco.sm),
              itemBuilder: (context, indice) {
                final conversa = historico[indice];
                return ShelloCard(
                  key: Key('conversa-arquivada-${conversa.id}'),
                  raio: ShelloForma.bordaPequena,
                  onTap: () =>
                      context.push(Rotas.conversaArquivada(conversa.id)),
                  child: Row(
                    children: [
                      Icon(Icons.chat_bubble_outline, color: cores.marca),
                      const SizedBox(width: ShelloEspaco.md),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              DateFormat('dd/MM/yyyy, HH:mm')
                                  .format(conversa.criadaEm),
                              style: TextStyle(
                                color: cores.textoP,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Text(
                              '${conversa.mensagensContaveis} '
                              '${conversa.mensagensContaveis == 1 ? 'mensagem' : 'mensagens'}',
                              style: TextStyle(
                                color: cores.textoS,
                                fontSize: ShelloTipo.minusculo,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Icon(Icons.chevron_right, color: cores.textoS),
                    ],
                  ),
                );
              },
            ),
    );
  }
}

class _Detalhe extends StatelessWidget {
  const _Detalhe({required this.conversa});

  final Conversa? conversa;

  @override
  Widget build(BuildContext context) {
    final cores = context.cores;
    final mensagens = conversa?.mensagens ?? const <MensagemChat>[];
    return Scaffold(
      appBar: AppBar(
        backgroundColor: cores.fundo,
        elevation: 0,
        title: Text(
          'Conversa arquivada',
          style: TextStyle(
            color: cores.textoP,
            fontFamily: ShelloTipo.titulo,
            fontWeight: FontWeight.w700,
          ),
        ),
        leading: IconButton(
          tooltip: 'Voltar',
          icon: Icon(Icons.arrow_back, color: cores.textoP),
          onPressed: () => context.canPop()
              ? context.pop()
              : context.go(Rotas.historicoChat),
        ),
      ),
      body: mensagens.isEmpty
          ? const Center(child: Text('Esta conversa não está mais disponível.'))
          : ListView(
              padding: const EdgeInsets.all(ShelloEspaco.md),
              children: [
                Padding(
                  padding: const EdgeInsets.only(bottom: ShelloEspaco.md),
                  child: Text(
                    'Somente leitura: conversas arquivadas não recebem novas mensagens.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: cores.textoS,
                      fontSize: ShelloTipo.minusculo,
                    ),
                  ),
                ),
                for (final mensagem in mensagens)
                  Padding(
                    padding: const EdgeInsets.only(bottom: ShelloEspaco.sm),
                    child: Align(
                      alignment: mensagem.remetente == RemetenteChat.usuario
                          ? Alignment.centerRight
                          : Alignment.centerLeft,
                      child: Container(
                        constraints: BoxConstraints(
                          maxWidth: MediaQuery.sizeOf(context).width * 0.78,
                        ),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          color: mensagem.remetente == RemetenteChat.usuario
                              ? cores.marcaClaro
                              : cores.superficie,
                          borderRadius: ShelloForma.raio(
                            ShelloForma.bordaMedia,
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            if (mensagem.remetente == RemetenteChat.shello) ...[
                              ShelloAvatar(
                                expressao:
                                    mensagem.expressao ??
                                    ExpressaoShello.neutro,
                                tamanho: 22,
                              ),
                              const SizedBox(width: ShelloEspaco.xs),
                            ],
                            Flexible(
                              child: Text(
                                mensagem.conteudo,
                                style: TextStyle(
                                  color: cores.textoP,
                                  fontSize: 14,
                                  height: 1.45,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
              ],
            ),
    );
  }
}
