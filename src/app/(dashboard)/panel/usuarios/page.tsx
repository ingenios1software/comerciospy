import { redirect } from 'next/navigation';

export default function PanelUsuariosRedirectPage() {
  redirect('/admin/usuarios');
}
