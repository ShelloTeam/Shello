import 'dart:convert';

import '../../features/autenticacao/domain/credenciais_demonstracao.dart';
import '../../features/chat/domain/conversa.dart';
import '../../features/chat/domain/mensagem_chat.dart';
import '../../features/chat/domain/motor_respostas.dart';
import '../../features/diario/domain/entrada_diario.dart';
import '../../features/onboarding/domain/dados_onboarding.dart';
import '../../features/perfil/domain/memoria.dart';
import '../../features/preferencias/domain/preferencias_usuario.dart';
import '../../features/tarefas/domain/rotina.dart';
import '../../features/tarefas/domain/tarefa.dart';
import '../domain/formalidade.dart';
import '../storage/chaves_armazenamento.dart';
import '../storage/key_value_store.dart';
import '../utils/datas.dart';

/// Conjunto completo e tipado de dados de demonstração.
///
/// Gerado a partir de um instante de referência, para que as datas pareçam
/// atuais. Como é persistido após a criação, os dados não mudam a cada abertura.
/// Restaurar a demonstração regrava tudo a partir de um novo instante.
class DadosDemonstracao {
  const DadosDemonstracao({
    required this.entradas,
    required this.memorias,
    required this.tarefas,
    required this.rotinas,
    required this.conversas,
    required this.preferencias,
    required this.conta,
  });

  final List<EntradaDiario> entradas;
  final List<Memoria> memorias;
  final List<Tarefa> tarefas;
  final List<Rotina> rotinas;
  final List<Conversa> conversas;
  final PreferenciasUsuario preferencias;
  final CredenciaisDemonstracao conta;

