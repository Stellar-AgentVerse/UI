'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  AlertIcon,
  CheckIcon,
  ClockIcon,
  CopyIcon,
  ErrorIcon,
  InfoIcon,
  SpinnerIcon,
} from './icons';

export type Tone = 'idle' | 'progress' | 'waiting' | 'success' | 'warning' | 'error';

/**
 * Tone styling. Each tone pairs a colour with a distinct icon and an explicit
 * text label, so status is never carried by colour alone (WCAG 1.4.1).
 */
const TONES: Record<
  Tone,
  { text: string; border: string; surface: string; Icon: typeof InfoIcon }
> = {
  idle: {
    text: 'text-on-surface-variant',
    border: 'border-outline-variant/30',
    surface: 'bg-white/5',
    Icon: InfoIcon,
  },
  progress: {
    text: 'text-secondary',
    border: 'border-secondary/35',
    surface: 'bg-secondary/10',
    Icon: SpinnerIcon,
  },
  waiting: {
    text: 'text-secondary',
    border: 'border-secondary/35',
    surface: 'bg-secondary/10',
    Icon: ClockIcon,
  },
  success: {
    text: 'text-accent',
    border: 'border-accent/35',
    surface: 'bg-accent/10',
    Icon: CheckIcon,
  },
  warning: {
    text: 'text-warning',
    border: 'border-warning/35',
    surface: 'bg-warning/10',
    Icon: AlertIcon,
  },
  error: {
    text: 'text-danger',
    border: 'border-danger/35',
    surface: 'bg-danger/10',
    Icon: ErrorIcon,
  },
};

export function StatusBadge({ tone, label }: { tone: Tone; label: string }) {
  const { text, border, surface, Icon } = TONES[tone];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${border} ${surface} ${text}`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </span>
  );
}

/**
 * A block of explanatory state.
 *
 * `live` decides how assistive technology is told about it: 'assertive' for
 * something the buyer must act on now, 'polite' for progress, and 'off' for
 * static explanation that is not a state change.
 */
export function Callout({
  tone,
  title,
  children,
  live = 'off',
  actions,
}: {
  tone: Tone;
  title: string;
  children?: ReactNode;
  live?: 'off' | 'polite' | 'assertive';
  actions?: ReactNode;
}) {
  const { text, border, surface, Icon } = TONES[tone];
  return (
    <div
      className={`rounded-2xl border p-4 ${border} ${surface}`}
      {...(live === 'off'
        ? {}
        : { role: live === 'assertive' ? 'alert' : 'status', 'aria-live': live })}
    >
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${text}`} />
        <div className="min-w-0 flex-1">
          <p className={`font-medium ${text}`}>{title}</p>
          {children ? (
            <div className="mt-1 text-sm leading-relaxed text-on-surface-variant">
              {children}
            </div>
          ) : null}
          {actions ? <div className="mt-3 flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      </div>
    </div>
  );
}

/**
 * A reference value the buyer may need to quote to support.
 *
 * The value is always rendered as selectable text; the copy button is a
 * convenience, so a clipboard permission failure never hides the value.
 */
export function CopyableValue({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = useCallback(async () => {
    setFailed(false);
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setFailed(true);
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setCopied(false);
      setFailed(false);
    }, 4000);
  }, [value]);

  return (
    <div className="rounded-xl border border-outline-variant/20 bg-white/4 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-[0.16em] text-on-surface-variant">
            {label}
          </div>
          <p className="mt-1 break-all font-label text-sm text-on-surface">{value}</p>
        </div>
        <button
          type="button"
          onClick={copy}
          className="focus-ring inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-outline-variant/25 text-on-surface-variant transition-colors hover:border-accent/40 hover:text-primary"
        >
          <CopyIcon className="h-4 w-4" />
          <span className="sr-only">Copy {label}</span>
        </button>
      </div>
      <p aria-live="polite" className="mt-1 min-h-[1.25rem] text-xs text-on-surface-variant">
        {copied ? `${label} copied.` : failed ? 'Could not copy. Select the text instead.' : ''}
      </p>
      {href ? (
        <a
          className="focus-ring mt-2 inline-flex items-center gap-1.5 rounded text-sm font-medium text-accent underline underline-offset-4"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open transaction receipt
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  headingLevel: Heading = 'h3',
}: {
  title: string;
  description: string;
  action?: ReactNode;
  /** So an empty state can sit directly under an h1 without skipping a level. */
  headingLevel?: 'h2' | 'h3';
}) {
  return (
    <div className="rounded-2xl border border-dashed border-outline-variant/30 bg-white/3 px-6 py-12 text-center">
      <Heading className="font-heading text-xl font-semibold text-primary">{title}</Heading>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-on-surface-variant">
        {description}
      </p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title,
  message,
  requestId,
  onRetry,
  retryLabel = 'Try again',
  live = 'polite',
}: {
  title: string;
  message: string;
  requestId?: string;
  onRetry?: () => void;
  retryLabel?: string;
  /**
   * Polite by default: a page can render several of these at once when the
   * backend is down, and four simultaneous assertive alerts interrupt a screen
   * reader without telling it anything the polite queue would not.
   */
  live?: 'polite' | 'assertive';
}) {
  return (
    <Callout
      tone="error"
      title={title}
      live={live}
      actions={
        onRetry ? (
          <button type="button" onClick={onRetry} className="market-button-secondary">
            {retryLabel}
          </button>
        ) : undefined
      }
    >
      <p>{message}</p>
      {requestId ? (
        <p className="mt-2 font-label text-xs text-on-surface-variant">
          Reference: {requestId}
        </p>
      ) : null}
    </Callout>
  );
}

export function CardSkeleton() {
  return (
    <div
      className="h-64 animate-pulse rounded-2xl border border-outline-variant/15 bg-white/4 motion-reduce:animate-none"
      aria-hidden="true"
    />
  );
}
