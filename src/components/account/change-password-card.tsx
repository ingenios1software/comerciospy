"use client";

import { FormEvent, useState } from 'react';
import { Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth-context';
import { changeUserPassword, getChangePasswordErrorMessage } from '@/lib/firebase/auth';

export function ChangePasswordCard() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const supportsPassword = user?.providerData.some((provider) => provider.providerId === 'password');

  if (!user || !supportsPassword) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 8) {
      setError('La nueva contrasena debe tener al menos 8 caracteres.');
      return;
    }

    if (newPassword === currentPassword) {
      setError('La nueva contrasena debe ser diferente de la actual.');
      return;
    }

    if (newPassword !== confirmation) {
      setError('La confirmacion no coincide con la nueva contrasena.');
      return;
    }

    setSaving(true);

    try {
      await changeUserPassword(user, currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmation('');
      setSuccess('Contrasena actualizada. Usala la proxima vez que inicies sesion.');
    } catch (changeError) {
      setError(getChangePasswordErrorMessage(changeError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-glow sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
          <KeyRound className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-accent">Seguridad</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">Cambiar contrasena</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">Reemplaza la contrasena temporal por una personal que solo vos conozcas.</p>
        </div>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <PasswordField
          id="current-password"
          label="Contrasena actual o temporal"
          value={currentPassword}
          onChange={setCurrentPassword}
          visible={showPasswords}
          autoComplete="current-password"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <PasswordField
            id="new-password"
            label="Nueva contrasena"
            value={newPassword}
            onChange={setNewPassword}
            visible={showPasswords}
            autoComplete="new-password"
            minLength={8}
          />
          <PasswordField
            id="confirm-password"
            label="Confirmar nueva contrasena"
            value={confirmation}
            onChange={setConfirmation}
            visible={showPasswords}
            autoComplete="new-password"
            minLength={8}
          />
        </div>

        <button
          type="button"
          onClick={() => setShowPasswords((current) => !current)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
        >
          {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showPasswords ? 'Ocultar contrasenas' : 'Mostrar contrasenas'}
        </button>

        {error ? <p className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
        {success ? (
          <p className="flex items-start gap-2 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            {success}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={saving || !currentPassword || !newPassword || !confirmation}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          {saving ? 'Actualizando...' : 'Guardar nueva contrasena'}
        </button>
      </form>
    </section>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  visible,
  autoComplete,
  minLength
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  autoComplete: 'current-password' | 'new-password';
  minLength?: number;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        minLength={minLength}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-accent focus:bg-white focus:ring-2 focus:ring-red-100"
        required
      />
    </div>
  );
}