  static DadosDemonstracao criar(DateTime agora) {
    DateTime diasAtras(int dias, {int horas = 0, int minutos = 0}) => DateTime(
      agora.year,
      agora.month,
      agora.day - dias,
      0,
      0,
    ).add(Duration(hours: horas, minutes: minutos));

    final entradaHoje = agora.subtract(const Duration(hours: 2));
    final entradaOntem = diasAtras(1, horas: 21, minutos: 15);
    final entradaDoisDias = diasAtras(2, horas: 19, minutos: 30);
    final entradaQuatroDias = diasAtras(4, horas: 7, minutos: 50);
    final entradaSeteDias = diasAtras(7, horas: 22, minutos: 10);
    final entradaNoveDias = diasAtras(9, horas: 12);

    final entradas = [
      EntradaDiario(
        id: 'entrada-01',
        conteudo:
            'Acordei cedo e fiz a caminhada da manhã. Senti a cabeça mais leve '
            'e consegui organizar o dia antes das dez.',
        dataCriacao: entradaHoje,
      ),
      EntradaDiario(
        id: 'entrada-02',
        conteudo:
            'Hoje foi um dia de muitas trocas com a equipe. Percebi que rendo mais '
            'quando começo o dia com uma lista curta de prioridades, e quero manter esse hábito '
            'durante a semana inteira.',
        dataCriacao: entradaOntem,
      ),
      EntradaDiario(
        id: 'entrada-03',
        conteudo:
            'Fim de semana tranquilo com a família. Almoçamos juntos e depois fui '
            'ao parque com a minha irmã.',
        dataCriacao: entradaDoisDias,
      ),
      EntradaDiario(
        id: 'entrada-04',
        conteudo:
            'Comecei a aprender francês com um aplicativo de dez minutos por dia. '
            'Sempre estudo cedo, antes de abrir as mensagens, porque sinto que rende mais. '
            'Quando falho um dia, retomo no seguinte.',
        dataCriacao: entradaQuatroDias,
      ),
      EntradaDiario(
        id: 'entrada-05',
        conteudo: 'Dia cansativo, mas consegui fechar as pendências.',
        dataCriacao: entradaSeteDias,
      ),
      EntradaDiario(
        id: 'entrada-06',
        conteudo:
            'Almoço com o pessoal do antigo trabalho. Foi bom reencontrar velhos '
            'amigos e lembrar de projetos que deram certo.',
        dataCriacao: entradaNoveDias,
      ),
    ];

    final memorias = [
      Memoria(
        id: 'memoria-01',
        tipo: TipoMemoria.preferencia,
        conteudo: 'Prefere ser chamada pelo primeiro nome',
        dataCriacao: diasAtras(20),
      ),
      Memoria(
        id: 'memoria-02',
        tipo: TipoMemoria.fato,
        conteudo: 'Trabalha em modelo híbrido, com dias presenciais às quintas',
        dataCriacao: diasAtras(18),
      ),
      Memoria(
        id: 'memoria-03',
        tipo: TipoMemoria.objetivo,
        conteudo: 'Quer melhorar a consistência nos estudos',
        dataCriacao: diasAtras(15),
      ),
      Memoria(
        id: 'memoria-04',
        tipo: TipoMemoria.relacionamento,
        conteudo: 'Tem uma irmã que mora em outra cidade',
        dataCriacao: diasAtras(12),
      ),
      Memoria(
        id: 'memoria-05',
        tipo: TipoMemoria.habito,
        conteudo: 'Costuma caminhar pela manhã',
        dataCriacao: diasAtras(10),
      ),
      _memoriaDeReflexao(
        id: 'memoria-06',
        entrada: entradas[1],
        dataCriacao: entradaOntem,
      ),
      _memoriaDeReflexao(
        id: 'memoria-07',
        entrada: entradas[3],
        dataCriacao: entradaQuatroDias,
      ),
    ];

    final tarefas = [
      Tarefa(
        id: 'tarefa-01',
        titulo: 'Pagar a conta de luz',
        data: chaveDia(diasAtras(2)),
        concluida: false,
        dataCriacao: diasAtras(5),
      ),
      Tarefa(
        id: 'tarefa-02',
        titulo: 'Enviar relatório semanal ao time',
        descricao: 'Incluir os indicadores de performance da semana',
        data: chaveDia(agora),
        concluida: false,
        dataCriacao: diasAtras(1),
      ),
      Tarefa(
        id: 'tarefa-03',
        titulo: 'Renovar a assinatura da academia',
        data: chaveDia(diasAtras(-5)),
        concluida: false,
        dataCriacao: diasAtras(3),
      ),
      Tarefa(
        id: 'tarefa-04',
        titulo: 'Marcar consulta de rotina',
        data: chaveDia(diasAtras(-12)),
        concluida: false,
        dataCriacao: diasAtras(2),
      ),
      Tarefa(
        id: 'tarefa-05',
        titulo: 'Ler um capítulo do livro de estudo',
        concluida: false,
        dataCriacao: diasAtras(4),
        origem: OrigemTarefa.chat,
      ),
      Tarefa(
        id: 'tarefa-06',
        titulo: 'Beber dois litros de água no dia',
        concluida: false,
        dataCriacao: diasAtras(1),
      ),
      Tarefa(
        id: 'tarefa-07',
        titulo: 'Organizar a mesa de trabalho',
        concluida: true,
        dataCriacao: diasAtras(2),
        concluidaEm: agora.subtract(const Duration(hours: 1)),
      ),
      Tarefa(
        id: 'tarefa-08',
        titulo: 'Responder e-mails pendentes',
        concluida: true,
        dataCriacao: diasAtras(3),
        concluidaEm: diasAtras(1, horas: 17),
      ),
    ];

    final rotinas = [
      const Rotina(
        id: 'rotina-01',
        titulo: 'Rotina matinal',
        atividades: [
          'Beber um copo de água',
          'Alongar por 5 minutos',
          'Escrever três intenções do dia',
        ],
        periodo: PeriodoRotina.manha,
      ),
      const Rotina(
        id: 'rotina-02',
        titulo: 'Pausa da tarde',
        atividades: ['Caminhar 10 minutos', 'Fazer uma pausa sem telas'],
        periodo: PeriodoRotina.tarde,
      ),
      const Rotina(
        id: 'rotina-03',
        titulo: 'Ritual da noite',
        atividades: [
          'Anotar o que foi bom hoje',
          'Desligar notificações às 22h',
        ],
        periodo: PeriodoRotina.noite,
      ),
    ];

    final conversas = [_conversaArquivada(agora)];

    final preferencias = PreferenciasUsuario(
      nomeReferencia: 'Ana',
      formalidade: Formalidade.media,
      tema: TemaApp.claro,
      onboardingConcluido: true,
      onboarding: const DadosOnboarding(
        nome: 'Ana',
        estiloDeVida: 'Trabalho remoto e pouco tempo para mim',
        metaAtual: 'Criar uma rotina mais consistente',
      ),
    );

    return DadosDemonstracao(
      entradas: entradas,
      memorias: memorias,
      tarefas: tarefas,
      rotinas: rotinas,
      conversas: conversas,
      preferencias: preferencias,
      conta: CredenciaisDemonstracao.padrao,
    );
  }

