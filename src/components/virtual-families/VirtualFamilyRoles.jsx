/* eslint-disable react/prop-types */
import React, { useEffect, useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { useDispatch, useSelector } from 'react-redux';
import { Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { fetchFamilyAnalytic } from '../../features/virtualFamilySlice';

const PALETTE = [
  '#4caf50',
  '#2196f3',
  '#ff9800',
  '#9c27b0',
  '#f44336',
  '#00bcd4',
  '#8bc34a',
  '#ffc107',
];

function toNumber(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : null;
}

/** Backend pairs are [delivered, people]. */
function normalizePairs(seriesData) {
  if (!Array.isArray(seriesData)) return [];

  if (
    seriesData.length === 2 &&
    (toNumber(seriesData[0]) !== null || toNumber(seriesData[1]) !== null)
  ) {
    return [
      {
        delivered: toNumber(seriesData[0]),
        people: toNumber(seriesData[1]),
        original: seriesData,
      },
    ];
  }

  if (seriesData.every((el) => Array.isArray(el) && el.length >= 2)) {
    return seriesData.map((pair) => ({
      delivered: toNumber(pair[0]),
      people: toNumber(pair[1]),
      original: pair,
    }));
  }

  if (
    seriesData.every(
      (el) => typeof el === 'object' && !Array.isArray(el) && el !== null,
    )
  ) {
    return seriesData.map((item, idx) => {
      if ('delivered' in item && 'people' in item)
        return {
          delivered: toNumber(item.delivered),
          people: toNumber(item.people),
          original: item,
        };
      if ('value' in item && 'count' in item)
        return {
          delivered: toNumber(item.value),
          people: toNumber(item.count),
          original: item,
        };
      if ('y' in item && 'x' in item)
        return {
          delivered: toNumber(item.x),
          people: toNumber(item.y),
          original: item,
        };
      const numericKeys = Object.keys(item).filter(
        (k) => toNumber(item[k]) !== null,
      );
      if (numericKeys.length >= 1)
        return {
          delivered: toNumber(item[numericKeys[0]]),
          people: idx + 1,
          original: item,
        };
      return { delivered: null, people: idx + 1, original: item };
    });
  }

  return seriesData.map((v, i) => ({
    delivered: toNumber(v),
    people: i + 1,
    original: v,
  }));
}

function fmt(n) {
  if (n === null || n === undefined) return '-';
  return new Intl.NumberFormat().format(Math.round(n));
}

export default function VirtualFamilyRoles({
  height = 560,
  pairOrder = 'delivered-first', // 'delivered-first' | 'people-first'
}) {
  const dispatch = useDispatch();
  const familyAnalyitics = useSelector((state) => state.virtualFamily);
  const { roles, status } = familyAnalyitics || {};
  const [chartOptions, setChartOptions] = useState(null);

  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'fa';

  useEffect(() => {
    dispatch(fetchFamilyAnalytic());
  }, [dispatch]);

  // Build series payload + per-series stats (memoized)
  const seriesPayload = useMemo(() => {
    if (!roles) return [];
    const scattered = roles.scattered ?? roles;
    const keys = ['father', 'mother', 'amoo', 'khaleh', 'daei', 'amme', 'amo'];

    return keys
      .filter(
        (k) =>
          scattered && Array.isArray(scattered[k]) && scattered[k].length > 0,
      )
      .map((k, idx) => {
        const normalized = normalizePairs(scattered[k]); // [{delivered, people, original}]
        // compute stats on delivered for this series (sum/avg/count)
        const numericDelivered = normalized
          .map((p) => p.delivered)
          .filter((v) => typeof v === 'number');
        const sum = numericDelivered.reduce((s, v) => s + v, 0);
        const count = numericDelivered.length;
        const avg = count ? sum / count : 0;
        const stats = {
          sum,
          avg,
          count,
          max: Math.max(...(numericDelivered.length ? numericDelivered : [0])),
        };

        // map to points (keep both delivered & people in point object)
        const data = normalized
          .map((pt) => {
            const { delivered, people } = pt;
            if (typeof delivered !== 'number' && typeof people !== 'number')
              return null;
            if (pairOrder === 'people-first') {
              return {
                x: people,
                y: delivered,
                people,
                delivered,
                original: pt.original,
              };
            }
            // default: delivered-first -> delivered mapped to X, people to Y
            return {
              x: delivered,
              y: people,
              people,
              delivered,
              original: pt.original,
            };
          })
          .filter(Boolean);

        return {
          // use translated role name; fallback to capitalized key
          name: t(`virtualFamily.roles.${k}`, {
            defaultValue: k.charAt(0).toUpperCase() + k.slice(1),
          }),
          color: PALETTE[idx % PALETTE.length],
          data,
          stats, // attach stats so we can use them in tooltip
        };
      });
    // include i18n.language so name translations update on language change
  }, [roles, pairOrder, i18n.language, t]);

  // compute integer domains (clamped to 0) with padding
  const { xRange, yRange } = useMemo(() => {
    const allX = seriesPayload
      .flatMap((s) => s.data.map((p) => p.x))
      .filter((v) => typeof v === 'number');
    const allY = seriesPayload
      .flatMap((s) => s.data.map((p) => p.y))
      .filter((v) => typeof v === 'number');

    const safeRange = (arr, floor = 0) => {
      if (!arr || arr.length === 0) return [floor, floor + 1];
      const min = Math.min(...arr);
      const max = Math.max(...arr);
      const range = Math.max(1, max - min);
      const pad = Math.max(1, Math.ceil(range * 0.05));
      const lower = Math.max(floor, Math.floor(min - pad)); // integer lower
      const upper = Math.ceil(max + pad); // integer upper
      if (upper <= lower) return [lower, lower + 1];
      return [lower, upper];
    };

    return { xRange: safeRange(allX, 0), yRange: safeRange(allY, 0) };
  }, [seriesPayload]);

  // Build chart options and series (improved tooltip)
  useEffect(() => {
    if (!seriesPayload || seriesPayload.length === 0) {
      setChartOptions(null);
      return;
    }

    // prepare Apex series array: include stats as `meta` on series config so tooltip can access it
    const apexSeries = seriesPayload.map((s) => ({
      name: s.name,
      data: s.data,
      meta: { stats: s.stats, color: s.color },
    }));

    const options = {
      chart: { type: 'scatter', zoom: { type: 'xy' }, toolbar: { show: true } },
      colors: seriesPayload.map((s) => s.color),
      markers: { size: 6, hover: { sizeOffset: 3 } },
      xaxis: {
        title: {
          text:
            pairOrder === 'people-first'
              ? t('analyticFamily.axis.peopleCount')
              : t('analyticFamily.axis.deliveredSum'),
        },
        min: xRange[0],
        max: xRange[1],
        tickAmount: 6,
        labels: {
          formatter: (val) =>
            val === null || val === undefined ? '-' : String(Math.round(val)),
        },
      },
      yaxis: {
        title: {
          text:
            pairOrder === 'people-first'
              ? t('analyticFamily.axis.deliveredSum')
              : t('analyticFamily.axis.peopleCount'),
        },
        min: yRange[0],
        max: yRange[1],
        tickAmount: 6,
        labels: {
          formatter: (val) =>
            val === null || val === undefined ? '-' : String(Math.round(val)),
        },
      },
      legend: { position: 'bottom' },

      // CUSTOM TOOLTIP: richer, uses series meta and per-point fields
      tooltip: {
        enabled: true,
        custom({ seriesIndex, dataPointIndex, w }) {
          // seriesIndex/dataPointIndex point to w.config.series[seriesIndex].data[dataPointIndex]
          const seriesCfg = w.config.series[seriesIndex] || {};
          const point =
            (seriesCfg.data && seriesCfg.data[dataPointIndex]) || {};
          const name = seriesCfg.name || t('analyticFamily.series');
          const color = (seriesCfg.meta && seriesCfg.meta.color) || '#999';
          const delivered = point.delivered ?? point.x ?? '-';
          const people = point.people ?? point.y ?? '-';

          // raw values
          const deliveredRaw = point.delivered ?? point.x;
          const peopleRaw = point.people ?? point.y;

          // numeric conversion (safe)
          const deliveredNum = Number(deliveredRaw);
          const peopleNum = Number(peopleRaw);
          const hasDelivered = Number.isFinite(deliveredNum);
          const hasPeople = Number.isFinite(peopleNum);

          // compute total only when both are valid numbers
          const totalNum =
            hasDelivered && hasPeople ? peopleNum * deliveredNum : null;

          // formatting helper (keeps your fmt)
          const f = (v) => (v == null ? '-' : fmt(v));

          return `
            <div style="padding:12px; font-size:13px;background: #2f2f2f;">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                <span style="width:10px; height:10px; background:${color}; display:inline-block;"></span>
                <div style="color:#ffff;font-weight:600;">${name}</div>
              </div>
              <div style="color:#ffff;display:flex; gap:12px; font-size:13px; margin-bottom:6px;">
                <div>
                  <div style="color:#ffff; font-size:11px;">${t('analyticFamily.tooltip.member')}</div>
                  <div style="color:#ffff; font-weight:700; font-size:14px;">${fmt(people)}</div>
                </div>
                <div>
                  <div style="color:#ffff; font-size:11px;">${t('analyticFamily.tooltip.delivered')}</div>
                  <div style="font-weight:700; font-size:14px;">${fmt(delivered)}</div>
                </div>
                <div>
                  <div style="color:#ffff; font-size:11px;">${t('analyticFamily.tooltip.total')}</div>
                  <div style="color:#ffff; font-weight:700; font-size:14px;">${fmt(people * delivered)}</div>
                </div>
              </div>
              
                <div  style="color:#ffff; font-size:11px;direction: ${isRtl ? 'rtl' : 'ltr'};">
                  ${
                    people > 1
                      ? t('virtualFamily.tooltip.sentence_two', {
                          count: peopleNum,
                          name,
                          delivered: f(deliveredNum),
                          total: f(totalNum),
                        })
                      : t('virtualFamily.tooltip.sentence_one', {
                          count: peopleNum,
                          name,
                          delivered: f(deliveredNum),
                          total: f(totalNum),
                        })
                  } 
              </div>
            </div>
          `;
        },
      },

      grid: { borderColor: '#eee' },
    };

    setChartOptions({
      options,
      series: apexSeries,
    });
    // re-run when language changes so labels update
  }, [seriesPayload, xRange, yRange, pairOrder, i18n.language, t]);

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mt: 2 }}>
        {chartOptions && (
          <ReactApexChart
            options={chartOptions.options}
            series={chartOptions.series}
            type="scatter"
            height={height}
          />
        )}

        {!chartOptions && status !== 'loading' && (
          <Typography
            sx={{ mt: 2, textAlign: 'center', color: 'text.secondary' }}
          >
            {t('analyticFamily.noData')}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
