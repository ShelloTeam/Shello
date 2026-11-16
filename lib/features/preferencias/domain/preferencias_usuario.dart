import '../../../core/domain/formalidade.dart';
import '../../onboarding/domain/dados_onboarding.dart';

/// Tema visual do aplicativo (regra 5 das regras de negócio).
enum TemaApp {
  claro('Claro'),
  escuro('Escuro');

  const TemaApp(this.rotulo);

  final String rotulo;

  static TemaApp porNome(String nome) => TemaApp.values.firstWhere(
    (t) => t.name == nome,
    orElse: () => TemaApp.claro,
  );
}

/// Preferências do usuário e do agente, persistidas localmente.
class PreferenciasUsuario {
  const PreferenciasUsuario({
    this.nomeReferencia = '',
    this.formalidade = Formalidade.media,
    this.tema = TemaApp.claro,
    this.onboardingConcluido = false,
    this.onboarding,
  });

  /// Limite de caracteres do nome de referência (regra 5).
  static const int limiteNomeReferencia = 30;

  final String nomeReferencia;
  final Formalidade formalidade;
  final TemaApp tema;
  final bool onboardingConcluido;
  final DadosOnboarding? onboarding;

  PreferenciasUsuario copyWith({
    String? nomeReferencia,
    Formalidade? formalidade,
    TemaApp? tema,
    bool? onboardingConcluido,
    DadosOnboarding? onboarding,
  }) => PreferenciasUsuario(
    nomeReferencia: nomeReferencia ?? this.nomeReferencia,
    formalidade: formalidade ?? this.formalidade,
    tema: tema ?? this.tema,
    onboardingConcluido: onboardingConcluido ?? this.onboardingConcluido,
    onboarding: onboarding ?? this.onboarding,
  );

  Map<String, dynamic> toJson() => {
    'nomeReferencia': nomeReferencia,
    'formalidade': formalidade.nome,
    'tema': tema.name,
    'onboardingConcluido': onboardingConcluido,
    'onboarding': onboarding?.toJson(),
  };

  factory PreferenciasUsuario.fromJson(
    Map<String, dynamic> json,
  ) => PreferenciasUsuario(
    nomeReferencia: json['nomeReferencia'] as String? ?? '',
    formalidade: Formalidade.porNome(json['formalidade'] as String? ?? 'media'),
    tema: TemaApp.porNome(json['tema'] as String? ?? 'claro'),
    onboardingConcluido: json['onboardingConcluido'] as bool? ?? false,
    onboarding: json['onboarding'] == null
        ? null
        : DadosOnboarding.fromJson(json['onboarding'] as Map<String, dynamic>),
  );
}
