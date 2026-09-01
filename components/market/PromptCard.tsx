import Link from 'next/link';
import type { MarketplaceItem } from '@/lib/api';
import { ArrowRightIcon, PromptIcon } from './icons';

/**
 * A catalog entry.
 *
 * The whole card is one link to the real detail route, which is both the
 * behaviour issue #6 asks for and the reason it is keyboard operable: a single
 * tab stop, activated by Enter, with a visible focus ring (WCAG 2.1.1, 2.4.7).
 * There is no second interactive element inside, so no nested-control problem.
 *
 * Every value shown comes from the catalog response. Where the backend has no
 * data -- an unrated prompt, one with no executions -- the card says so rather
 * than printing a zero that reads like a measurement.
 */
export function PromptCard({ item }: { item: MarketplaceItem }) {
  const rating = Number(item.rating);
  const hasRating = Number.isFinite(rating) && rating > 0;

  return (
    <Link
      href={`/assets/${item.id}`}
      className="focus-ring group flex h-full flex-col rounded-2xl border border-outline-variant/15 bg-white/4 p-5 transition-all hover:border-accent/30 hover:bg-white/6 motion-safe:hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-accent">
          <PromptIcon className="h-3.5 w-3.5" />
          Prompt
        </span>
        {hasRating ? (
          <span className="text-sm text-on-surface-variant">
            Rated {rating.toFixed(1)} / 5
          </span>
        ) : (
          <span className="text-sm text-on-surface-variant">No ratings yet</span>
        )}
      </div>

      <h3 className="mt-4 font-heading text-xl font-semibold text-primary">
        {item.title}
      </h3>
      <p className="mt-1 font-label text-xs text-on-surface-variant">
        Published by {item.creator}
      </p>

      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-on-surface-variant">
        {item.description?.trim() || 'This prompt has no description yet.'}
      </p>

      <div className="mt-auto flex items-end justify-between gap-4 border-t border-outline-variant/15 pt-4">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-on-surface-variant">
            Listed price
          </div>
          <div className="mt-1 text-lg font-semibold text-primary">
            {item.priceValue > 0
              ? `${item.priceValue.toLocaleString()} ${item.currency}`
              : 'Free'}
          </div>
          <div className="mt-1 text-xs text-on-surface-variant">
            {item.executions > 0
              ? `${item.executions.toLocaleString()} recorded executions`
              : 'No recorded executions'}
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
          View details
          <ArrowRightIcon className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
