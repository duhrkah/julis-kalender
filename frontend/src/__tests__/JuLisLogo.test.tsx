import { render, screen } from '@testing-library/react';
import JuLisLogo from '@/components/ui/JuLisLogo';

// next/image renders an img in production; in Jest it may need mocking
jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage({
    src,
    alt,
    width,
    height,
    className,
  }: {
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
  }) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} width={width} height={height} className={className} />
    );
  },
}));

describe('JuLisLogo', () => {
  it('renders the logo image', () => {
    render(<JuLisLogo />);
    const img = screen.getByRole('img', { name: /julis logo/i });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/logo.svg');
  });

  it('applies custom size', () => {
    render(<JuLisLogo size={60} />);
    const img = screen.getByRole('img', { name: /julis logo/i });
    expect(img).toHaveAttribute('width', '60');
    expect(img).toHaveAttribute('height', '60');
  });

  it('applies custom className', () => {
    render(<JuLisLogo className="custom-class" />);
    const img = screen.getByRole('img', { name: /julis logo/i });
    expect(img).toHaveClass('custom-class');
  });

  it('uses default size of 40 when not specified', () => {
    render(<JuLisLogo />);
    const img = screen.getByRole('img', { name: /julis logo/i });
    expect(img).toHaveAttribute('width', '40');
    expect(img).toHaveAttribute('height', '40');
  });
});
