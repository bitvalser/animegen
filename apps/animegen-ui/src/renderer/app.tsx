import React, { FC } from 'react';
import { MemoryRouter as Router, Switch, Route } from 'react-router-dom';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import GlobalStyles from '@mui/material/GlobalStyles';
import CssBaseline from '@mui/material/CssBaseline';
import './core/firebase';

import { MainForm } from './components/main-form';
import { Box, Grid, Typography } from '@mui/material';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const TITLE_HEIGHT = 31;

const AppRouter: FC = () => {
  return (
    <Grid
      sx={{
        overflow: 'hidden',
        marginTop: `${TITLE_HEIGHT}px`,
        height: `calc(100vh - ${TITLE_HEIGHT}px)`,
        boxSizing: 'border-box',
      }}
      direction="column"
    >
      <Router>
        <Switch>
          <Route path="/" component={MainForm} />
        </Switch>
      </Router>
    </Grid>
  );
};

export default function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <GlobalStyles
        styles={{
          body: {
            overflow: 'hidden',
            margin: 0,
          },
          '#root': {
            height: '100vh',
          },
        }}
      />
      <CssBaseline />
      <Box
        sx={{
          height: `${TITLE_HEIGHT}px`,
          position: 'fixed',
          top: 0,
          zIndex: 99999,
          width: '100vw',
          backgroundColor: '#2f3241',
          '-webkit-app-region': 'drag',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '10px',
        }}
      >
        <Typography fontWeight={700}>SI Anime Generator</Typography>
      </Box>
      <AppRouter />
    </ThemeProvider>
  );
}
