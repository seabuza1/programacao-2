import { describe, expect, it } from 'vitest';
import { podeFecharAte, podeFecharMes } from './service';

describe('fechamento', () => {
  it('só admin e dono fecham e reabrem', () => {
    expect(podeFecharMes('admin')).toBe(true);
    expect(podeFecharMes('dono')).toBe(true);
    expect(podeFecharMes('operador')).toBe(false);
    expect(podeFecharMes('leitor')).toBe(false);
  });

  it('só fecha mês que já terminou', () => {
    const corrente = { ano: 2026, mes: 3 };
    expect(podeFecharAte({ ano: 2026, mes: 2 }, corrente)).toBe(true);
    expect(podeFecharAte({ ano: 2026, mes: 3 }, corrente)).toBe(false);
    expect(podeFecharAte({ ano: 2026, mes: 4 }, corrente)).toBe(false);
  });
});
