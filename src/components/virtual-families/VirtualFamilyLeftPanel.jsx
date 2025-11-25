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
  Grid,
} from '@mui/material';
import { useSelector, shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';
import StraightOutlinedIcon from '@mui/icons-material/StraightOutlined';
import Panel from '../Panel';
import Comparison from '../Comparison';

function VirtualFamilyLeftPanel({ season, setSeason, options = [] }) {
  const { t, i18n } = useTranslation();
  const [inputValue, setInputValue] = useState('');

  // Combined selector to reduce re-renders
  const { seasonComparison, loadingSummary, summary } = useSelector(
    (s) => ({
      seasonComparison: s.report?.season ?? null,
      loadingSummary: Boolean(s.report?.loadingSummary),
      summary: s.report?.summary ?? {},
    }),
    shallowEqual,
  );
  const familyAnalyitics = useSelector((state) => state.virtualFamily);
  const { roles } = familyAnalyitics || {};

  // Helpers for Autocomplete to avoid flash when value is a primitive or different reference
  const getOptionLabel = useCallback((opt) => {
    if (opt == null) return '';
    if (typeof opt === 'string' || typeof opt === 'number') return String(opt);
    return opt.label ?? opt.name ?? opt.title ?? String(opt.id ?? '');
  }, []);

  const isOptionEqualToValue = useCallback((option, value) => {
    if (option === value) return true;
    if (!option || !value) return false;

    if (typeof option === 'object' && typeof value === 'object') {
      if (option.id != null && value.id != null)
        return String(option.id) === String(value.id);
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

  // keep inputValue synced to selected label to avoid showing raw primitive for a moment
  useEffect(() => {
    setInputValue(getOptionLabel(selectedOption));
  }, [selectedOption, getOptionLabel]);

  const handleSeasonChange = useCallback(
    (_, newValue) => setSeason(newValue),
    [setSeason],
  );
  const handleInputChange = useCallback(
    (_, newInput) => setInputValue(newInput),
    [],
  );

  const comparisonData = useMemo(
    () => seasonComparison?.totalUsers?.data ?? [],
    [seasonComparison],
  );

  const totals = useMemo(() => {
    const {
      totalUsers = null,
      totalNeeds = null,
      totalPayments = null,
      totalDoneNeeds = null,
      totalChildren = null,
      roleCounts = null,
    } = summary || {};
    return {
      totalUsers,
      totalNeeds,
      totalPayments,
      totalDoneNeeds,
      totalChildren,
      roleCounts,
    };
  }, [summary]);

  const numberFormatter = useMemo(() => {
    try {
      return new Intl.NumberFormat(
        i18n.language === 'fa' ? 'fa-IR' : undefined,
      );
    } catch {
      return new Intl.NumberFormat(undefined);
    }
  }, [i18n.language]);

  const formattedUsers = useMemo(
    () =>
      totals.totalUsers != null
        ? numberFormatter.format(totals.totalUsers)
        : '—',
    [totals.totalUsers, numberFormatter],
  );

  const isRtl = i18n.language === 'fa';

  return (
    <Box>
      <Panel title="" align={!isRtl ? 'right' : 'left'}>
        <Card sx={{ mt: 1 }}>
          <CardContent>
            <Comparison
              data={comparisonData}
              season={season}
              context={t('comparison.context.virtualFamilies')}
              context2={t('comparison.context2.virtualFamilies')}
            />

            <Autocomplete
              id="virtual-family-season"
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
            />
          </CardContent>
        </Card>
      </Panel>

      <Box sx={{ mt: 2 }}>
        <Panel align={!isRtl ? 'right' : 'left'}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                {t('virtualFamily.users')}
              </Typography>

              {loadingSummary ? (
                <Skeleton width={120} height={36} />
              ) : (
                <Typography variant="h5" sx={{ mt: 1 }}>
                  {formattedUsers}
                </Typography>
              )}

              {!summary || !summary.activeUsersCount ? (
                <Skeleton width={100} height={20} />
              ) : (
                <Typography
                  sx={{ fontSize: 10 }}
                  variant="body1"
                  color="text.secondary"
                >
                  {t('virtualFamily.description', {
                    vMembers:
                      summary.activeUsersCount.activeFathersCount +
                      summary.activeUsersCount.activeMothersCount +
                      summary.activeUsersCount.activeAmoosCount +
                      summary.activeUsersCount.activeKhalehsCount +
                      summary.activeUsersCount.activeDaeisCount +
                      summary.activeUsersCount.activeAmmesCount,
                  })}
                </Typography>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                {t('virtualFamily.roles.title')}
              </Typography>
              {summary.activeUsersCount && roles && (
                <Grid
                  container
                  direction="row"
                  sx={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    pt: 1,
                  }}
                  spacing={3}
                >
                  <Grid item lg={2} md={4} xs={4} sx={{ textAlign: 'center' }}>
                    <Typography
                      variant="body1"
                      color="text.primary"
                      sx={{ fontSize: 14 }}
                    >
                      {roles.motherTotalUniqueRoles}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: 12 }}
                    >
                      {t('virtualFamily.roles.mother')}
                    </Typography>
                    <StraightOutlinedIcon />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: 12 }}
                    >
                      {t('app.user')}
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.primary"
                      sx={{ fontSize: 14 }}
                    >
                      {summary.activeUsersCount.activeMothersCount}
                    </Typography>
                  </Grid>
                  <Grid item lg={2} md={4} xs={4} sx={{ textAlign: 'center' }}>
                    <Typography
                      variant="body1"
                      color="text.primary"
                      sx={{ fontSize: 14 }}
                    >
                      {roles.fatherTotalUniqueRoles}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: 12 }}
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: 12 }}
                    >
                      {t('virtualFamily.roles.father')}
                    </Typography>
                    <StraightOutlinedIcon />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: 12 }}
                    >
                      {t('app.user')}
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.primary"
                      sx={{ fontSize: 14 }}
                    >
                      {summary.activeUsersCount.activeFathersCount}
                    </Typography>
                  </Grid>
                  <Grid item lg={2} md={4} xs={4} sx={{ textAlign: 'center' }}>
                    <Typography
                      variant="body1"
                      color="text.primary"
                      sx={{ fontSize: 14 }}
                    >
                      {roles.amooTotalUniqueRoles}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: 12 }}
                    >
                      {t('virtualFamily.roles.amoo')}
                    </Typography>
                    <StraightOutlinedIcon />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: 12 }}
                    >
                      {t('app.user')}
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.primary"
                      sx={{ fontSize: 14 }}
                    >
                      {summary.activeUsersCount.activeAmoosCount}
                    </Typography>
                  </Grid>
                  <Grid item lg={2} md={4} xs={4} sx={{ textAlign: 'center' }}>
                    <Typography
                      variant="body1"
                      color="text.primary"
                      sx={{ fontSize: 14 }}
                    >
                      {roles.khalehTotalUniqueRoles}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: 12 }}
                    >
                      {t('virtualFamily.roles.khaleh')}
                    </Typography>
                    <StraightOutlinedIcon />{' '}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: 12 }}
                    >
                      {t('app.user')}
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.primary"
                      sx={{ fontSize: 14 }}
                    >
                      {summary.activeUsersCount.activeKhalehsCount}
                    </Typography>
                  </Grid>
                  <Grid item lg={2} md={4} xs={4} sx={{ textAlign: 'center' }}>
                    <Typography
                      variant="body1"
                      color="text.primary"
                      sx={{ fontSize: 14 }}
                    >
                      {roles.daeiTotalUniqueRoles}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: 12 }}
                    >
                      {t('virtualFamily.roles.daei')}
                    </Typography>
                    <StraightOutlinedIcon />{' '}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: 12 }}
                    >
                      {t('app.user')}
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.primary"
                      sx={{ fontSize: 14 }}
                    >
                      {summary.activeUsersCount.activeDaeisCount}
                    </Typography>
                  </Grid>
                  <Grid item lg={2} md={4} xs={4} sx={{ textAlign: 'center' }}>
                    <Typography
                      variant="body1"
                      color="text.primary"
                      sx={{ fontSize: 14 }}
                    >
                      {roles.ammeTotalUniqueRoles}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: 12 }}
                    >
                      {t('virtualFamily.roles.amme')}
                    </Typography>
                    <StraightOutlinedIcon />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: 12 }}
                    >
                      {t('app.user')}
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.primary"
                      sx={{ fontSize: 14 }}
                    >
                      {summary.activeUsersCount.activeAmmesCount}
                    </Typography>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Panel>
      </Box>
    </Box>
  );
}

VirtualFamilyLeftPanel.propTypes = {
  season: PropTypes.any,
  setSeason: PropTypes.func.isRequired,
  options: PropTypes.array,
};

export default React.memo(VirtualFamilyLeftPanel);
