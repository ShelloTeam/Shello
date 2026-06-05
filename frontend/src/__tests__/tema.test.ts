// Testes do Design System (tema.ts)
import { ShelloTema } from '../styles/tema';

describe('ShelloTema — Design Tokens', () => {
  describe('Paleta de Cores (Sage Theme)', () => {
    it('deve conter a cor de fundo correta (creme off-white)', () => {
      expect(ShelloTema.cores.fundo).toBe('#F7F6F0');
    });

    it('deve conter a cor de superfície correta (branco puro)', () => {
      expect(ShelloTema.cores.superficie).toBe('#FFFFFF');
    });

    it('deve conter a cor da marca correta (verde sálvia)', () => {
      expect(ShelloTema.cores.marca).toBe('#5E836A');
    });

    it('deve conter a cor de texto principal correta (verde floresta)', () => {
      expect(ShelloTema.cores.textoP).toBe('#2D3A32');
    });

    it('deve conter a cor de erro correta (vermelho)', () => {
      expect(ShelloTema.cores.erro).toBe('#DC3545');
    });

    it('deve conter a cor terracota correta', () => {
      expect(ShelloTema.cores.terracota).toBe('#EADCD6');
    });
  });

  describe('Tipografia', () => {
    it('deve ter altura de linha de 22 para conforto ocular', () => {
      expect(ShelloTema.tipografia.alturaLinha).toBe(22);
    });

    it('deve ter tamanho gigante de 32px para saudações', () => {
      expect(ShelloTema.tipografia.tamanhos.gigante).toBe(32);
    });
  });

  describe('Formas & Espaçamento', () => {
    it('deve ter borda grande de 32 para cards principais', () => {
      expect(ShelloTema.forma.bordaGrande).toBe(32);
    });

    it('deve ter espaçamento médio de 16px', () => {
      expect(ShelloTema.espacamento.md).toBe(16);
    });
  });
});
