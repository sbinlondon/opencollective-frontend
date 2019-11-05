import 'intl';
import 'intl/locale-data/jsonp/en.js';
import 'intl-pluralrules';
import '@formatjs/intl-relativetimeformat/polyfill';
import '@formatjs/intl-relativetimeformat/dist/locale-data/en';
import '@formatjs/intl-relativetimeformat/dist/locale-data/fr';
import React from 'react';
import { get } from 'lodash';
import { IntlProvider } from 'react-intl';
import { ThemeProvider } from 'styled-components';
import { ApolloProvider } from 'react-apollo';
import theme from '../lib/theme';
import * as Intl from '../server/intl';
import initClient from '../lib/initClient';

const apolloClient = initClient();

/**
 * A helper to wrap component under all required OC's providers
 *
 * @param {ReactNode} component - the component to render
 * @param {Object} providerParams - parameters to give to the providers:
 *    - IntlProvider: { locale }
 *    - ThemeProvider: { theme }
 */
export const withRequiredProviders = (component, providersParams = {}) => {
  const locale = get(providersParams, 'IntlProvider.locale', 'en');
  return (
    <IntlProvider locale={locale} messages={locale === 'en' ? undefined : Intl.getMessages(locale)}>
      <ApolloProvider client={get(providersParams, 'ApolloProvider.client', apolloClient)}>
        <ThemeProvider theme={get(providersParams, 'ThemeProvider.theme', theme)}>{component}</ThemeProvider>
      </ApolloProvider>
    </IntlProvider>
  );
};
