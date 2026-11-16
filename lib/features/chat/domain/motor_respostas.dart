import '../../../core/domain/formalidade.dart';
import '../../../core/utils/texto.dart';

/// Expressões do mascote. A ordem corresponde aos quadros da sprite.
enum ExpressaoShello {
  neutro(0),
  duvidoso(1),
  surpreso(2),
  feliz(3);

  const ExpressaoShello(this.indiceNaSprite);

  final int indiceNaSprite;
}

enum ModoChat { pratico, padrao }

/// Tarefa sugerida pelo Shello, aguardando confirmação explícita do usuário.
/// Propositalmente sem campo de data: a regra D06 proíbe inferir datas.
class SugestaoTarefa {
  const SugestaoTarefa(this.titulo);

  final String titulo;
}

/// Dados do usuário e da memória que influenciam a resposta.
class ContextoResposta {
  const ContextoResposta({
    required this.nome,
    required this.formalidade,
    this.memorias = const [],
  });

  final String nome;
  final Formalidade formalidade;
  final List<String> memorias;
}

class RespostaShello {
  const RespostaShello({
    required this.texto,
    required this.expressao,
    required this.modo,
    this.sugestaoTarefa,
  });

  final String texto;
  final ExpressaoShello expressao;
  final ModoChat modo;
  final SugestaoTarefa? sugestaoTarefa;
}

/// Gatilhos do modo PRATICO (ação estruturada). Sem acentos: comparados
/// sobre o texto em minúsculas para preservar o título original.
final RegExp _gatilhoPratico = RegExp(
  r'criar uma tarefa|criar tarefa|adicionar tarefa|nova tarefa|lembrete|agenda|adicionar',
);

/// Palavras de data que não formam um título útil. Não interpretamos datas
/// (regra D06); apenas evitamos sugerir "Amanhã" como nome de tarefa.
const Set<String> _palavrasTemporais = {
  'hoje',
  'amanha',
  'segunda',
  'terca',
  'quarta',
  'quinta',
  'sexta',
  'sabado',
  'domingo',
};

const List<String> _conectivos = [
  'para',
  'pra',
  'de',
  'sobre',
  'que',
  'um',
  'uma',
  'o',
  'a',
];

/// Motor de respostas mockado e determinístico. Não usa LLM nem rede: identifica
/// intenções por palavras-chave e compõe respostas a partir de modelos fixos.
class MotorRespostas {
  const MotorRespostas();

  ModoChat detectarModo(String mensagem) {
    return _gatilhoPratico.hasMatch(mensagem.toLowerCase())
        ? ModoChat.pratico
        : ModoChat.padrao;
  }

  /// Extrai o título pedido após o gatilho ("criar tarefa para revisar X" → "Revisar X").
  /// Retorna `null` quando não há conteúdo suficiente para uma tarefa.
  String? extrairTituloTarefa(String mensagem) {
    final casamento = _gatilhoPratico.firstMatch(mensagem.toLowerCase());
    if (casamento == null) return null;

    var restante = mensagem.substring(casamento.end).trim();
    restante = restante.replaceFirst(RegExp(r'^[:\-,]+\s*'), '');
    for (final conectivo in _conectivos) {
      final padrao = RegExp('^$conectivo\\s+', caseSensitive: false);
      if (padrao.hasMatch(restante)) {
        restante = restante.replaceFirst(padrao, '');
      }
    }
    restante = restante.replaceAll(RegExp(r'[.!?]+$'), '').trim();
    if (restante.isEmpty) return null;

    final normalizado = normalizarTexto(restante);
    if (_palavrasTemporais.contains(normalizado)) return null;
    return capitalizarPrimeiraLetra(restante);
  }

  RespostaShello responder(String mensagem, ContextoResposta contexto) {
    final modo = detectarModo(mensagem);
    if (modo == ModoChat.pratico) {
      return _responderPratico(mensagem, contexto);
    }
    return _responderPadrao(mensagem, contexto);
  }

  RespostaShello _responderPratico(String mensagem, ContextoResposta contexto) {
    final titulo = extrairTituloTarefa(mensagem);
    if (titulo == null) {
      return RespostaShello(
        texto:
            '${_abertura(contexto)} Sobre o que você quer criar a tarefa? '
            'Me conte em uma frase e eu monto a sugestão para você confirmar.',
        expressao: ExpressaoShello.neutro,
        modo: ModoChat.pratico,
      );
    }
    return RespostaShello(
      texto:
          '${_abertura(contexto)} Preparei a tarefa abaixo. '
          'Confirme se quiser adicioná-la à sua jornada.',
      expressao: ExpressaoShello.neutro,
      modo: ModoChat.pratico,
      sugestaoTarefa: SugestaoTarefa(titulo),
    );
  }

  RespostaShello _responderPadrao(String mensagem, ContextoResposta contexto) {
    final texto = normalizarTexto(mensagem);
    final intencao = _intencaoPadrao(texto);
    final corpo = _corpoDaIntencao(intencao, contexto);
    final memoria = _memoriaRelevante(texto, contexto.memorias);
    final complemento = memoria == null
        ? ''
        : ' Você me contou antes: "$memoria". Quer falar sobre isso?';
    return RespostaShello(
      texto: '${_abertura(contexto)} $corpo$complemento',
      expressao: _expressaoDa(intencao),
      modo: ModoChat.padrao,
    );
  }

