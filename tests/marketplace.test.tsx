import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MarketplacePage from '@/app/marketplace/page';

vi.mock('@/lib/queries', () => ({
  useFeatured: () => ({ data: undefined, isError: true }),
  useTrending: () => ({ data: undefined, isError: true }),
  useCategories: () => ({ data: undefined, isError: true }),
  useSearchAssets: () => ({ data: undefined, isError: false }),
}));
vi.mock('@/components/agentverse/NavBar', () => ({ default: () => <nav /> }));
vi.mock('@/components/agentverse/Footer', () => ({ default: () => <footer /> }));
vi.mock('@/components/agentverse/GlassCard', () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));

describe('marketplace live mode', () => {
  it('shows the API error and never renders fallback demo assets', () => {
    render(<MarketplacePage />);

    expect(screen.getByRole('alert')).toHaveTextContent('Unable to load marketplace data.');
    expect(screen.queryByText('Nova-7 Strategist')).not.toBeInTheDocument();
    expect(screen.queryByText('CodeArchitect v2')).not.toBeInTheDocument();
  });
});
