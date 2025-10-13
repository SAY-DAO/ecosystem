/* eslint-disable no-undef */
import React from 'react';
import PropTypes from 'prop-types';
import { ThemeProvider, CssBaseline, useMediaQuery } from '@mui/material';
import { getTheme } from '../theme';

export const ColorModeContext = React.createContext({
  toggleColorMode: () => {},
  mode: 'light',
});

export function ColorModeProvider({ children }) {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');

  const [mode, setMode] = React.useState(() => {
    try {
      const stored = localStorage.getItem('app-theme-mode');
      if (stored === 'light' || stored === 'dark') return stored;
    } catch (e) {
      console.log(e);
    }
    return prefersDark ? 'dark' : 'light';
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('app-theme-mode', mode);
    } catch (e) {
      console.log(e);
    }
  }, [mode]);

  const colorMode = React.useMemo(
    () => ({
      toggleColorMode: () =>
        setMode((prev) => (prev === 'light' ? 'dark' : 'light')),
      mode,
    }),
    [mode],
  );

  const theme = React.useMemo(() => getTheme(mode), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

ColorModeProvider.propTypes = {
  children: PropTypes.node,
};