  _Intencao _intencaoPadrao(String texto) {
    if (RegExp(r'pratica.*gratidao|gratidao.*pratica|praticar gratidao')
        .hasMatch(texto)) {
      return _Intencao.praticaGratidao;
    }
    if (RegExp(r'\b(obrigad[oa]|valeu|grat[oa]|agradec)').hasMatch(texto)) {
      return _Intencao.gratidao;
    }
    if (RegExp(
      r'\b(triste|cansad[oa]|ansios[oa]|estressad[oa]|angustia|sozinh[oa]|chateado|chateada|desanimad[oa]|medo)\b',
    ).hasMatch(texto)) {
      return _Intencao.acolhimento;
    }
    if (RegExp(r'ideia|ideias|diario').hasMatch(texto)) {
      return _Intencao.ideiasDiario;
    }
    if (RegExp(r'refletir|reflexao|meu dia').hasMatch(texto)) {
      return _Intencao.reflexao;
    }
    if (RegExp(r'\b(oi|ola|bom dia|boa tarde|boa noite|e ai|tudo bem)\b')
        .hasMatch(texto)) {
      return _Intencao.saudacao;
    }
    return _Intencao.geral;
  }

  String _corpoDaIntencao(_Intencao intencao, ContextoResposta contexto) {
    switch (intencao) {
      case _Intencao.praticaGratidao:
        return 'Vamos praticar gratidão juntos: pense em três coisas pequenas que deram certo '
            'hoje e escreva uma frase para cada uma. Quer que eu guarde isso no seu diário?';
      case _Intencao.gratidao:
        return 'Que bom ler isso! Momentos de gratidão fortalecem a rotina. Como você está agora?';
      case _Intencao.acolhimento:
        return 'Sinto muito que esteja assim. Não precisa resolver tudo agora. '
            'Quer me contar o que mais pesou no seu dia?';
      case _Intencao.ideiasDiario:
        return 'Algumas ideias para o diário: o que te surpreendeu hoje, uma pequena vitória, '
            'algo que você quer deixar para amanhã e como você se sentiu ao longo do dia.';
      case _Intencao.reflexao:
        return 'Vamos refletir sobre o seu dia. O que foi mais importante para você hoje?';
      case _Intencao.saudacao:
        return 'Estou aqui para conversar, organizar suas tarefas ou pensar no seu diário. '
            'O que você quer explorar hoje?';
      case _Intencao.geral:
        return 'Entendi. Me conte mais sobre isso para eu entender melhor como posso ajudar.';
    }
  }

  ExpressaoShello _expressaoDa(_Intencao intencao) {
    switch (intencao) {
      case _Intencao.praticaGratidao:
      case _Intencao.gratidao:
      case _Intencao.saudacao:
        return ExpressaoShello.feliz;
      case _Intencao.acolhimento:
        return ExpressaoShello.duvidoso;
      case _Intencao.ideiasDiario:
      case _Intencao.reflexao:
      case _Intencao.geral:
        return ExpressaoShello.neutro;
    }
  }

  /// Abertura conforme a formalidade escolhida pelo usuário.
  String _abertura(ContextoResposta contexto) {
    final nome = contexto.nome;
    return switch (contexto.formalidade) {
      Formalidade.baixa => 'Oi, $nome!',
      Formalidade.media => 'Olá, $nome.',
      Formalidade.alta => 'Olá, $nome. Como posso ajudar?',
    };
  }

  /// Primeira memória que compartilha uma palavra significativa com a mensagem.
  String? _memoriaRelevante(String texto, List<String> memorias) {
    final palavras = texto
        .split(RegExp(r'[^a-z]+'))
        .where((p) => p.length >= 5)
        .toSet();
    for (final memoria in memorias) {
      final termos = normalizarTexto(memoria)
          .split(RegExp(r'[^a-z]+'))
          .where((p) => p.length >= 5);
      if (termos.any(palavras.contains)) return memoria;
    }
    return null;
  }
}

enum _Intencao {
  praticaGratidao,
  gratidao,
  acolhimento,
  ideiasDiario,
  reflexao,
  saudacao,
  geral,
}

/// Regras de uma conversa: limite de mensagens e arquivamento por inatividade.
class RegrasConversa {
  const RegrasConversa._();

  static const int limiteMensagens = 20;
  static const Duration inatividadeMaxima = Duration(hours: 2);

  /// Usado na interface para desabilitar o envio quando o limite já foi atingido.
  static bool podeEnviar(int mensagensPersistidas) =>
      mensagensPersistidas < limiteMensagens;

  /// Uma troca (pergunta + resposta) é gravada de forma atômica: só é aceita
  /// se o total resultante couber no limite. Assim nunca fica pergunta sem resposta.
  static bool cabeNoLimite(int mensagensAtuais, int mensagensNovas) =>
      mensagensAtuais + mensagensNovas <= limiteMensagens;

  static bool deveArquivar(DateTime ultimaAtividade, DateTime agora) =>
      agora.difference(ultimaAtividade) > inatividadeMaxima;
}
