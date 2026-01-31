import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('Smoke Test', () => {
  it('should pass if 1 + 1 = 2', () => {
    expect(1 + 1).toBe(2);
  });

  it('should render a component', () => {
    render(<div data-testid="test">Hello World</div>);
    expect(screen.getByTestId('test')).toHaveTextContent('Hello World');
  });
});
