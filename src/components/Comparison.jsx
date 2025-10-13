/* eslint-disable react/no-array-index-key */
/* eslint-disable react/prop-types */
import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from 'recharts';
import { Typography } from '@mui/material';
import moment from 'moment-jalaali';
import { useTheme } from '@mui/material/styles';
import { fetchSeasonComparison } from '../features/reportSlice';

const farsiMonthMap = {
  فروردین: 0,
  اردیبهشت: 1,
  خرداد: 2,
  تیر: 3,
  مرداد: 4,
  شهریور: 5,
  مهر: 6,
  آبان: 7,
  آذر: 8,
  دی: 9,
  بهمن: 10,
  اسفند: 11,
};
// Make sure to load moment-jalaali plugin
moment.loadPersian({ dialect: 'persian-modern', usePersianDigits: false });

// add this above the Comparison component
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  // payload[0] corresponds to the bar's payload; the original object is in payload[0].payload
  const entry = payload[0].payload || {};
  const current = Number(entry.current || 0);
  const previous = Number(entry.previous || 0);

  let changeText;
  if (entry.isNew) {
    changeText = '∞';
  } else if (typeof entry.rate === 'number' && Number.isFinite(entry.rate)) {
    changeText = `${entry.rate.toFixed(1)}%`;
  } else {
    changeText = '0%';
  }

  const containerStyle = {
    backgroundColor: '#2f2f2f',
    borderRadius: 8,
    border: '1px solid #444',
    color: '#fff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
    padding: '10px 14px',
    minWidth: 160,
    fontSize: 13,
  };
  const labelStyle = { color: '#fff', fontWeight: 600, marginBottom: 6 };
  const rowStyle = { color: '#ddd', marginBottom: 6 };

  return (
    <div style={containerStyle}>
      <div style={labelStyle}>{label}</div>
      <div style={rowStyle}>Current: {current.toLocaleString()}</div>
      <div style={rowStyle}>Previous: {previous.toLocaleString()}</div>
      <div style={{ color: '#ddd' }}>Change: {changeText}</div>
    </div>
  );
}

export function normalizeRateData(rawInput) {
  const raw = Array.isArray(rawInput) ? rawInput : [];
  return raw.map((d) => {
    const previous = Number(d && d.previous != null ? d.previous : 0);
    const current = Number(d && d.current != null ? d.current : 0);
    let rate = null;
    let isNew = false;

    if (previous === 0) {
      isNew = current > 0;
      if (current === 0) {
        // both zero -> no change
        rate = 0;
      } else {
        // previous 0, current > 0 -> semantic "infinite" change.
        // keep rate = null (means "new") but create a numeric displayRate below
        rate = null;
      }
    } else {
      rate = ((current - previous) / previous) * 100;
    }

    // displayRate is what the chart actually plots (must be numeric)
    // - use the real rate when finite
    // - use 0 when both are zero
    // - use a reasonable sentinel when "new" (previous === 0 && current > 0)
    //   you can choose the sentinel value; 100 is common (means +100%) but
    //   adjust if it doesn't fit your UX.
    let displayRate;
    if (typeof rate === 'number' && Number.isFinite(rate)) {
      displayRate = rate;
    } else if (previous === 0 && current > 0) {
      // sentinel value for "new" — choose what makes sense for your UI.
      displayRate = 100;
    } else {
      // both zero -> 0
      displayRate = 0;
    }

    return {
      period: (d && (d.period ?? d.label)) || '-',
      previous,
      current,
      rate, // keep original semantic value (may be null)
      isNew,
      displayRate,
    };
  });
}

export function computeSeasonKPI(data) {
  const arr = Array.isArray(data) ? data : [];
  let prevTotal = 0;
  let currTotal = 0;
  for (const d of arr) {
    prevTotal += Number(d.previous || 0);
    currTotal += Number(d.current || 0);
  }
  const pct =
    prevTotal === 0
      ? currTotal > 0
        ? null
        : 0
      : ((currTotal - prevTotal) / prevTotal) * 100;
  return { prevTotal, currTotal, pct };
}

