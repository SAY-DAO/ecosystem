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
import { fetchDeliveredNeeds } from '../../features/needsSlice';
import { NeedTypeEnum } from '../../utils/types';
import { daysDifference } from '../../utils/helpers';

function NeedTimeLine() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

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
    const categories = delivered.map((n) => n.name_translations?.fa ?? '—');

    // create -> confirm
    const s1 = delivered.map((n) => daysDifference(n.confirmDate, n.created));

    // confirm -> fully Paid
    const s2 = delivered.map((n) => daysDifference(n.doneAt, n.confirmDate));

    // fully Paid -> purchase - only product
    const s3 = delivered.map((n) => daysDifference(n.purchase_date, n.doneAt));

    //  retailer delivery/transfer -> NGO received
    // ngo_delivery_date for service is updated via status_event when status changes to 3 / backend / need_model.py
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
            { name: 'ثبت تا تایید', data: paddedSeries[0] },
            { name: 'تایید تا پرداخت', data: paddedSeries[1] },
            {
              name: needType === NeedTypeEnum.PRODUCT && 'پرداخت تا خرید کالا',
              data: paddedSeries[2],
            },
            {
              name: 'خرید تا دریافت کالا',
              data: paddedSeries[3],
            },
            {
              name: 'کودک دریافت کرد',
              data: paddedSeries[4],
            },
            { name: 'مجموع', data: paddedSeries[5] },
          ]
        : [
            { name: 'ثبت تا تایید', data: paddedSeries[0] },
            { name: 'تایید تا پرداخت', data: paddedSeries[1] },
            {
              name: 'واریز تا دریافت خدمات',
              data: paddedSeries[2],
            },
            {
              name: 'ارائه سند از سمن',
              data: paddedSeries[3],
            },
            { name: 'مجموع', data: paddedSeries[4] },
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

      noData: { text: 'داده‌ای برای نمایش وجود ندارد' },
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
            val === null || val === undefined ? '—' : `${val} روز`,
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
  }, [delivered, page, chartColors, isDark]);

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
            style={{ direction: 'ltr' }}
          />
        </div>
      </Grid>
      {/* Dropdown */}
      <Grid
        item
        sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}
      >
        <FormControl sx={{ width: '100%', maxWidth: 360 }} size="small">
          <InputLabel id="need-type-label">نوع نیاز</InputLabel>
          <Select
            labelId="need-type-label"
            id="need-type-select"
            value={needType}
            label="نوع نیاز"
            onChange={handleTypeChange}
          >
            <MenuItem value={NeedTypeEnum.PRODUCT}>کالا (Product)</MenuItem>
            <MenuItem value={NeedTypeEnum.SERVICE}>خدمات (Service)</MenuItem>
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
        />
      </Grid>
    </Grid>
  );
}

export default NeedTimeLine;
