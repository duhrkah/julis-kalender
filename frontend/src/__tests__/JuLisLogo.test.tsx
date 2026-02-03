import { render, screen } from '@testing-library/react';
import JuLisLogo from '@/components/ui/JuLisLogo';

describe('JuLisLogo', () => {
  it('renders the logo SVG', () => {
    render(<JuLisLogo />);
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('applies custom size', () => {
    render(<JuLisLogo size={60} />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('width', '60');
    expect(svg).toHaveAttribute('height', '60');
  });

  it('applies custom className', () => {
    render(<JuLisLogo className="custom-class" />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveClass('custom-class');
  });

  it('uses default size of 40 when not specified', () => {
    render(<JuLisLogo />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('width', '40');
    expect(svg).toHaveAttribute('height', '40');
  });
});
