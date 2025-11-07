import React, { useEffect, useMemo, useState } from 'react';
import {
  CircularProgress,
  Grid,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Chart from 'react-apexcharts';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { fetchDeliveredNeeds } from '../../features/needsSlice';
import { NeedTypeEnum } from '../../utils/types';
import { daysDifference } from '../../utils/helpers';

function NeedTimeLine() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const { t, i18n } = useTranslation(); // <<-- requested

  const [page, setPage] = useState(1);
  const [needType, setNeedType] = useState(NeedTypeEnum.PRODUCT);
  const pageSize = 10;

  const deliveredNeeds = useSelector((s) => s.needs?.deliveredNeeds) || {
    delivered: [],
    count: 0,
  };
  const loading = useSelector((s) => s.needs?.loading);

  const delivered = deliveredNeeds.delivered || [];
  const totalCount = deliveredNeeds.count || 0;

  const { blue, purple, red, darkOrange, darkGreen, darkRed } =
    theme.palette.charts || {};

  useEffect(() => {
    dispatch(
      fetchDeliveredNeeds({
        needType,
        page,
        limit: pageSize,
      }),
    );
  }, [dispatch, page, needType]);

  const normalizeColor = (c, fallback) => {
    if (!c) return fallback;
    if (typeof c === 'string') return c;
    if (c.main) return c.main;
    if (c[500]) return c[500];
    return fallback;
  };

  const chartColors = [
    normalizeColor(blue, '#1976d2'),
    normalizeColor(purple, '#9c27b0'),
    normalizeColor(red, '#f44336'),
    normalizeColor(darkOrange, '#ffb300'),
    normalizeColor(darkGreen, '#4caf50'),
    normalizeColor(darkRed, '#b71c1c'),
  ];

  const chartValues = useMemo(() => {
    const localeKey =
      i18n &&
      typeof i18n.language === 'string' &&
      i18n.language.startsWith('fa')
        ? 'fa'
        : 'en';
    const categories = delivered.map(
      (n) => n.name_translations?.[localeKey] ?? '—',
    );

    // create -> confirm
    const s1 = delivered.map((n) => daysDifference(n.confirmDate, n.created));

    // confirm -> fully Paid
    const s2 = delivered.map((n) => daysDifference(n.doneAt, n.confirmDate));

    // fully Paid -> purchase - only product
    const s3 = delivered.map((n) => daysDifference(n.purchase_date, n.doneAt));

    //  retailer delivery/transfer -> NGO received
    const s4 = delivered.map((n) =>
      n.type === NeedTypeEnum.PRODUCT
        ? daysDifference(n.ngo_delivery_date, n.purchase_date)
        : daysDifference(n.ngo_delivery_date, n.doneAt),
    );
    //  NGO receiver -> delivered
    const s5 = delivered.map((n) =>
      daysDifference(n.child_delivery_date, n.ngo_delivery_date),
    );

    // total
    const s6 = delivered.map((n) =>
      daysDifference(n.child_delivery_date, n.created),
    );

    const allSeries =
      needType === NeedTypeEnum.PRODUCT
        ? [s1, s2, s3, s4, s5, s6]
        : [s1, s2, s4, s5, s6];

    const targetLen = categories.length;
    const paddedSeries = allSeries.map((arr) => {
      const safe = Array.isArray(arr)
        ? arr.map((v) => (v === undefined ? null : v))
        : [];
      if (safe.length < targetLen)
        return safe.concat(Array(targetLen - safe.length).fill(null));
      if (safe.length > targetLen) return safe.slice(0, targetLen);
      return safe;
    });

    const seriesTimeLine =
      needType === NeedTypeEnum.PRODUCT
        ? [
            {
              name: t('need.timeLines.timeline.series.registerToConfirm'),
              data: paddedSeries[0],
            },
            { name: t('need.timeLines.timeline.series.confirmToPay'), data: paddedSeries[1] },
            { name: t('need.timeLines.timeline.series.payToPurchase'), data: paddedSeries[2] },
            { name: t('need.timeLines.timeline.series.purchaseToNgo'), data: paddedSeries[3] },
            { name: t('need.timeLines.timeline.series.ngoToChild'), data: paddedSeries[4] },
            { name: t('need.timeLines.timeline.series.total'), data: paddedSeries[5] },
          ]
        : [
            {
              name: t('need.timeLines.timeline.series.registerToConfirm'),
              data: paddedSeries[0],
            },
            { name: t('need.timeLines.timeline.series.confirmToPay'), data: paddedSeries[1] },
            { name: t('need.timeLines.timeline.series.payToService'), data: paddedSeries[2] },
            {
              name: t('need.timeLines.timeline.series.documentFromNgo'),
              data: paddedSeries[3],
            },
            { name: t('need.timeLines.timeline.series.total'), data: paddedSeries[4] },
          ];

    const optionsTimeLine = {
      theme: { mode: isDark ? 'dark' : 'light' },
      colors: chartColors,
      chart: {
        id: `need-timeline-chart-${page}`,
        animations: { enabled: true },
        toolbar: { show: false },
        background: '#0b1220',
      },

      noData: { text: t('chart.noData') },
      xaxis: {
        categories,
        labels: {
          rotate: -45,
          trim: true,
          style: {
            colors: categories.map(() => (isDark ? '#E0E0E0' : '#333')),
          },
        },
      },
      tooltip: {
        y: {
          formatter: (val) =>
            val === null || val === undefined
              ? '—'
              : `${val} ${t('need.timeLines.chart.days')}`,
        },
      },
      yaxis: {
        min: 0,
        labels: {
          formatter: (val) =>
            val === null || val === undefined ? '' : Math.round(val),
          style: { color: isDark ? '#E0E0E0' : '#333' },
        },
      },
      legend: { show: true, position: 'top' },
      stroke: { width: 3, curve: 'smooth' },
      markers: { size: 4 },
      grid: { borderColor: isDark ? '#2b2b2b' : '#e7e7e7' },
    };

    return { optionsTimeLine, seriesTimeLine };
  }, [delivered, page, chartColors, isDark, needType, t, i18n]);

  const chartKey = useMemo(() => {
    const ids = delivered.map((d) => d.id).join('_') || 'empty';
    return `page-${page}-type-${needType}-ids-${ids}`;
  }, [delivered, page, needType]);

  const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1);
  const handleChange = (event, value) => setPage(value);

  const handleTypeChange = (event) => {
    const newType = event.target.value;
    setNeedType(newType);
    setPage(1);
  };

  if (loading || !chartValues) {
    return (
      <Grid sx={{ textAlign: 'center' }}>
        <CircularProgress />
      </Grid>
    );
  }

  return (
    <Grid container direction="column" spacing={2} alignItems="center">
      {/* Chart: responsive centered container */}
      <Grid
        item
        sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}
      >
        <div style={{ width: '100%', maxWidth: 1200 }}>
          <Chart
            key={chartKey}
            options={chartValues.optionsTimeLine}
            series={chartValues.seriesTimeLine}
            type="line"
            height="560"
            style={{
              direction:
                i18n && i18n.language && i18n.language.startsWith('fa')
                  ? 'rtl'
                  : 'ltr',
            }}
          />
        </div>
      </Grid>
      {/* Dropdown */}
      <Grid
        item
        sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}
      >
        <FormControl sx={{ width: '100%', maxWidth: 360 }} size="small">
          <InputLabel id="need-type-label">
            {t('need.timeLines.filter.needTypeLabel')}
          </InputLabel>
          <Select
            labelId="need-type-label"
            id="need-type-select"
            value={needType}
            label={t('need.timeLines.filter.needTypeLabel')}
            onChange={handleTypeChange}
          >
            <MenuItem value={NeedTypeEnum.PRODUCT}>
              {t('need.timeLines.filter.product')}
            </MenuItem>
            <MenuItem value={NeedTypeEnum.SERVICE}>
              {t('need.timeLines.filter.service')}
            </MenuItem>
          </Select>
        </FormControl>
      </Grid>

      {/* Pagination: centered */}
      <Grid
        item
        // xs={12}
        sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}
      >
        <Pagination
          sx={{ m: 'auto', mt: 2 }}
          count={totalPages}
          page={page}
          onChange={handleChange}
          variant="outlined"
          color="primary"
          aria-label={t('pagination.ariaLabel')}
        />
      </Grid>
    </Grid>
  );
}

export default NeedTimeLine;
