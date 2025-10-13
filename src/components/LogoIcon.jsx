import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Box, useTheme } from '@mui/material';

function LogoIcon() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        width: '250px',
        fontFamily: 'Exodar-outline !important',
        textAlign: 'center',
      }}
    >
      <Link
        to="https://saydao.org"
        style={{
          textDecoration: 'none',
        }}
      >
        {isDark ? (
          // <img alt="dark logo" src={LogoDark} width={80} />
          <span style={{ color: '#a1a1a1', fontSize: '2em', fontWeight: 200 }}>
            SAY DAO
          </span>
        ) : (
          // LogoLight && <img alt="light logo" src={LogoLight} width={80} />
          <span style={{ color: '#a1a1a1', fontSize: ' 2em', fontWeight: 200 }}>
            SAY DAO
          </span>
        )}
      </Link>
    </Box>
  );
}

export default LogoIcon;