  /// Regrava todas as coleções da demonstração, substituindo o conteúdo atual.
  Future<void> gravarEm(KeyValueStore store) async {
    await store.gravar(
      ChavesArmazenamento.versaoEsquema,
      '${ChavesArmazenamento.versaoAtual}',
    );
    await store.gravar(
      ChavesArmazenamento.entradas,
      jsonEncode(entradas.map((e) => e.toJson()).toList()),
    );
    await store.gravar(
      ChavesArmazenamento.memorias,
      jsonEncode(memorias.map((m) => m.toJson()).toList()),
    );
    await store.gravar(
      ChavesArmazenamento.tarefas,
      jsonEncode(tarefas.map((t) => t.toJson()).toList()),
    );
    await store.gravar(
      ChavesArmazenamento.rotinas,
      jsonEncode(rotinas.map((r) => r.toJson()).toList()),
    );
    await store.gravar(
      ChavesArmazenamento.conversas,
      jsonEncode(conversas.map((c) => c.toJson()).toList()),
    );
    await store.gravar(
      ChavesArmazenamento.preferencias,
      jsonEncode(preferencias.toJson()),
    );
  }

  static Memoria _memoriaDeReflexao({
    required String id,
    required EntradaDiario entrada,
    required DateTime dataCriacao,
  }) => Memoria(
    id: id,
    tipo: classificarTipoMemoria(entrada.conteudo),
    conteudo: Memoria.textoReflexao(entrada.conteudo),
    dataCriacao: dataCriacao,
    origemEntradaId: entrada.id,
  );

  static Conversa _conversaArquivada(DateTime agora) {
    final inicio = DateTime(agora.year, agora.month, agora.day - 3, 10);
    return Conversa(
      id: 'conversa-01',
      status: StatusConversa.arquivada,
      criadaEm: inicio,
      ultimaAtividade: inicio.add(const Duration(minutes: 20)),
      mensagens: [
        MensagemChat(
          id: 'conversa-01-msg-01',
          remetente: RemetenteChat.shello,
          conteudo:
              'Olá, Ana! 🌿 Sou o Shello, seu companheiro de crescimento pessoal. '
              'O que você quer explorar hoje?',
          horario: inicio,
          expressao: ExpressaoShello.feliz,
          ehBoasVindas: true,
        ),
        MensagemChat(
          id: 'conversa-01-msg-02',
          remetente: RemetenteChat.usuario,
          conteudo: 'Preciso criar tarefa para revisar o relatório da semana',
          horario: inicio.add(const Duration(minutes: 1)),
        ),
        MensagemChat(
          id: 'conversa-01-msg-03',
          remetente: RemetenteChat.shello,
          conteudo: 'Olá, Ana. Preparei a tarefa abaixo. Confirme se quiser adicioná-la à sua jornada.',
          horario: inicio.add(const Duration(minutes: 1, seconds: 4)),
          expressao: ExpressaoShello.neutro,
          sugestaoTitulo: 'Revisar o relatório da semana',
          sugestaoResolvida: true,
        ),
        MensagemChat(
          id: 'conversa-01-msg-04',
          remetente: RemetenteChat.usuario,
          conteudo: 'Obrigada, ajudou muito!',
          horario: inicio.add(const Duration(minutes: 15)),
        ),
        MensagemChat(
          id: 'conversa-01-msg-05',
          remetente: RemetenteChat.shello,
          conteudo: 'Que bom ler isso! Momentos de gratidão fortalecem a rotina. Como você está agora?',
          horario: inicio.add(const Duration(minutes: 15, seconds: 3)),
          expressao: ExpressaoShello.feliz,
        ),
      ],
    );
  }
}
