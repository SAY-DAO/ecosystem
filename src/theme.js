// theme.js
import { createTheme } from '@mui/material/styles';

const basePalette = {
  primary: {
    main: '#FF8417',
    light: '#f5ad9a',
    dark: '#F05A31',
  },
  secondary: {
    main: '#1e4db7',
    light: '#ddebff',
    dark: '#173f98',
  },

  success: {
    main: '#00c292',
    light: '#ebfaf2',
    dark: '#00964b',
    contrastText: '#ffffff',
  },
  danger: {
    main: '#e46a76',
    light: '#fdf3f5',
  },
  info: {
    main: '#0bb2fb',
    light: '#a7e3f4',
  },
  error: {
    main: '#e46a76',
    light: '#E91E63',
    dark: '#e45a68',
  },
  warning: {
    main: '#fec90f',
    light: '#fff4e5',
    dark: '#dcb014',
    contrastText: '#ffffff',
  },
  text: {
    secondary: '#777e89',
    danger: '#fc4b6c',
  },
  grey: {
    A100: '#ecf0f2',
    A400: '#767e89',
    A700: '#e6f4ff',
  },
};

const lightPalette = {
  mode: 'light',
  background: {
    default: '#f6f8fb',
    paper: '#ffffff',
  },
  text: {
    primary: '#0f1724',
    secondary: '#6b7280',
  },
  action: {
    hover: 'rgba(2,6,23,0.04)',
    selected: 'rgba(37,99,235,0.08)',
  },
  divider: 'rgba(15,23,36,0.06)',
  ...basePalette,
};

const darkPalette = {
  mode: 'dark',
  background: {
    default: '#0b1220',
    paper: '#0f1724',
  },
  text: {
    primary: '#f1f5f9',
    secondary: '#94a3b8',
  },
  action: {
    hover: 'rgba(255,255,255,0.06)',
    selected: 'rgba(96,165,250,0.12)',
  },
  divider: 'rgba(241,245,249,0.08)',
  ...basePalette,
};

export const getTheme = (mode = 'light') =>
  createTheme({
    direction: 'rtl',
    palette: mode === 'light' ? lightPalette : darkPalette,
    typography: {
      fontFamily:
        "'IranYekan', Inter, Roboto, 'Helvetica Neue', Arial, sans-serif",
      h4: { fontWeight: 700 },
      h6: { fontWeight: 700 },
      body2: { fontSize: '0.95rem' },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            border: 'none',
            padding: 8,
          },
        },
      },
      MuiListItemButton: {
        defaultProps: {
          disableRipple: false,
        },
        styleOverrides: {
          root: {
            borderRadius: 10,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 10,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
    },
  });

export default getTheme;
