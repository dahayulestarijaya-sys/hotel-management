/**
 * Tests for the application routes container.
 *
 * Rendering the whole route tree requires a store, a router and every private
 * layout component, so this suite simply makes sure the container exports are
 * wired up correctly.
 */

import RouteContainer, { Routes } from '../index';

describe('containers/__Routes', () => {
  it('exports the routes component', () => {
    expect(Routes).toBeDefined();
    expect(typeof Routes).toBe('function');
  });

  it('exports an intl aware default container', () => {
    expect(RouteContainer).toBeDefined();
  });
});
