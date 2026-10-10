import { redirect } from 'next/navigation';
import { exigirUsuario, rotaInicial } from '@/features/acesso';

export default async function Inicio() {
  const { usuario } = await exigirUsuario();
  redirect(rotaInicial(usuario.adminPlataforma));
}
