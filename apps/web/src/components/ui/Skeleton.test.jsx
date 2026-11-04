import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton } from './Skeleton.jsx';

describe('Skeleton', () => {
  it('queda oculto para los lectores de pantalla', () => {
    const { container } = render(<Skeleton className="h-4 w-20" />);

    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
    expect(container.firstChild).toHaveClass('rounded-md', 'h-4', 'w-20');
  });

  it('la forma fill no agrega radio, para que lo defina quien lo usa', () => {
    const { container } = render(<Skeleton shape="fill" />);

    expect(container.firstChild).not.toHaveClass('rounded-md');
    expect(container.firstChild).not.toHaveClass('rounded-card');
    expect(container.firstChild).not.toHaveClass('rounded-full');
  });
});
