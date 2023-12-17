import React, { FC } from 'react';
import { MemoryRouter as Router, Switch, Route } from 'react-router-dom';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import GlobalStyles from '@mui/material/GlobalStyles';
import CssBaseline from '@mui/material/CssBaseline';

import { MainForm } from './components/main-form';
import { Box, Grid, Typography } from '@mui/material';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const AppRouter: FC = () => {
  return (
    <Grid
      sx={{
        overflow: 'hidden',
        height: 'calc(100vh - 20px)',
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
          height: '31px',
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
