/// Respostas coletadas nas três etapas do onboarding.
class DadosOnboarding {
  const DadosOnboarding({
    required this.nome,
    required this.estiloDeVida,
    required this.metaAtual,
  });

  final String nome;
  final String estiloDeVida;
  final String metaAtual;

  /// Preenche campos vazios com os mesmos valores padrão da versão original.
  DadosOnboarding comPadroes() => DadosOnboarding(
    nome: nome.trim().isEmpty ? 'Você' : nome.trim(),
    estiloDeVida: estiloDeVida.trim().isEmpty
        ? 'Ainda descobrindo'
        : estiloDeVida.trim(),
    metaAtual: metaAtual.trim().isEmpty
        ? 'Crescer cada dia mais'
        : metaAtual.trim(),
  );

  Map<String, dynamic> toJson() => {
    'nome': nome,
    'estiloDeVida': estiloDeVida,
    'metaAtual': metaAtual,
  };

  factory DadosOnboarding.fromJson(Map<String, dynamic> json) =>
      DadosOnboarding(
        nome: json['nome'] as String,
        estiloDeVida: json['estiloDeVida'] as String,
        metaAtual: json['metaAtual'] as String,
      );
}
