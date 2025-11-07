/* eslint-disable react/prop-types */
import React from 'react';
import { Card, CardContent, Typography, Grid } from '@mui/material';
import PaymentTable from './payments/PaymentTable';
import VirtualFamilyRoles from './virtual-families/VirtualFamilyRoles';
import CheckpointLog from './checkpoints/CheckpointLog';
import NeedTimeLine from './needs/NeedTimeLine';
import ChildrenFamilyNetwork from './children/ChildrenFamilyNetwork';

export default function Panel({ id, title, children, align = 'left' }) {
  return (
    <Card elevation={0} sx={{ borderRadius: 2, overflow: 'visible' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }} align={align}>
          {title}
        </Typography>
        {children}
        {/* Transactions table card */}
        {id === 'payments' && (
          <Grid container>
            <PaymentTable />
          </Grid>
        )}
        {id === 'needs' && (
          <Grid container>
            <NeedTimeLine />
          </Grid>
        )}
        {id === 'children' && (
          <Grid container>
            <ChildrenFamilyNetwork />
          </Grid>
        )}

        {id === 'virtualFamilies' && (
          <Grid container>
            <VirtualFamilyRoles />
          </Grid>
        )}
        {id === 'checkpoints' && (
          <Grid item xs={12} md={8} sx={{ m: 'auto' }}>
            <CheckpointLog />
          </Grid>
        )}
      </CardContent>
    </Card>
  );
}
