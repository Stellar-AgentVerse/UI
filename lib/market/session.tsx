'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  ApiError,
  clearAuthToken,
  getAuthToken,
  getAuthUser,
  requestAuthChallenge,
  toServerFailure,
  verifyWalletAuth,
  type User,
} from '@/lib/api';
import {
  connectWallet,
  explainRejectedSignature,
  readWallet,
  signChallenge,
  WalletError,
  type SignatureScheme,
  type WalletConnection,
} from './wallet';

/**
 * The buyer's identity on the market path.
 *
 * Two facts are tracked separately on purpose:
 *
 *   connected     -- Freighter has told us an address
 *   authenticated -- the backend has accepted a signature from that address
 *                    and issued a JWT
 *
 * Purchase endpoints are JWT-protected, so only the second one may unlock the
 * buy action. Showing a connected address as if it were a session is what
 * makes a "Buy" button fail with 401 after the buyer has already committed.
 *
 * Scope: this is the minimum session the purchase journey needs. The full
 * session lifecycle -- route protection, live account/network watching,
 * post-sign-in intent restoration -- belongs to UI issue #5.
 */

export type SessionStatus =
  | 'loading'
  | 'disconnected'
  | 'connected'
  | 'authenticating'
  | 'authenticated';

export interface MarketSession {
  status: SessionStatus;
  wallet: WalletConnection | null;
  user: User | null;
  error: string | null;
  /** Set when we can name the cause of a rejected signature. */
  diagnosis: string | null;
  connect: () => Promise<void>;
  signIn: () => Promise<boolean>;
  signOut: () => void;
  /** Drop the stored token after a 401 from any market call. */
  invalidate: () => void;
  refreshWallet: () => Promise<void>;
}

const SessionContext = createContext<MarketSession | null>(null);

export function MarketSessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [wallet, setWallet] = useState<WalletConnection | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const applyWallet = useCallback((connection: WalletConnection | null) => {
    if (!mounted.current) return;
    setWallet(connection);

    const storedUser = getAuthUser<User>();
    const hasToken = Boolean(getAuthToken());

    if (!connection) {
      setStatus('disconnected');
      setUser(hasToken ? storedUser ?? null : null);
      return;
    }
    // A stored token that belongs to a different account must never be used to
    // act on behalf of the account now in the wallet.
    if (hasToken && storedUser && storedUser.publicKey !== connection.address) {
      clearAuthToken();
      setUser(null);
      setStatus('connected');
      setError(
        'The wallet switched to a different account, so the previous sign-in was cleared. Sign in again to buy.',
      );
      return;
    }
    if (hasToken && storedUser) {
      setUser(storedUser);
      setStatus('authenticated');
      return;
    }
    setUser(null);
    setStatus('connected');
  }, []);

  const refreshWallet = useCallback(async () => {
    const connection = await readWallet();
    applyWallet(connection);
  }, [applyWallet]);

  // Read the extension once on mount. The state update happens in the promise
  // callback rather than the effect body, which is the "subscribe to an
  // external system" shape rather than a cascading render.
  useEffect(() => {
    let cancelled = false;
    void readWallet().then((connection) => {
      if (!cancelled) applyWallet(connection);
    });
    return () => {
      cancelled = true;
    };
  }, [applyWallet]);

  const connect = useCallback(async () => {
    setError(null);
    setDiagnosis(null);
    try {
      const connection = await connectWallet();
      applyWallet(connection);
    } catch (walletError) {
      if (!mounted.current) return;
      setError(
        walletError instanceof WalletError
          ? walletError.message
          : 'Freighter could not be reached.',
      );
      setStatus('disconnected');
    }
  }, [applyWallet]);

  const signIn = useCallback(async (): Promise<boolean> => {
    setError(null);
    setDiagnosis(null);
    let connection = wallet;
    try {
      if (!connection) connection = await connectWallet();
    } catch (walletError) {
      setError(
        walletError instanceof WalletError
          ? walletError.message
          : 'Freighter could not be reached.',
      );
      setStatus('disconnected');
      return false;
    }

    setWallet(connection);
    setStatus('authenticating');

    let scheme: SignatureScheme = 'unknown';

    try {
      const { challenge } = await requestAuthChallenge(connection.address);
      const signed = await signChallenge(challenge, connection.address);
      scheme = signed.scheme;
      const result = await verifyWalletAuth(connection.address, signed.signatureHex);
      if (!mounted.current) return true;
      setUser(result.user);
      setStatus('authenticated');
      return true;
    } catch (signInError) {
      if (!mounted.current) return false;
      setStatus('connected');
      if (signInError instanceof WalletError) {
        setError(signInError.message);
        return false;
      }
      const failure = toServerFailure(signInError);
      setError(
        failure.status === 0
          ? `The marketplace could not be reached to complete sign-in (${failure.message}).`
          : failure.message,
      );
      if (signInError instanceof ApiError && signInError.status === 401) {
        setDiagnosis(explainRejectedSignature(scheme));
      }
      return false;
    }
  }, [wallet]);

  const signOut = useCallback(() => {
    clearAuthToken();
    setUser(null);
    setDiagnosis(null);
    setError(null);
    setStatus(wallet ? 'connected' : 'disconnected');
  }, [wallet]);

  const invalidate = useCallback(() => {
    clearAuthToken();
    setUser(null);
    setStatus(wallet ? 'connected' : 'disconnected');
    setError('Your session expired. Sign in again to continue.');
  }, [wallet]);

  const value = useMemo<MarketSession>(
    () => ({
      status,
      wallet,
      user,
      error,
      diagnosis,
      connect,
      signIn,
      signOut,
      invalidate,
      refreshWallet,
    }),
    [status, wallet, user, error, diagnosis, connect, signIn, signOut, invalidate, refreshWallet],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useMarketSession(): MarketSession {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useMarketSession must be used inside MarketSessionProvider');
  }
  return context;
}
