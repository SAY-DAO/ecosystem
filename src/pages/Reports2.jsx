/* eslint-disable no-plusplus */
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Stack,
  Container,
  useTheme,
  Divider,
  Skeleton,
  Autocomplete,
} from '@mui/material';
import {
  fetchSummary,
  fetchSeasonComparison,
  fetchTransactions,
  fetchCheckpoints,
} from '../features/reportSlice';
import PaymentTable from '../components/payments/PaymentTable';
import Comparison from '../components/Comparison';
import NeedFrequencyChart from '../components/needs/NeedFrequencyChart';
import VirtualFamilyRoles from '../components/virtual-families/VirtualFamilyRoles';
import ReportNgos from '../components/needs/ReportNgos';
import CheckpointLog from '../components/checkpoints/CheckpointLog';

function getYearsDescending(fromYear = 2019) {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear; year >= fromYear; year--) {
    years.push(year.toString());
  }
  return years;
}

const options = getYearsDescending();

export default function ReportPage() {
  const theme = useTheme();
  const dispatch = useDispatch();

  const summary = useSelector((s) => s.report.summary || {});
  const seasonComparison = useSelector((s) => s.report.season || null);
  const checkpoints = useSelector((s) => s.report.checkpoints || []);

  const loadingSummary = useSelector((s) => s.report.loadingSummary);
  const loadingCheckPoints = useSelector((s) => s.report.loadingCheckPoints);

  const [inputValue, setInputValue] = useState('');

  // transactions pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [season, setSeason] = useState(options[1]);

  // polling interval (ms)
  const POLL_MS = 30000; // 30s

  // initial load
  useEffect(() => {
    dispatch(fetchSummary());
    dispatch(fetchSeasonComparison({ season, includeRates: false }));
    dispatch(fetchCheckpoints());
    // load recent transactions with no range
    dispatch(
      fetchTransactions({
        page,
        rowsPerPage,
        start: null,
        end: null,
      }),
    );
  }, []);

  useEffect(() => {
    if (season) {
      dispatch(fetchSeasonComparison({ season, includeRates: false }));
    }
  }, [dispatch, season]);

  // polling summary
  useEffect(() => {
    const id = setInterval(() => {
      dispatch(fetchSummary());
    }, POLL_MS);
    return () => clearInterval(id);
  }, [dispatch]);

  const totals = useMemo(() => {
    const totalUsers = summary.totalUsers ?? null;
    const totalNeeds = summary.totalNeeds ?? null;
    const totalPayments = summary.totalPayments ?? null;
    const { totalDoneNeeds } = summary;
    const totalChildren = summary.totalChildren ?? null;

    return {
      totalUsers,
      totalNeeds,
      totalPayments,
      totalDoneNeeds,
      totalChildren,
    };
  }, [summary]);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      {/* Top live metrics */}
      <Divider sx={{ mb: 3 }} />
      <Grid container justifyContent="center" spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                خانواده مجازی
              </Typography>
              {loadingSummary ? (
                <Skeleton width={120} height={36} />
              ) : (
                <Typography
                  variant="h5"
                  sx={{ mt: 1, color: theme.palette.primary.dark }}
                >
                  {totals.totalUsers != null
                    ? totals.totalUsers.toLocaleString()
                    : '—'}
                </Typography>
              )}
              <Typography
                sx={{ fontSize: 10 }}
                variant="body2"
                color="text.secondary"
              >
                تعداد اعضای خانواده‌های مجازی
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                نیازهای تکمیل‌شده
              </Typography>
              {loadingSummary ? (
                <Skeleton width={80} height={28} />
              ) : (
                <Typography variant="h5" sx={{ mt: 1 }}>
                  {totals.totalDoneNeeds ?? '—'}
                </Typography>
              )}
              {loadingSummary ? (
                <Skeleton width={80} height={28} />
              ) : (
                <Typography
                  sx={{ fontSize: 10 }}
                  variant="body1"
                  color="text.secondary"
                >
                  {totals.totalNeeds ?? '—'} نیاز قابل پرداخت
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                مجموع پرداخت‌ها
              </Typography>
              {loadingSummary ? (
                <Skeleton width={80} height={28} />
              ) : (
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {totals.totalPayments
                    ? totals.totalPayments.toLocaleString('en-US')
                    : '—'}{' '}
                  <span style={{ fontSize: 12, color: 'grey' }}>تومان</span>
                </Typography>
              )}
              <Typography
                sx={{ fontSize: 10 }}
                variant="body2"
                color="text.secondary"
              >
                مجموع هزینه پرداخت شده برای تمام نیازها
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                تعداد کودکان تحت پوشش
              </Typography>
              {loadingSummary ? (
                <Skeleton width={80} height={28} />
              ) : (
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {totals.totalChildren ?? '—'}
                </Typography>
              )}
              <Typography
                sx={{ fontSize: 10 }}
                variant="body2"
                color="text.secondary"
              >
                ۲ کودک در انتظار تکمیل ثبت‌نام
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container justifyContent="center" spacing={2}>
        {/* LEFT: 1/3 - CheckPoints */}
        <Grid item xs={12} md={4}>
          <Card sx={{ minHeight: '92vh' }}>
            <CardContent>
              {loadingCheckPoints ? (
                <Stack spacing={1}>
                  <Skeleton variant="rectangular" height={40} />
                  <Skeleton variant="rectangular" height={40} />
                  <Skeleton variant="rectangular" height={40} />
                  <Skeleton variant="rectangular" height={40} />
                  <Skeleton variant="rectangular" height={40} />
                  <Skeleton variant="rectangular" height={40} />
                  <Skeleton variant="rectangular" height={40} />
                  <Skeleton variant="rectangular" height={40} />
                  <Skeleton variant="rectangular" height={40} />
                  <Skeleton variant="rectangular" height={40} />
                  <Skeleton variant="rectangular" height={40} />
                  <Skeleton variant="rectangular" height={40} />
                </Stack>
              ) : (
                <CheckpointLog />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* RIGHT: 2/3 - Transactions table + charts */}
        <Grid container spacing={2} item xs={12} md={8}>
          {/* Transactions table card */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 1 }}
                >
                  <Typography variant="h6">تراکنش‌ها</Typography>
                </Stack>
                <PaymentTable
                  page={page}
                  setPage={setPage}
                  rowsPerPage={rowsPerPage}
                  setRowsPerPage={setRowsPerPage}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card sx={{ width: '100%' }}>
              <ReportNgos />
            </Card>
          </Grid>
        </Grid>

        {seasonComparison && (
          <Grid container justifyContent="center" spacing={2} sx={{ mt: 2 }}>
            <Card sx={{ width: '100%' }}>
              <CardContent>
                <Autocomplete
                  value={season}
                  onChange={(event, newValue) => {
                    setSeason(newValue);
                  }}
                  inputValue={inputValue}
                  onInputChange={(event, newInputValue) => {
                    setInputValue(newInputValue);
                  }}
                  id="controllable-states-demo"
                  options={options}
                  sx={{ width: 300 }}
                  renderInput={(params) => (
                    <TextField {...params} label="Controllable" />
                  )}
                />
                <Grid container spacing={2} item xs={12}>
                  <Grid item xs={12} md={3}>
                    <Comparison
                      data={seasonComparison.totalUsers.data}
                      title="خانواده مجازی"
                      season={season}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Comparison
                      data={seasonComparison.doneNeeds.data}
                      title="نیازهای تکمیل شده"
                      season={season}
                    />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <Comparison
                      data={seasonComparison.pays.data}
                      title="پرداخت‌ها"
                      season={season}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Comparison data={[]} title="مددکاران" season={season} />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
        <Grid container spacing={2} item xs={12}>
          <Grid item xs={12} md={12}>
            <VirtualFamilyRoles />
          </Grid>
          <Grid item xs={12} md={12}>
            <NeedFrequencyChart />
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
}
