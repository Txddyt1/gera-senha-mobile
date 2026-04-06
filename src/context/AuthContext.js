import React, { createContext, useContext, useEffect, useState } from 'react';
import { clearAuthSession, loadAuthSession, saveAuthSession } from '../services/authStorage';
import {
  signIn as requestSignIn,
  signOut as requestSignOut,
  signUp as requestSignUp,
  validateSession,
} from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authSession, setAuthSession] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function hydrateAuth() {
      const storedSession = await loadAuthSession();

      if (!storedSession?.token) {
        if (isMounted) {
          setAuthSession(null);
          setIsBootstrapping(false);
        }
        return;
      }

      try {
        const validatedSession = await validateSession(storedSession.token);

        if (!isMounted) {
          return;
        }

        const nextSession = {
          token: storedSession.token,
          user: validatedSession.user,
        };

        setAuthSession(nextSession);
        await saveAuthSession(nextSession);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setAuthSession(null);
        await clearAuthSession();
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    }

    hydrateAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const signIn = async ({ email, password }) => {
    try {
      const nextSession = await requestSignIn({ email, password });
      await saveAuthSession(nextSession);
      setAuthSession(nextSession);

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message: error?.message || 'Nao foi possivel realizar o login.',
      };
    }
  };

  const signUp = async ({ name, email, password, confirmPassword }) => {
    try {
      await requestSignUp({
        name,
        email,
        password,
        confirmPassword,
      });

      const nextSession = await requestSignIn({ email, password });
      await saveAuthSession(nextSession);
      setAuthSession(nextSession);

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message: error?.message || 'Nao foi possivel concluir o cadastro.',
      };
    }
  };

  const signOut = async () => {
    const currentToken = authSession?.token;

    try {
      if (currentToken) {
        await requestSignOut(currentToken);
      }
    } catch (error) {
      // JWT e stateless; se a API falhar, a sessao local ainda precisa ser removida.
    } finally {
      setAuthSession(null);
      await clearAuthSession();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        authSession,
        isAuthenticated: !!authSession?.token,
        isBootstrapping,
        signIn,
        signOut,
        signUp,
        token: authSession?.token || null,
        user: authSession?.user || null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  }

  return context;
}
