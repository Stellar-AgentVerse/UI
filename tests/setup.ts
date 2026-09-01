import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// This file runs for every suite, including one that opts into the `node`
// environment because jsdom's Buffer and Uint8Array live in a different realm
// than @noble/ed25519 expects. Guarding the DOM teardown keeps that possible
// without giving each suite its own setup file.
afterEach(() => {
  if (typeof window === 'undefined') return;
  cleanup();
  window.sessionStorage.clear();
});
