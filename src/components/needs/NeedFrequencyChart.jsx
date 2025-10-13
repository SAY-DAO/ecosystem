/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react/no-array-index-key */
/* eslint-disable react/prop-types */
import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  useTheme,
} from '@mui/material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFrequencyData } from '../../features/frequencySlice';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload || {};
  const members = Array.isArray(data.members) ? data.members : [];

  return (
    <Box
      sx={{
        p: 1,
        minWidth: 200,
        bgcolor: 'background.paper',
        boxShadow: 3,
        borderRadius: 1,
        direction: 'rtl',
      }}
    >
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        دسته: {data.name ?? data.id ?? label}
      </Typography>

      <Divider sx={{ mb: 1 }} />

      <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
        تامین نشده ({data.undone})
        {typeof data.totalCount === 'number' && data.totalCount > 0 ? (
          <>
            {' — '}مجموع: {data.totalCount}
          </>
        ) : null}
      </Typography>

      {members.length === 0 ? (
        <Typography variant="body2">هیچ عضوی ثبت نشده است</Typography>
      ) : (
        <List dense disablePadding sx={{ maxHeight: 200, overflow: 'auto' }}>
          {members.map((m, i) => (
            <ListItem key={i} sx={{ py: 0.3 }}>
              <ListItemText
                primary={typeof m === 'string' ? m : (m.name ?? String(m))}
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}

export default function NeedCategoryFrequencyChart() {
  const theme = useTheme();
  const dispatch = useDispatch();

  const frequencyDataFromStore = useSelector(
    (s) => s.frequency && s.frequency.frequencyData,
  );
  const loading = useSelector((s) => s.frequency && s.frequency.loading);
  const [limit, setLimit] = useState(20);
  const [since, setSince] = useState('');
  const [until, setUntil] = useState('');
  const [similarityThreshold, setSimilarityThreshold] = useState(0.2);

  useEffect(() => {
    dispatch(fetchFrequencyData({ limit, since, until, similarityThreshold }));
  }, []);

  const frequencyData = frequencyDataFromStore ?? null;

  const normalized = useMemo(() => {
    if (!Array.isArray(frequencyData)) return [];
    return frequencyData.map((it) => {
      const total = Number(it.totalCount ?? it.total ?? 0) || 0;
      const done = Number(it.doneCount ?? it.done ?? 0) || 0;
      const members = Array.isArray(it.members) ? it.members : [];
      const membersCount =
        Number(it.membersCount ?? members.length) || members.length;
      return {
        id: it.id,
        name: it.name ?? it.id ?? '',
        totalCount: total,
        doneCount: done,
        undone: Math.max(0, total - done),
        members,
        membersCount,
      };
    });
  }, [frequencyData]);

  const topData = useMemo(() => {
    const copy = normalized.slice();
    copy.sort((a, b) => {
      const by = 'totalCount';
      return b[by] - a[by];
    });
    return copy.slice(0, limit);
  }, [normalized, limit]);

  const chartHeight = Math.max(300, topData.length * 56 + 120);
  const ticks = useMemo(() => topData.map((d) => d.id), [topData]);
  const idToName = useMemo(() => {
    const m = new Map();
    topData.forEach((d) => m.set(d.id, d.name));
    return m;
  }, [topData]);

  const allZero =
    topData.length > 0 &&
    topData.every(
      (d) => Number(d.totalCount) === 0 && Number(d.doneCount) === 0,
    );
  const noData = topData.length === 0;

  return (
    <Card sx={{ width: '100%' }}>
      <CardContent>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {allZero && topData.length > 0 && (
              <Box mb={2}>
                <Typography color="warning.main">
                  هشدار: مقدار totalCount یا doneCount برای همه دسته‌ها صفر
                  به‌نظر می‌رسد — لطفاً API/داده را بررسی کنید.
                </Typography>
              </Box>
            )}

            {noData ? (
              <Box
                p={2}
                sx={{
                  background: '#fff3e0',
                  borderRadius: 1,
                  border: '1px solid rgba(0,0,0,0.06)',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  داده‌ای برای نمودار موجود نیست. مطمئن شوید endpoint بک‌اند
                  <code> /needs-frequency-clustered </code>
                  داده ارسال می‌کند و reducer آن را در
                  state.frequency.frequencyData قرار می‌دهد.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ height: chartHeight, direction: 'rtl' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topData}
                    layout="vertical"
                    margin={{ top: 20, right: 40, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      domain={[0, 'dataMax']}
                      reversed
                    />
                    <YAxis
                      dataKey="id"
                      type="category"
                      ticks={ticks}
                      tick={{ fontSize: 13 }}
                      tickFormatter={(id) => idToName.get(id) ?? id}
                    />
                    <Tooltip
                      content={(props) => <CustomTooltip {...props} />}
                      wrapperStyle={{ pointerEvents: 'auto', zIndex: 2000 }}
                      cursor={{ fill: 'transparent' }}
                    />
                    <Legend />
                    <Bar
                      dataKey="undone"
                      stackId="a"
                      name="انجام‌نشده"
                      fill="#e0e0e0"
                      stroke="#bdbdbd"
                      isAnimationActive={false}
                    />
                    <Bar
                      dataKey="doneCount"
                      stackId="a"
                      name="انجام‌شده"
                      fill={`${theme.palette.primary.light}`}
                      stroke="#2e7d32"
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
