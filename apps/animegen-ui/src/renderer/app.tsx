import React, { FC } from 'react';
import { MemoryRouter as Router, Switch, Route } from 'react-router-dom';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import GlobalStyles from '@mui/material/GlobalStyles';
import CssBaseline from '@mui/material/CssBaseline';

import { MainForm } from './components/main-form';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const AppRouter: FC = () => {
  return (
    <Router>
      <Switch>
        <Route path="/" component={MainForm} />
      </Switch>
    </Router>
  );
};

export default function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <GlobalStyles
        styles={{
          '#root': {
            height: '100vh',
          },
        }}
      />
      <CssBaseline />
      <AppRouter />
    </ThemeProvider>
  );
}
