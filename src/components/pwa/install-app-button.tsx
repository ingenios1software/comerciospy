"use client";

import { Download, ExternalLink, Share, X } from 'lucide-react';
import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  platforms?: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

declare global {
  interface Window {
    __comerciosPyInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

function isRunningStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as NavigatorWithStandalone).standalone === true
  );
}

function getInstallHelp() {
  const userAgent = window.navigator.userAgent;
  const isIos = /iPhone|iPad|iPod/i.test(userAgent);
  const isInAppBrowser = /FBAN|FBAV|Instagram|Line|WhatsApp|; wv\)/i.test(userAgent);

  if (isInAppBrowser) {
    return {
      icon: ExternalLink,
      title: 'Abrir en el navegador',
      description: isIos
        ? 'Este navegador interno no permite instalar la aplicación. Abre el menú y elige “Abrir en Safari”.'
        : 'Este navegador interno no permite instalar la aplicación. Abre el menú y elige “Abrir en Chrome”.'
    };
  }

  if (isIos) {
    return {
      icon: Share,
      title: 'Agregar a inicio',
      description: 'Toca Compartir y luego “Agregar a pantalla de inicio”.'
    };
  }

  return {
    icon: Download,
    title: 'Instalar desde el navegador',
    description: 'Abre el menú del navegador y elige “Instalar aplicación” o “Agregar a pantalla de inicio”.'
  };
}

function hasInstallIntent() {
  const searchParams = new URLSearchParams(window.location.search);

  return searchParams.get('install') === '1' || searchParams.get('source') === 'digital-card';
}

export function InstallAppButton() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(true);
  const [showInstallHelp, setShowInstallHelp] = useState(false);

  useEffect(() => {
    const runningStandalone = isRunningStandalone();
    const shouldInviteInstall = hasInstallIntent();
    let installIntentTimer: number | undefined;

    setIsInstalled(runningStandalone);

    if (shouldInviteInstall && !runningStandalone) {
      installIntentTimer = window.setTimeout(() => setShowInstallHelp(true), 700);
    }

    let cleanupServiceWorker: () => void = () => undefined;

    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      const hadController = Boolean(navigator.serviceWorker.controller);
      let refreshing = false;

      const activateWaitingWorker = (registration: ServiceWorkerRegistration) => {
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
      };

      const handleControllerChange = () => {
        if (!hadController || refreshing) return;
        refreshing = true;
        window.location.reload();
      };

      const registerServiceWorker = () => {
        navigator.serviceWorker
          .register('/sw.js', { updateViaCache: 'none' })
          .then((registration) => {
            activateWaitingWorker(registration);
            registration.update().catch(() => undefined);

            registration.addEventListener('updatefound', () => {
              const worker = registration.installing;

              worker?.addEventListener('statechange', () => {
                if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                  worker.postMessage({ type: 'SKIP_WAITING' });
                }
              });
            });
          })
          .catch(() => undefined);
      };

      if (document.readyState === 'complete') {
        registerServiceWorker();
      } else {
        window.addEventListener('load', registerServiceWorker, { once: true });
      }
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

      cleanupServiceWorker = () => {
        window.removeEventListener('load', registerServiceWorker);
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      const nextInstallPrompt = event as BeforeInstallPromptEvent;
      window.__comerciosPyInstallPrompt = nextInstallPrompt;
      setInstallPrompt(nextInstallPrompt);
      setIsInstalled(false);

      if (hasInstallIntent()) {
        setShowInstallHelp(true);
      }
    };

    const handleAppInstalled = () => {
      window.__comerciosPyInstallPrompt = null;
      setInstallPrompt(null);
      setIsInstalled(true);
      setShowInstallHelp(false);
    };

    const displayMode = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => setIsInstalled(isRunningStandalone());

    if (window.__comerciosPyInstallPrompt) {
      setInstallPrompt(window.__comerciosPyInstallPrompt);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    displayMode.addEventListener('change', handleDisplayModeChange);

    return () => {
      if (installIntentTimer) {
        window.clearTimeout(installIntentTimer);
      }

      cleanupServiceWorker();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      displayMode.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) {
      setShowInstallHelp(true);
      return;
    }

    await installPrompt.prompt();
    await installPrompt.userChoice.catch(() => undefined);
    window.__comerciosPyInstallPrompt = null;
    setInstallPrompt(null);
    setShowInstallHelp(false);
  };

  if (isInstalled) return null;

  const installHelp = installPrompt
    ? {
        icon: Download,
        title: 'Instalar ComerciosPY',
        description: 'Instala la app para abrir fichas, buscar comercios y volver rapido desde tu pantalla de inicio.'
      }
    : getInstallHelp();
  const HelpIcon = installHelp.icon;

  return (
    <>
      <button
        type="button"
        onClick={handleInstall}
        className="fixed bottom-24 right-4 z-40 inline-flex max-w-[calc(100vw-2rem)] items-center justify-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:bottom-6"
        aria-label="Instalar aplicación"
      >
        <Download className="h-4 w-4" />
        <span className="whitespace-nowrap">Instalar aplicación</span>
      </button>

      {showInstallHelp ? (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-help-title"
          onClick={() => setShowInstallHelp(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-5 text-slate-950 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-accent">
                <HelpIcon className="h-5 w-5" />
              </span>
              <button
                type="button"
                onClick={() => setShowInstallHelp(false)}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
                aria-label="Cerrar instrucciones"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <h2 id="install-help-title" className="mt-4 text-lg font-semibold">
              {installHelp.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{installHelp.description}</p>
            <button
              type="button"
              onClick={installPrompt ? handleInstall : () => setShowInstallHelp(false)}
              className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {installPrompt ? 'Instalar ahora' : 'Entendido'}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
