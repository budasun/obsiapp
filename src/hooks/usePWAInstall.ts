import { useState, useEffect, useCallback } from 'react';

/**
 * Interfaz que extiende el evento nativo para tipar `beforeinstallprompt`,
 * ya que TypeScript no lo incluye en sus tipos DOM.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

interface UsePWAInstallReturn {
  /** true si el navegador disparó `beforeinstallprompt` y la app es instalable */
  isInstallable: boolean;
  /** true si la app ya está corriendo en modo standalone (ya fue instalada) */
  isInstalled: boolean;
  /** Dispara el prompt nativo de instalación. Retorna true si el usuario aceptó. */
  installApp: () => Promise<boolean>;
}

export function usePWAInstall(): UsePWAInstallReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detectar si la app ya está instalada (corriendo en modo standalone/twa)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setIsInstalled(true);
      return; // No necesitamos escuchar el prompt si ya está instalada
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevenir que el navegador muestre su mini-infobar automática
      e.preventDefault();
      // Guardar el evento para usarlo después cuando la usuaria haga clic
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      // La app fue instalada exitosamente
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    try {
      // Mostrar el prompt nativo del navegador
      await deferredPrompt.prompt();

      // Esperar a que la usuaria responda
      const { outcome } = await deferredPrompt.userChoice;

      // Limpiar el evento — solo se puede usar una vez
      setDeferredPrompt(null);

      if (outcome === 'accepted') {
        setIsInstalled(true);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error al instalar PWA:', error);
      setDeferredPrompt(null);
      return false;
    }
  }, [deferredPrompt]);

  return {
    isInstallable: !!deferredPrompt && !isInstalled,
    isInstalled,
    installApp,
  };
}
