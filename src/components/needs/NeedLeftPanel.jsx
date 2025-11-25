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

function NeedLeftPanel({ season, setSeason, options = [] }) {
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

  // ---------- helpers for option/value matching (prevents "random number" flash) ----------
  const getOptionLabel = useCallback((opt) => {
    if (opt == null) return '';
    if (typeof opt === 'string' || typeof opt === 'number') return String(opt);
    return opt.label ?? opt.name ?? opt.title ?? String(opt.id ?? '');
  }, []);

  const isOptionEqualToValue = useCallback((option, value) => {
    if (option === value) return true;
    if (!option || !value) return false;

    if (typeof option === 'object' && typeof value === 'object') {
      if (option.id != null && value.id != null) {
        return String(option.id) === String(value.id);
      }
      return (
        (option.label && value.label && option.label === value.label) ||
        (option.name && value.name && option.name === value.name)
      );
    }

    if (
      (typeof option === 'string' || typeof option === 'number') &&
      (typeof value === 'string' || typeof value === 'number')
    ) {
      return String(option) === String(value);
    }

    return false;
  }, []);

  // Ensure Autocomplete's value is an option object (prevents flash)
  const selectedOption = useMemo(() => {
    if (season == null) return null;

    const direct = options.find((o) => isOptionEqualToValue(o, season));
    if (direct) return direct;

    if (typeof season === 'string' || typeof season === 'number') {
      const byId = options.find((o) => {
        if (!o) return false;
        if (typeof o === 'string' || typeof o === 'number')
          return String(o) === String(season);
        return String(o.id ?? o.value ?? '') === String(season);
      });
      if (byId) return byId;
    }

    if (typeof season === 'object') return season;

    return null;
  }, [season, options, isOptionEqualToValue]);

  // sync inputValue to selected label to avoid showing raw primitive briefly
  useEffect(() => {
    const label = getOptionLabel(selectedOption);
    setInputValue(label);
  }, [selectedOption, getOptionLabel]);

  // stable handlers
  const handleSeasonChange = useCallback(
    (_, newValue) => {
      setSeason(newValue);
    },
    [setSeason],
  );

  const handleInputChange = useCallback((_, newInputValue) => {
    setInputValue(newInputValue);
  }, []);

  // Derived data
  const comparisonData = useMemo(
    () => seasonComparison?.doneNeeds?.data ?? [],
    [seasonComparison],
  );

  const totals = useMemo(() => {
    const {
      totalUsers = null,
      totalNotDoneNeeds = null,
      totalPayments = null,
      totalDoneNeeds = null,
      totalChildren = null,
    } = summary || {};
    return {
      totalUsers,
      totalNotDoneNeeds,
      totalPayments,
      totalDoneNeeds,
      totalChildren,
    };
  }, [summary]);

  const isRtl = i18n.language === 'fa';

  return (
    <Box>
      <Panel title="" align={!isRtl ? 'right' : 'left'}>
        <Card sx={{ mt: 1 }}>
          <CardContent>
            <Comparison
              data={comparisonData}
              season={season}
              context={t('comparison.context.needs')}
              context2={t('comparison.context2.needs')}
            />
            <Autocomplete
              id="season-autocomplete-done"
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
                  variant="outlined"
                  size="small"
                  label={
                    season
                      ? ` ${season}  - ${season - 1}`
                      : t('comparison.autocomplete.label')
                  }
                />
              )}
              sx={{ mb: 2, direction: !isRtl && 'ltr' }}
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
                {t('need.delivered')}
              </Typography>

              {loadingSummary ? (
                <Skeleton width={100} height={36} />
              ) : (
                <Typography variant="h5" sx={{ mt: 1 }}>
                  {totals.totalDoneNeeds ?? '—'}
                </Typography>
              )}

              {loadingSummary ? (
                <Skeleton width={100} height={20} />
              ) : (
                <Typography
                  sx={{ fontSize: 10 }}
                  variant="body1"
                  color="text.secondary"
                >
                  {String(totals.totalNotDoneNeeds ?? '—')}{' '}
                  {t('need.payableNeeds')}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Panel>
      </Box>
    </Box>
  );
}

NeedLeftPanel.propTypes = {
  season: PropTypes.any,
  setSeason: PropTypes.func.isRequired,
  options: PropTypes.array,
};

export default React.memo(NeedLeftPanel);
