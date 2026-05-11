import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  signIn as requestSignIn,
  signOut as requestSignOut,
  signUp as requestSignUp,
  validateSession,
} from '../services/authService';
import { persistStorage } from '../services/storeStorage';

export const AUTH_STORAGE_KEY = '@demo/auth-session';

function shouldKeepStoredSession(error) {
  const message = String(error?.message || '');

  return !message.includes('Token JWT');
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      authSession: null,
      hasHydrated: false,
      isBootstrapping: true,
      bootstrapAuth: async () => {
        const storedSession = get().authSession;

        if (!storedSession?.token) {
          set({
            authSession: null,
            isBootstrapping: false,
          });
          return;
        }

        set({ isBootstrapping: true });

        try {
          const validatedSession = await validateSession(storedSession.token);
          const nextSession = {
            token: storedSession.token,
            user: validatedSession.user,
          };

          set({ authSession: nextSession });
        } catch (error) {
          if (shouldKeepStoredSession(error)) {
            set({ authSession: storedSession });
            return;
          }

          set({ authSession: null });
        } finally {
          set({ isBootstrapping: false });
        }
      },
      clearAuthSession: () => {
        set({ authSession: null });
      },
      setAuthSession: (authSession) => {
        set({ authSession });
      },
      setHasHydrated: (hasHydrated) => {
        set({ hasHydrated });
      },
      signIn: async ({ email, password }) => {
        try {
          const nextSession = await requestSignIn({ email, password });
          set({ authSession: nextSession });

          return { ok: true };
        } catch (error) {
          return {
            ok: false,
            message: error?.message || 'Nao foi possivel realizar o login.',
          };
        }
      },
      signOut: async () => {
        const currentToken = get().authSession?.token;

        try {
          if (currentToken) {
            await requestSignOut(currentToken);
          }
        } catch (error) {
          // JWT e stateless; se a API falhar, a sessao local ainda precisa ser removida.
        } finally {
          set({ authSession: null });
        }
      },
      signUp: async ({ name, email, password, confirmPassword }) => {
        try {
          await requestSignUp({
            confirmPassword,
            email,
            name,
            password,
          });

          const nextSession = await requestSignIn({ email, password });
          set({ authSession: nextSession });

          return { ok: true };
        } catch (error) {
          return {
            ok: false,
            message: error?.message || 'Nao foi possivel concluir o cadastro.',
          };
        }
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: state => ({
        authSession: state.authSession,
      }),
      storage: persistStorage,
    },
  ),
);
