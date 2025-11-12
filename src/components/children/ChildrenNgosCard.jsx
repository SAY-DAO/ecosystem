import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardHeader,
  CardContent,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tooltip,
  Typography,
  Chip,
  Box,
  Divider,
} from '@mui/material';
import { prepareUrl } from '../../utils/helpers'; // keep if you have this helper

/* Helper: parse phone numbers string into array of clean numbers */
const parsePhones = (raw) => {
  if (!raw) return [];
  const parts = String(raw)
    .split(/[,;|\n]+/)
    .map((p) => p.replace(/\s+/g, '').trim())
    .filter(Boolean);
  const seen = new Set();
  const out = [];
  for (const p of parts) {
    if (!seen.has(p)) {
      seen.add(p);
      out.push(p);
    }
  }
  return out;
};

export default function ChildrenNgosCard({ ngos, maxHeight, compact = true }) {
  const { t } = useTranslation();

  const enriched = useMemo(
    () =>
      (ngos || []).map((n) => ({
        ...n,
        phones: parsePhones(n.phoneNumber),
        logo: n.logoUrl ? prepareUrl(n.logoUrl) : null,
      })),
    [ngos],
  );

  const total = enriched.length;

  // visual helpers
  const avatarSize = compact ? 40 : 46;
  const actionColumnWidth = compact ? 120 : 140; // width reserved for actions
  const phoneTextMax = compact ? 160 : 220;

  // --- NEW: compute per-row height (px) and default scroll area to show exactly 3 rows ---
  // These values are conservative and account for avatar, paddings and divider.
  const itemHeight = compact ? 64 : 80;
  const defaultVisibleRows = 4;
  const computedMaxHeight = maxHeight ?? itemHeight * defaultVisibleRows;

  return (
    <Card sx={{ mt: 2 }}>
      <CardHeader
        title={
          <Typography variant="subtitle2" color="text.secondary">
            {t('children.childrenNgosCard.title', { total })}
          </Typography>
        }
      />

      <CardContent
        sx={{ pt: compact ? 1 : undefined, pb: compact ? 1 : undefined }}
      >
        {total === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t('children.childrenNgosCard.empty')}
          </Typography>
        ) : (
          <Box
            // show only 3 rows by default (or use provided maxHeight)
            sx={{
              maxHeight: computedMaxHeight,
              overflow: 'auto',
              // nicer scrolling on touch devices
              WebkitOverflowScrolling: 'touch',
              // optional: make scrollbar subtle
              '&::-webkit-scrollbar': { width: 8, height: 8 },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(0,0,0,0.12)',
                borderRadius: 8,
              },
            }}
            role="region"
            aria-label={t('children.childrenNgosCard.ariaListLabel', {
              visible: defaultVisibleRows,
            })}
          >
            <List disablePadding>
              {enriched.map((ngo) => (
                <React.Fragment key={ngo.id}>
                  <ListItem
                    alignItems="flex-start"
                    sx={{ py: compact ? 0.75 : 1, p: 1 }}
                    secondaryAction={
                      <Box
                        sx={{
                          width: actionColumnWidth,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1,
                          alignItems: 'flex-end',
                        }}
                      />
                    }
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={ngo.logo || undefined}
                        alt={ngo.name}
                        sx={{
                          width: avatarSize,
                          height: avatarSize,
                          bgcolor: 'background.paper',
                        }}
                        variant="rounded"
                      >
                        {ngo.name ? ngo.name[0] : '?'}
                      </Avatar>
                    </ListItemAvatar>

                    {/* left/main content — reserve space on the right so text doesn't flow under actions */}
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography
                            sx={{ fontWeight: 700, fontSize: 10 }}
                            noWrap
                          >
                            {ngo.name}
                          </Typography>
                          {!ngo.isActive && (
                            <Chip
                              size="small"
                              label={t('children.childrenNgosCard.chipInactive')}
                              sx={{ fontSize: 11 }}
                            />
                          )}
                          {ngo.isDeleted && (
                            <Chip
                              size="small"
                              label={t('children.childrenNgosCard.chipDeleted')}
                              color="error"
                              sx={{ fontSize: 11 }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box display="flex" flexDirection="column" gap={0.5}>
                          {/* phones (up to 2) shown clearly in main text */}
                          <Box display="flex" alignItems="center" gap={0.5}>
                            {ngo.phones.slice(0, 2).map((p) => (
                              <Tooltip key={p} title={p}>
                                <Typography
                                  component="a"
                                  href={`tel:${p}`}
                                  variant="caption"
                                  sx={{
                                    textDecoration: 'none',
                                    p: 1,
                                    color: 'text.secondary',
                                    maxWidth: phoneTextMax,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {p}
                                </Typography>
                              </Tooltip>
                            ))}

                            {ngo.phones.length === 0 && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {t('children.childrenNgosCard.noPhone')}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      }
                      /* *** FIX: prevent ListItemText from wrapping our JSX in a <p>.
                         By forcing its internal Typography to render as a div we avoid
                         invalid <p><div> nesting. Alternatively you could use
                         disableTypography, but this keeps MUI typography props usable. */
                      primaryTypographyProps={{ component: 'div' }}
                      secondaryTypographyProps={{ component: 'div' }}
                    />
                  </ListItem>

                  <Divider component="li" sx={{ my: 0.5 }} />
                </React.Fragment>
              ))}
            </List>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

ChildrenNgosCard.propTypes = {
  ngos: PropTypes.arrayOf(PropTypes.object),
  maxHeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  compact: PropTypes.bool,
};
