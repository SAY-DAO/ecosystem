import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Stack,
} from '@mui/material';

// Mock NGO list
const ngos = [
  {
    id: 1,
    name: 'Save the Children',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/Save_the_Children_logo.svg',
  },
  {
    id: 2,
    name: 'Doctors Without Borders',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5d/Médecins_Sans_Frontières_logo.svg',
  },
  {
    id: 3,
    name: 'World Wildlife Fund',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1f/WWF_logo.svg',
  },
  {
    id: 4,
    name: 'Red Cross',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Emblem_of_the_Red_Cross.svg',
  },
  {
    id: 5,
    name: 'UNICEF',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/6/6e/UNICEF_Logo.svg',
  },
];

export default function ReportNgos() {
  return (
    <Box sx={{ p: 2 }}>
      <Typography
        variant="h5"
        gutterBottom
        sx={{ fontWeight: 700, textAlign: 'center' }}
      >
        Our Partner NGOs
      </Typography>

      <Stack
        direction="row"
        spacing={3}
        sx={{
          overflowX: 'auto',
          py: 1,
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {ngos.map((ngo) => (
          <Card
            key={ngo.id}
            sx={{
              minWidth: 160,
              flexShrink: 0,
              borderRadius: 3,
              textAlign: 'center',
              boxShadow: 4,
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                transform: 'translateY(-6px)',
                boxShadow: 8,
              },
            }}
          >
            <CardMedia
              component="img"
              image={ngo.logo}
              alt={ngo.name}
              sx={{
                objectFit: 'contain',
                height: 80,
                p: 2,
                filter: 'grayscale(30%)',
              }}
            />
            <CardContent sx={{ py: 1 }}>
              <Typography
                variant="body1"
                sx={{ fontWeight: 600, fontSize: '0.9rem' }}
              >
                {ngo.name}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
