import { describe, expect, it } from 'vitest';
import { ehUnicaAdmin } from './service';

describe('ehUnicaAdmin', () => {
  it('identifica a única admin da empresa', () => {
    const vinculos = [
      { id: 'a', papel: 'admin' as const },
      { id: 'b', papel: 'dono' as const },
    ];
    expect(ehUnicaAdmin(vinculos, 'a')).toBe(true);
    expect(ehUnicaAdmin(vinculos, 'b')).toBe(false);
    expect(ehUnicaAdmin([...vinculos, { id: 'c', papel: 'admin' }], 'a')).toBe(false);
  });
});
