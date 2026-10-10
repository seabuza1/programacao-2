import type { Papel } from '@/features/acesso';

/** A empresa precisa de pelo menos uma admin. A trava de verdade fica no banco. */
export function ehUnicaAdmin(vinculos: { id: string; papel: Papel }[], vinculoId: string): boolean {
  const admins = vinculos.filter((v) => v.papel === 'admin');
  return admins.length === 1 && admins[0]?.id === vinculoId;
}
