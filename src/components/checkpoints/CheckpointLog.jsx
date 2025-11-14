/* eslint-disable no-underscore-dangle */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import { useTheme } from '@mui/material/styles';
import { dateConvertor } from '../../utils/persianToEnglish';
import { getChipStyle, getChipSxFromBase } from '../../utils/chipStyle';
import { fetchCheckpoints } from '../../features/reportSlice';

export default function CheckpointLog() {
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isRtl = i18n.language === 'fa';

  const checkpoints = useSelector((s) => s.report && s.report.checkpoints);
  const loading = useSelector((s) => s.report && s.report.loading);
  const error = useSelector((s) => s.report && s.report.error);

  const [openId, setOpenId] = useState(null);

  // initial load
  useEffect(() => {
    dispatch(fetchCheckpoints());
  }, []);

  function formatDate(val) {
    if (!val) return '';
    try {
      return dateConvertor(new Date(val).toLocaleString());
    } catch {
      return val;
    }
  }

  const toggleOpen = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <Box
      sx={{
        mb: 10,
        textAlign: 'initial',
        width: '100%',
        p: 2,
        color: (th) => th.palette.text.primary,
      }}
    >
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress
            size={20}
            sx={{ color: (th) => th.palette.text.primary }}
          />
        </Box>
      )}

      {error && (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2">
            {t('checkpoint.errorMessage', {
              message:
                typeof error === 'string' ? error : JSON.stringify(error),
            })}
          </Typography>
        </Box>
      )}

      <Box
        role="region"
        aria-label={t('checkpoint.listAria')}
        sx={{
          height: 560,
          overflowY: 'auto',
          overflowX: 'hidden',
          bgcolor: 'transparent',
          mt: 1,
        }}
      >
        {!loading && !error && checkpoints && checkpoints.length === 0 && (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2">
              {t('checkpoint.noCheckpoints')}
            </Typography>
          </Box>
        )}

        <List disablePadding>
          {checkpoints &&
            checkpoints.map((it) => {
              const id = it.id ?? it._id ?? JSON.stringify(it);

              // localized type label (fall back to raw type)
              const typeLabel = it.type
                ? t(`checkpoint.typeLabels.${it.type}`, {
                    defaultValue: it.type,
                  })
                : '';

              const chipStyle = getChipStyle(it.type);

              return (
                <React.Fragment key={id}>
                  <ListItem
                    sx={{
                      display: 'block',
                      py: 0.5,
                    }}
                    disableGutters
                  >
                    {/* Primary single-line row */}
                    <Grid
                      container
                      wrap="nowrap"
                      alignItems="center"
                      spacing={1}
                      sx={{ gap: 1 }}
                    >
                      {/* Title (truncates) */}
                      <Grid item xs sx={{ minWidth: 0, overflow: 'hidden' }}>
                        <Typography
                          sx={{
                            fontWeight: 300,
                            fontSize: 10,
                            minWidth: 0,
                            maxWidth: '100%',
                          }}
                          noWrap
                          component="span"
                        >
                          {isRtl ? it.title.fa : it.title.en}
                        </Typography>
                      </Grid>

                      {/* Type chip (keeps natural width) */}
                      <Grid item sx={{ display: 'flex', alignItems: 'center' }}>
                        {typeLabel ? (
                          <Chip
                            variant="outlined"
                            label={typeLabel}
                            size="small"
                            sx={getChipSxFromBase(chipStyle.bg, {
                              bgAlpha: !isDark ? 0.06 : 0.4,
                              borderAlpha: !isDark ? 0.44 : 1,
                              // forceTextColor: chipStyle.color,
                            })}
                          />
                        ) : (
                          <Typography variant="caption" sx={{ opacity: 0.85 }}>
                            {it.type || ''}
                          </Typography>
                        )}
                      </Grid>

                      {/* Date + actions: pushed to the far right, stays on one line */}
                      <Grid
                        item
                        sx={{
                          marginLeft: 'auto',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            whiteSpace: 'nowrap',
                            fontWeight: 200,
                            fontSize: 8,
                          }}
                        >
                          {formatDate(it.checkPointDate || it.checkpointDate)}
                        </Typography>

                        <Tooltip
                          title={
                            openId === id
                              ? t('checkpoint.hideDetails')
                              : t('checkpoint.showDetails')
                          }
                        >
                          <IconButton
                            size="small"
                            aria-expanded={openId === id}
                            aria-label={
                              openId === id
                                ? t('checkpoint.collapseDetails')
                                : t('checkpoint.expandDetails')
                            }
                            onClick={() => toggleOpen(id)}
                          >
                            <ExpandMoreIcon
                              sx={{
                                transform:
                                  openId === id
                                    ? 'rotate(180deg)'
                                    : 'rotate(0deg)',
                                transition: 'transform 200ms',
                              }}
                            />
                          </IconButton>
                        </Tooltip>
                      </Grid>
                    </Grid>

                    {/* Collapsible details (description + url) */}
                    <Collapse in={openId === id} timeout="auto" unmountOnExit>
                      <Box sx={{ mt: 1, pr: 1 }}>
                        {it.description && (
                          <Typography
                            variant="subtitle2"
                            sx={{
                              whiteSpace: 'pre-wrap',
                              mb: it.url ? 1 : 0,
                              color: 'text.secondary',
                              fontSize: 12,
                            }}
                          >
                            {isRtl ? it.description.fa : it.description.en}
                          </Typography>
                        )}

                        {it.url && (
                          <Link
                            href={it.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            underline="hover"
                          >
                            {it.url}
                          </Link>
                        )}
                      </Box>
                    </Collapse>
                  </ListItem>

                  <Divider
                    sx={{ borderColor: (th) => th.palette.text.primary }}
                  />
                </React.Fragment>
              );
            })}
        </List>
      </Box>
    </Box>
  );
}
