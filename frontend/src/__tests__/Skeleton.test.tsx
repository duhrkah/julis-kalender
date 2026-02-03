import { render, screen } from '@testing-library/react';
import {
  Skeleton,
  CalendarSkeleton,
  EventCardSkeleton,
  TableSkeleton,
  FormSkeleton,
} from '@/components/ui/Skeleton';

describe('Skeleton', () => {
  it('renders with default styles', () => {
    render(<Skeleton />);
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Skeleton className="h-10 w-20" />);
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toHaveClass('h-10', 'w-20');
  });
});

describe('CalendarSkeleton', () => {
  it('renders calendar skeleton structure', () => {
    render(<CalendarSkeleton />);
    // Should have header buttons (3)
    const headerButtons = document.querySelectorAll('.animate-pulse');
    expect(headerButtons.length).toBeGreaterThan(5);
  });

  it('renders weekday headers', () => {
    const { container } = render(<CalendarSkeleton />);
    const weekdayGrid = container.querySelector('.grid-cols-7');
    expect(weekdayGrid).toBeInTheDocument();
  });
});

describe('EventCardSkeleton', () => {
  it('renders event card skeleton', () => {
    render(<EventCardSkeleton />);
    const card = document.querySelector('.bg-card');
    expect(card).toBeInTheDocument();
  });
});

describe('TableSkeleton', () => {
  it('renders with default 5 rows', () => {
    const { container } = render(<TableSkeleton />);
    // Header + 5 rows = 6 grid elements
    const rows = container.querySelectorAll('.grid-cols-6');
    expect(rows.length).toBe(6);
  });

  it('renders with custom number of rows', () => {
    const { container } = render(<TableSkeleton rows={3} />);
    // Header + 3 rows = 4 grid elements
    const rows = container.querySelectorAll('.grid-cols-6');
    expect(rows.length).toBe(4);
  });
});

describe('FormSkeleton', () => {
  it('renders form skeleton structure', () => {
    render(<FormSkeleton />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
