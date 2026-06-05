import { redirect } from 'next/navigation';

export default function PanelPlanesRedirectPage() {
  redirect('/admin/planes');
}
