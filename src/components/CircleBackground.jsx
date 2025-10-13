/* src/components/CircleBackground.jsx */
/* eslint-disable react/no-array-index-key */
import React from 'react';
import { useTheme, darken, lighten } from '@mui/material/styles';

const baseCircles = [
  { r: 11.5, left: '546.5px', top: '651.5px', color: '#5BD7D2' },
  { r: 23, left: '1266px', top: '1000px', color: '#F05A31' },
  { r: 14.5, left: '-104px', top: '790px', color: '#9ADD51' },
  { r: 24, left: '121px', top: '1300px', color: '#5CD0CC' },
  { r: 13, left: '616px', top: '1500px', color: '#FF8798' },
  { r: 13, left: '116px', top: '1800px', color: '#FFC057' },
  { r: 80, left: '-200px', top: '1850px', color: 'rgb(249,219,189)' },
  { r: 100, left: '36px', top: '190px', color: 'rgb(249,219,189)' },
  { r: 34.5, left: '609.5px', top: '890.5px', color: '#FBB563' },
];

export default function CircleBackground() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const mapColor = (c) => {
    try {
      return isDark ? darken(c, 0.2) : lighten(c, 0.02);
    } catch (e) {
      console.log(e);
      return c;
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {baseCircles.map((c, idx) => (
        <div
          key={idx}
          style={{
            position: 'absolute',
            right: c.left,
            top: c.top,
            width: `${c.r * 2}px`,
            height: `${c.r * 2}px`,
            borderRadius: '50%',
            backgroundColor: mapColor(c.color),
            opacity: isDark ? 0.35 : 0.6,
            zIndex: -1,
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  );
}
