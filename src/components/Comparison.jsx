/* eslint-disable react/prop-types */
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Legend,
} from 'recharts';
import { Typography } from '@mui/material';
import moment from 'moment-jalaali';
import { useTranslation } from 'react-i18next';

moment.loadPersian({ dialect: 'persian-modern', usePersianDigits: false });

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

// english month names (short / long variants that might appear in data)
const englishMonthMap = {
  January: 0,
  Jan: 0,
  February: 1,
  Feb: 1,
  March: 2,
  Mar: 2,
  April: 3,
  Apr: 3,
  May: 4,
  June: 5,
  Jun: 5,
  July: 6,
  Jul: 6,
  August: 7,
  Aug: 7,
  September: 8,
  Sep: 8,
  October: 9,
  Oct: 9,
  November: 10,
  Nov: 10,
  December: 11,
  Dec: 11,
};

function CustomTooltip({ active, payload, label, season }) {
  const { t } = useTranslation();
  if (!active || !payload || !payload.length) return null;
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
  const labelStyle = { color: '#fff', fontWeight: 800, marginBottom: 6 };
  const rowStyle = { color: '#ddd', marginBottom: 6, fontSize: 10 };

  return (
    <div style={containerStyle}>
      <div style={labelStyle}>{label}</div>
      <div style={rowStyle}>
        {current.toLocaleString()}{' '}
        <strong style={{ fontWeight: 600 }}>
          : {t('comparison.tooltip.year', { season })}
        </strong>
      </div>
      <div style={rowStyle}>
        {previous.toLocaleString()}{' '}
        <strong style={{ fontWeight: 600 }}>
          : {t('comparison.tooltip.year', { season: season - 1 })}
        </strong>
      </div>
      <div style={{ color: '#ddd' }}>
        {changeText}{' '}
        <strong style={{ fontWeight: 600 }}>
          : {t('comparison.tooltip.change')}
        </strong>
      </div>
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
        rate = 0;
      } else {
        rate = null;
      }
    } else {
      rate = ((current - previous) / previous) * 100;
    }

    let displayRate;
    if (typeof rate === 'number' && Number.isFinite(rate)) {
      displayRate = rate;
    } else if (previous === 0 && current > 0) {
      displayRate = 100;
    } else {
      displayRate = 0;
    }

    return {
      period: (d && (d.period ?? d.label)) || '-',
      previous,
      current,
      rate,
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

  if (values.length === 0) return [0, 10];

  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    const base = Math.abs(max);
    const pad = Math.max(1, Math.ceil(base * 0.1));
    const lower = Math.floor(min - pad);
    const upper = Math.ceil(max + pad);
    return [lower, upper];
  }

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
  context,
  context2,
}) {
  const { i18n } = useTranslation(); // <-- requested: use this for locale-sensitive behaviour
  const { t } = useTranslation();

  const reduxData = useSelector(reduxSelector);

  const raw = useMemo(() => {
    if (Array.isArray(propData) && propData.length) return propData;
    if (Array.isArray(reduxData) && reduxData.length) return reduxData;
    return [];
  }, [propData, reduxData]);

  const data = useMemo(() => {
    const currentJalaliYear = moment().jYear();
    const currentJalaliMonth = moment().jMonth();
    const seasonJalaliYear = moment(`${season}-06-01`, 'YYYY-MM-DD').jYear();
    const normalized = normalizeRateData(raw);

    // choose month lookup map depending on locale
    const localeIsFa =
      i18n &&
      typeof i18n.language === 'string' &&
      i18n.language.startsWith('fa');
    const monthMap = localeIsFa ? farsiMonthMap : englishMonthMap;

    if (seasonJalaliYear === currentJalaliYear) {
      return normalized.filter((entry) => {
        const monthName = entry.period?.trim();
        const monthIndex = monthMap[monthName];
        return monthIndex != null && monthIndex <= currentJalaliMonth;
      });
    }
    return normalized;
  }, [raw, season, i18n]);

  const seasonKPI = useMemo(() => computeSeasonKPI(data), [data]);
  const yDomain = useMemo(() => computeYDomainForCounts(data), [data]);

  const hasData = data.some((d) => d.previous !== 0 || d.current !== 0);
  const isRtl = i18n.language === 'fa';

  const renderColorfulLegendText = (value, entry) => {
    const { color } = entry;
    return (
      <span style={{ color, fontSize: 12 }}>
        {value === 'current' ? season : season - 1}
      </span>
    );
  };

  return (
    <div
      style={{
        textAlign: 'center',
        direction: isRtl ? 'rtl' : 'ltr',
      }}
      className="w-full max-w-3xl bg-white/80 dark:bg-slate-900/70 rounded-2xl p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div
          style={{
            textAlign: 'center',
          }}
        >
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
            {context2
              ? t('comparison.kpi2.totalInYear', {
                  count: seasonKPI.currTotal.toLocaleString(),
                  season,
                  context,
                  context2,
                })
              : t('comparison.kpi.totalInYear', {
                  count: seasonKPI.currTotal.toLocaleString(),
                  season,
                  context,
                })}
          </Typography>
          <br />
          <Typography variant="caption" color="text.secondary">
            {context2
              ? t('comparison.kpi2.totalInPrevYear', {
                  count: seasonKPI.prevTotal.toLocaleString(),
                  season: season - 1,
                  context,
                  context2,
                })
              : t('comparison.kpi.totalInPrevYear', {
                  count: seasonKPI.prevTotal.toLocaleString(),
                  season: season - 1,
                  context,
                })}
          </Typography>
        </div>
      </div>

      <div style={{ height: 260, marginBottom: 20, direction: 'ltr' }}>
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
              {/* <CartesianGrid
                strokeDasharray="1 1"
                stroke="#E6E9EE"
                horizontalCoordinatesGenerator={(props) =>
                  props.height > 250 ? [150, 100, 50] : [100, 200]
                }
                verticalCoordinatesGenerator={(props) =>
                  props.width > 350
                    ? [110, 160, 210, 260, 310, 360, 410]
                    : [200, 400]
                }
              /> */}
              <XAxis
                dataKey="period"
                // label={{
                //   value: t('comparison.chart.xAxisLabel', {
                //     season,
                //     prevSeason: season - 1,
                //   }),
                //   position: 'insideBottom',
                //   offset: -15,
                //   fontSize: 12,
                // }}
                tick={{ fontSize: 8 }}
              />

              <YAxis
                domain={yDomain}
                tick={{ fontSize: 10 }}
                tickFormatter={(i) => i.toLocaleString()}
              />
              <Tooltip content={<CustomTooltip season={season} />} />
              <ReferenceLine y={0} stroke="#94A3B8" strokeDasharray="3 3" />
              <Legend
                formatter={renderColorfulLegendText}
                iconSize={10}
                iconType="rect"
              />

              <Bar
                dataKey="previous"
                fill="#FFDF88"
                minPointSize={4}
                // radius={[4, 4, 4, 4]}
              />
              <Bar
                dataKey="current"
                fill="#F0A04B"
                minPointSize={4}
                // radius={[4, 4, 4, 4]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-slate-500">
            {t('comparison.chart.noData')}
          </div>
        )}
      </div>
    </div>
  );
}
