import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import { Avatar, Chip } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import { useTranslation } from 'react-i18next';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ClickAwayListener from '@mui/material/ClickAwayListener';

// Simple number formatter
const formatNumber = (value) => {
  if (value == null || Number.isNaN(Number(value))) return '-';
  return new Intl.NumberFormat(undefined).format(Number(value));
};

export default function PayerTooltip({ row = { p: [] } }) {
  const { t } = useTranslation();
  const payers = Array.isArray(row?.p) ? row.p : [];
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);

  const handleToggle = (event) => {
    // prevent parent row clicks if needed
    event.stopPropagation();
    setOpen((prev) => !prev);
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setOpen(false);
      // keep event from bubbling if you want
      event.stopPropagation();
    }
  };

  const CURRENT_USER_ID = Number(import.meta.env.VITE_SAY_ID);

  // We'll aggregate payments per user:
  // - positive/non-negative credit entries will form the visible rows (aggregated),
  // - negative credit entries will NOT create their own rows; their amounts will be summed
  //   into the Refund value for the corresponding user (if that user has a visible row).
  const displayMap = new Map(); // id_user => aggregated object for rendering
  const refundsMap = new Map(); // id_user => sum of negative credit_amounts

  payers.forEach((p) => {
    if (!p) return;
    const uid = p.id_user;
    if (uid === CURRENT_USER_ID) return; // keep same exclusion you had

    const credit = Number(p.credit_amount || 0);
    const need = Number(p.need_amount || 0);
    const donation = Number(p.donation_amount || 0);

    if (credit < 0) {
      // negative credit: accumulate into refundsMap
      const prev = refundsMap.get(uid) || 0;
      refundsMap.set(uid, prev + credit); // credit is negative
      return; // do NOT create a visible row for this entry
    }

    // Only aggregate verified entries for display (same behavior you had)
    if (!p.verified) return;

    // aggregate into displayMap (summing numeric fields)
    const existing = displayMap.get(uid);
    if (!existing) {
      displayMap.set(uid, {
        id_user: uid,
        // keep a stable representative id if you had one per payment
        reprId: p.id ?? `${uid}-${String(p.gateway_track_id || '')}`,
        need_amount: need,
        donation_amount: donation,
        credit_amount: credit,
        gateway_track_present: p.gateway_track_id,
      });
    } else {
      existing.need_amount += need;
      existing.donation_amount += donation;
      existing.credit_amount += credit; // positive credits
      existing.gateway_track_present =
        existing.gateway_track_present || p.gateway_track_id;
    }
  });

  // Build the array of rows to render from displayMap
  const verifiedDisplay = Array.from(displayMap.values());

  // Count needs (users whose aggregated need_amount > 0)
  const countNeeds = verifiedDisplay.filter(
    (u) => Number(u.need_amount) > 0,
  ).length;

  const tooltipContent = (
    <Box sx={{ p: 1 }}>
      {verifiedDisplay.length === 0 ? (
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          No payers!
        </Typography>
      ) : (
        <Stack spacing={1} sx={{ minWidth: 220, maxWidth: 360 }}>
          {verifiedDisplay.map((u) => {
            const refundForUser = refundsMap.get(u.id_user) || 0; // negative or 0
            const total = Number(u.need_amount || 0);

            return (
              <Box key={u.reprId}>
                <Grid container alignItems="center" spacing={1}>
                  <Grid item>
                    <Avatar sx={{ width: 28, height: 28 }}>
                      <AccountCircleIcon fontSize="small" />
                    </Avatar>
                  </Grid>

                  <Grid item xs>
                    <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                      <Typography
                        variant="caption"
                        sx={{ mr: 0.5, display: 'flex', alignItems: 'center' }}
                      >
                        <MonetizationOnIcon sx={{ mr: 0.3, fontSize: 14 }} />
                        {formatNumber(total)}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ ml: 'auto', textAlign: 'center' }}
                      >
                        {u.gateway_track_present ? (
                          <Chip
                            size="small"
                            label={
                              u.gateway_track_present
                                ? u.gateway_track_present
                                : '-'
                            }
                            variant="outlined"
                            color="success"
                            sx={{ height: 26 }}
                          />
                        ) : null}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: 10,
                          p: 1,
                        }}
                      >
                        {t('need.donation2')}:
                        {` ${formatNumber(u.donation_amount ?? 0)}`}
                      </Typography>

                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: 10,
                          p: 1,
                        }}
                      >
                        {t('need.fromWallet')}:{' '}
                        {`${formatNumber(u.credit_amount ?? 0)}`}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: 10,
                          p: 1,
                        }}
                      >
                        {t('need.refund')}:{' '}
                        {`${formatNumber(refundForUser * -1)}`}
                      </Typography>
                    </Stack>
                  </Grid>
                </Grid>
                <Divider sx={{ my: 1 }} />
              </Box>
            );
          })}
        </Stack>
      )}
    </Box>
  );

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <div style={{ display: 'inline-flex' }}>
        <Tooltip
          title={tooltipContent}
          placement="top"
          arrow
          open={open}
          onOpen={handleOpen} // hover/focus -> open
          onClose={handleClose} // mouse leave/blur -> close
          enterDelay={150}
          leaveDelay={200}
          componentsProps={{
            tooltip: {
              sx: {
                p: 0,
                bgcolor: 'background.paper',
                color: 'text.primary',
                boxShadow: 6,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                maxWidth: 380,
              },
            },
          }}
        >
          {/* plain DOM span is safe: MUI will attach handlers here */}
          <Box
            component="span"
            ref={triggerRef}
            role="button"
            tabIndex={0}
            aria-label={`payers-count-${countNeeds}`}
            onClick={handleToggle}
            onKeyDown={handleKeyDown}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              px: 0.6,
              py: 0.35,
              borderRadius: 1,
              cursor: 'pointer',
              '&:hover': { bgcolor: 'action.hover' },
              '&:focus-visible': {
                outline: (theme) => `2px solid ${theme.palette.primary.main}`,
                outlineOffset: 2,
              },
            }}
          >
            <Typography
              color="textSecondary"
              variant="body1"
              component="span"
              sx={{ fontWeight: 600 }}
            >
              {countNeeds} {t('need.payers')}
            </Typography>
            <InfoOutlinedIcon
              fontSize="small"
              sx={{ color: 'text.secondary', opacity: 0.85 }}
            />
          </Box>
        </Tooltip>
      </div>
    </ClickAwayListener>
  );
}

PayerTooltip.propTypes = {
  row: PropTypes.shape({
    p: PropTypes.array,
  }),
};
