import { render, screen, fireEvent } from '@testing-library/react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { ThemeProvider } from '@/components/ui/ThemeProvider';

// Helper to render with ThemeProvider
const renderWithTheme = (component: React.ReactNode) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('ThemeToggle', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('renders the toggle button', () => {
    renderWithTheme(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('opens dropdown menu when clicked', () => {
    renderWithTheme(<ThemeToggle />);
    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Check for theme options
    expect(screen.getByText('Hell')).toBeInTheDocument();
    expect(screen.getByText('Dunkel')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
  });
});