function computeYDomainForCounts(data) {
  const values = (Array.isArray(data) ? data : [])
    .map((d) => Number(d.current || 0))
    .filter((v) => Number.isFinite(v));

    
  // fallback when no numeric data
  if (values.length === 0) return [0, 10];

  const min = Math.min(...values);
  const max = Math.max(...values);


  // if all values are identical, give a symmetric pad so chart is visible
  if (min === max) {
    const base = Math.abs(max);
    const pad = Math.max(1, Math.ceil(base * 0.1));
    // ensure lower bound can go below zero if min is negative, otherwise floor to 0
    const lower = Math.floor(min - pad);
    const upper = Math.ceil(max + pad);
    return [lower, upper];
  }

  // normal case: compute 10% padding of the range (at least 1)
  const range = max - min;
  const pad = Math.max(1, Math.ceil(range * 0.1));
  const lower = Math.floor(min - pad);
  const upper = Math.ceil(max + pad);

  return [lower, upper];
}

const selectSeasonComparison = (state) => {
  try {
    if (!state || typeof state !== 'object') return null;
    const { users } = state;
    if (!users || typeof users !== 'object') return null;
    const arr = users.seasonComparison;
    return Array.isArray(arr) ? arr : null;
  } catch (e) {
    return e;
  }
};

export default function Comparison({
  data: propData,
  reduxSelector = selectSeasonComparison,
  season,
}) {
  const dispatch = useDispatch();
  const theme = useTheme();
  const reduxData = useSelector(reduxSelector);

  // initial load
  useEffect(() => {
    dispatch(fetchSeasonComparison({ season, includeRates: false }));
  }, [season]);

  const raw = useMemo(() => {
    if (Array.isArray(propData) && propData.length) return propData;
    if (Array.isArray(reduxData) && reduxData.length) return reduxData;
    return [];
  }, [propData, reduxData]);

  const data = useMemo(() => {
    const currentJalaliYear = moment().jYear();
    const currentJalaliMonth = moment().jMonth();
    // Convert season Gregorian year to Jalali year using mid-year date
    const seasonJalaliYear = moment(`${season}-06-01`, 'YYYY-MM-DD').jYear();
    const normalized = normalizeRateData(raw);
    if (seasonJalaliYear === currentJalaliYear) {
      return normalized.filter((entry) => {
        const monthName = entry.period?.trim();
        const monthIndex = farsiMonthMap[monthName];
        return monthIndex != null && monthIndex <= currentJalaliMonth;
      });
    }
    return normalized;
  }, [raw, season]);

  const seasonKPI = useMemo(() => computeSeasonKPI(data), [data]);
  const yDomain = useMemo(() => computeYDomainForCounts(data), [data]);

  const barColor = (rate, isNew) => {
    if (isNew) return theme.palette.grey.A400;
    if (rate == null) return theme.palette.grey.A400;
    return rate >= 0 ? theme.palette.success.main : theme.palette.danger.main;
  };

  const hasData = data.some((d) => d.previous !== 0 || d.current !== 0);

  return (
    <div
      style={{ textAlign: 'center', direction: 'ltr' }}
      className="w-full max-w-3xl bg-white/80 dark:bg-slate-900/70 rounded-2xl p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="text-right">
          <Typography
            variant="h5"
            fontWeight={500}
            color={seasonKPI.pct >= 0 ? 'success.main' : 'error.main'}
          >
            {seasonKPI.pct && seasonKPI.pct >= 0
              ? `+${seasonKPI.pct.toFixed(1)}%`
              : seasonKPI.pct
                ? `${seasonKPI.pct.toFixed(1)}%`
                : 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            مجموع {seasonKPI.currTotal.toLocaleString()} در سال {season}
          </Typography>
          <br />
          <Typography variant="caption" color="text.secondary">
            مجموع {seasonKPI.prevTotal.toLocaleString()} در سال {season - 1}
          </Typography>
        </div>
      </div>
      <div style={{ height: 260 }}>
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 12,
                right: 12,
                left: 0,
                bottom: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E6E9EE" />
              <XAxis dataKey="period" tick={{ fontSize: 8 }} />
              <YAxis
                // counting axis (left)
                domain={yDomain}
                width={48}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#94A3B8" strokeDasharray="3 3" />
              <Bar dataKey="current" minPointSize={4} radius={[6, 6, 6, 6]}>
                {data.map((entry, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={barColor(entry.rate, entry.isNew)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-slate-500">
            No data available
          </div>
        )}
      </div>
    </div>
  );
}
