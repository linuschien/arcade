import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import GameIdBadge from '../GameIdBadge';

describe('GameIdBadge Unit Tests', () => {
  it('renders nothing when title and gameId are empty', () => {
    const { container } = render(<GameIdBadge props={{}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders title and game controller icon without renderer badge when renderer is not specified', () => {
    render(<GameIdBadge props={{ title: 'Pac-Man Classic' }} />);
    expect(screen.getByText('Pac-Man Classic')).toBeInTheDocument();
    expect(screen.getByText('🎮')).toBeInTheDocument();
    expect(screen.queryByText(/WEBGL/)).not.toBeInTheDocument();
    expect(screen.queryByText(/CANVAS/)).not.toBeInTheDocument();
  });

  it('renders WebGL badge when renderer is WebGL', () => {
    render(<GameIdBadge props={{ title: 'Pac-Man Classic', renderer: 'WebGL' }} />);
    expect(screen.getByText('Pac-Man Classic')).toBeInTheDocument();
    expect(screen.getByText('⚡ WEBGL')).toBeInTheDocument();
  });

  it('renders Canvas badge when renderer is Canvas', () => {
    render(<GameIdBadge props={{ title: 'Tetris Classic', renderer: 'Canvas' }} />);
    expect(screen.getByText('Tetris Classic')).toBeInTheDocument();
    expect(screen.getByText('⚠️ CANVAS')).toBeInTheDocument();
  });
});

