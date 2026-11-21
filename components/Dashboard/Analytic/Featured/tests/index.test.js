/**
 *
 * Tests for AnalyticFeatured
 *
 * @see https://github.com/react-boilerplate/react-boilerplate/tree/master/docs/testing
 *
 */

import React from 'react';
import { render } from 'react-testing-library';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
// import 'jest-dom/extend-expect'; // add some helpful assertions

import AnalyticFeatured from '../index';
import { DEFAULT_LOCALE } from '../../../../../i18n';

describe('<AnalyticFeatured />', () => {
  it('Expect to not log errors in console', () => {
    const spy = jest.spyOn(global.console, 'error');
    render(
      <MemoryRouter><IntlProvider locale={DEFAULT_LOCALE}>
        <AnalyticFeatured />
      </IntlProvider></MemoryRouter>,
    );
    expect(spy).not.toHaveBeenCalled();
  });

  // TODO: add component specific unit tests.

  /**
   * Unskip this test to use it
   *
   * @see {@link https://jestjs.io/docs/en/api#testskipname-fn}
   */
  it.skip('Should render and match the snapshot', () => {
    const {
      container: { firstChild },
    } = render(
      <MemoryRouter><IntlProvider locale={DEFAULT_LOCALE}>
        <AnalyticFeatured />
      </IntlProvider></MemoryRouter>,
    );
    expect(firstChild).toMatchSnapshot();
  });
});
