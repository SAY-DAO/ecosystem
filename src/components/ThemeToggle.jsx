// ThemeToggle.jsx
import React from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useTheme } from '@mui/material/styles';
import { ColorModeContext } from './ColorModeContextProvider';

export default function ThemeToggle() {
  const theme = useTheme();
  const colorMode = React.useContext(ColorModeContext);

  const isDark = theme.palette.mode === 'dark';

  return (
    <Tooltip title="">
      <IconButton
        onClick={colorMode.toggleColorMode}
        color="inherit"
        aria-label="toggle color mode"
        size="large"
      >
        {isDark ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Tooltip>
  );
}
