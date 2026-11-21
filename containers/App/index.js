import React from 'react';
import Routes from 'containers/__Routes/Loadable';

import { Helmet } from 'react-helmet';
import { ThemeProvider } from '@material-ui/core/styles';
import { ToastContainer } from 'react-toastify';

import 'react-toastify/dist/ReactToastify.min.css';
import GlobalStyle from '../../global-styles';
import theme from '../../material-theme';

import './style.scss';

const App = props => (
  <ThemeProvider theme={theme}>
    <GlobalStyle />
    <Helmet defaultTitle="HotelsQuad" />
    <Routes />
    <ToastContainer position="top-center" />
  </ThemeProvider>
);
export default App;
