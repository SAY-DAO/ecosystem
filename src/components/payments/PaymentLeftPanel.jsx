import React, { useMemo, useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Autocomplete,
  TextField,
  Skeleton,
} from '@mui/material';
import { useSelector, shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Panel from '../Panel';
import Comparison from '../Comparison';

function PaymentLeftPanel({ season, setSeason, options = [] }) {
  const { t, i18n } = useTranslation();
  const [inputValue, setInputValue] = useState('');

  // single selector for fewer re-renders
  const { seasonComparison, loadingSummary, summary } = useSelector(
    (s) => ({
      seasonComparison: s.report?.season ?? null,
      loadingSummary: Boolean(s.report?.loadingSummary),
      summary: s.report?.summary ?? {},
    }),
    shallowEqual,
  );

  // ---------- helpers for option/value matching ----------
  // getOptionLabel: handle string, number, object shapes
  const getOptionLabel = useCallback((opt) => {
    if (opt == null) return '';
    if (typeof opt === 'string' || typeof opt === 'number') return String(opt);
    // assume common object shapes: { label }, { name }, { title }, { id }
    return opt.label ?? opt.name ?? opt.title ?? String(opt.id ?? '');
  }, []);

  // isOptionEqualToValue: try id-based or deep-ish equality to avoid stale references
  const isOptionEqualToValue = useCallback((option, value) => {
    if (option === value) return true;
    if (!option || !value) return false;

    // both objects with `id`
    if (typeof option === 'object' && typeof value === 'object') {
      // compare id (stringified) if present
      if (option.id != null && value.id != null) {
        return String(option.id) === String(value.id);
      }
      // fallback to label/name equality
      return (
        (option.label && value.label && option.label === value.label) ||
        (option.name && value.name && option.name === value.name)
      );
    }

    // compare primitive option to primitive value
    if (
      (typeof option === 'string' || typeof option === 'number') &&
      (typeof value === 'string' || typeof value === 'number')
    ) {
      return String(option) === String(value);
    }

    return false;
  }, []);

  // Ensure we always pass an option object (or null) to Autocomplete's `value`.
  // If `season` is an id/primitive, find the matching option in `options`.
  const selectedOption = useMemo(() => {
    if (season == null) return null;

    // direct reference match
    const direct = options.find((o) => isOptionEqualToValue(o, season));
    if (direct) return direct;

    // if season is primitive, try matching against an 'id' or 'value' property in options
    if (typeof season === 'string' || typeof season === 'number') {
      const byId = options.find((o) => {
        if (!o) return false;
        if (typeof o === 'string' || typeof o === 'number')
          return String(o) === String(season);
        return String(o.id ?? o.value ?? '') === String(season);
      });
      if (byId) return byId;
    }

    // If none found, but season looks like an object, pass it (Autocomplete will try to render it)
    if (typeof season === 'object') return season;

    return null;
  }, [season, options, isOptionEqualToValue]);

  // Keep displayed input text in sync when value changes to avoid flash of raw value
  useEffect(() => {
    // When selectedOption changes, update the inputValue to reflect the label
    const label = getOptionLabel(selectedOption);
    setInputValue(label);
    // We intentionally set inputValue so the TextField doesn't show `season` as raw text
  }, [selectedOption, getOptionLabel]);

  // stable handlers
  const handleSeasonChange = useCallback(
    (_, newValue) => {
      // if Autocomplete passes an option object, we map it back to the shape you might expect.
      // If you prefer to keep the whole object, return it directly.
      setSeason(newValue);
    },
    [setSeason],
  );

  const handleInputChange = useCallback((_, newInputValue) => {
    setInputValue(newInputValue);
  }, []);

  // Derived data & formatting (same as before)
  const paysData = useMemo(
    () => seasonComparison?.pays?.data ?? [],
    [seasonComparison],
  );

  const totals = useMemo(() => {
    const {
      totalUsers = null,
      totalNeeds = null,
      totalPayments = null,
      totalDoneNeeds = null,
      totalChildren = null,
    } = summary || {};
    return {
      totalUsers,
      totalNeeds,
      totalPayments,
      totalDoneNeeds,
      totalChildren,
    };
  }, [summary]);

  const numberFormatter = useMemo(() => {
    try {
      return new Intl.NumberFormat(i18n.language === 'fa' ? 'fa-IR' : 'en-US');
    } catch {
      return new Intl.NumberFormat('en-US');
    }
  }, [i18n.language]);

  const formattedPayments = useMemo(
    () =>
      totals.totalPayments != null
        ? numberFormatter.format(totals.totalPayments)
        : '—',
    [totals.totalPayments, numberFormatter],
  );

  const isRtl = i18n.language === 'fa';

  return (
    <Box>
      <Panel title={t('panels.kpis', 'KPIs')} align={!isRtl ? 'right' : 'left'}>
        <Card sx={{ mt: 1 }}>
          <CardContent>
            <Comparison data={paysData} season={season} />

            <Autocomplete
              id="season-autocomplete"
              value={selectedOption}
              onChange={handleSeasonChange}
              inputValue={inputValue}
              onInputChange={handleInputChange}
              options={options}
              getOptionLabel={getOptionLabel}
              isOptionEqualToValue={isOptionEqualToValue}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={t('placeholders.searchSeason', 'Type to filter')}
                  variant="outlined"
                  size="small"
                />
              )}
              sx={{ mb: 2 }}
              disableClearable={false}
            />
          </CardContent>
        </Card>
      </Panel>

      <Box sx={{ mt: 2 }}>
        <Panel align={!isRtl ? 'right' : 'left'}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                {t('panels.totalPayments', 'مجموع پرداخت‌ها')}
              </Typography>

              {loadingSummary ? (
                <Skeleton width={100} height={36} />
              ) : (
                <Typography variant="h6" sx={{ mt: 1 }} component="div">
                  {formattedPayments}{' '}
                  <Typography
                    component="span"
                    sx={{ fontSize: 12, color: 'text.secondary' }}
                  >
                    {t('currency.toman', 'تومان')}
                  </Typography>
                </Typography>
              )}

              <Typography
                sx={{ fontSize: 10 }}
                variant="body2"
                color="text.secondary"
              >
                {t(
                  'panels.totalPaymentsDescription',
                  'مجموع هزینه پرداخت شده برای تمام نیازها',
                )}
              </Typography>
            </CardContent>
          </Card>
        </Panel>
      </Box>
    </Box>
  );
}

PaymentLeftPanel.propTypes = {
  season: PropTypes.any,
  setSeason: PropTypes.func.isRequired,
  options: PropTypes.array,
};

export default React.memo(PaymentLeftPanel);
