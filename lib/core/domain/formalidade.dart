/// Nível de formalidade com que o Shello conversa com o usuário.
enum Formalidade {
  baixa('Casual', '💬 Shello usa linguagem casual e descontraída'),
  media('Equilibrada', '🤝 Shello usa linguagem equilibrada e amigável'),
  alta('Formal', '📋 Shello usa linguagem formal e profissional');

  const Formalidade(this.rotulo, this.descricao);

  final String rotulo;
  final String descricao;

  /// Valor persistido e enviado ao motor de respostas (`baixa`, `media`, `alta`).
  String get nome => name;

  static Formalidade porNome(String nome) => Formalidade.values.firstWhere(
    (f) => f.name == nome,
    orElse: () => Formalidade.media,
  );
}
