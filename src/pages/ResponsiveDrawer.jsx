/* eslint-disable no-plusplus */
import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  AppBar,
  Box,
  Button,
  CssBaseline,
  Divider,
  Drawer,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useTranslation } from 'react-i18next';
import BarChartIcon from '@mui/icons-material/BarChart';
import InterestsOutlinedIcon from '@mui/icons-material/InterestsOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import ChildCareOutlinedIcon from '@mui/icons-material/ChildCareOutlined';
import DirectionsOutlinedIcon from '@mui/icons-material/DirectionsOutlined';
import { useDispatch } from 'react-redux';
import moment from 'moment-jalaali';
import CircleBackground from '../components/CircleBackground';
import ThemeToggle from '../components/ThemeToggle';
import LogoIcon from '../components/LogoIcon';
import { fetchSeasonComparison, fetchSummary } from '../features/reportSlice';
import PaymentLeftPanel from '../components/payments/PaymentLeftPanel';
import Panel from '../components/Panel';
import NeedLeftPanel from '../components/needs/NeedLeftPanel';
import VirtualFamilyLeftPanel from '../components/virtual-families/VirtualFamilyLeftPanel';
import ChildLeftPanel from '../components/children/ChildLeftPanel';

const drawerWidth = 260;
const REPORT_IDS = [
  'payments',
  'needs',
  'virtualFamilies',
  'children',
  'checkpoints',
  'smartContracts',
];

function getYearsDescending(fromYear = 1399) {
  moment.loadPersian({ usePersianDigits: false });
  const currentYear = moment().jYear();
  const years = [];
  for (let year = currentYear; year >= fromYear; year--) {
    years.push(year.toString());
  }
  return years;
}

const options = getYearsDescending();

export default function ResponsiveDrawer(props) {
  const { window } = props;
  const dispatch = useDispatch();
  const theme = useTheme();
  const { t, i18n } = useTranslation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [selectedId, setSelectedId] = useState(REPORT_IDS[0]);
  const [season, setSeason] = useState(options[0]);

  useEffect(() => {
    dispatch(fetchSummary());
  }, []);

  useEffect(() => {
    dispatch(fetchSeasonComparison({ season, includeRates: false }));
  }, [season]);

  useEffect(() => {
    // eslint-disable-next-line no-undef
    document.dir = i18n.language === 'fa' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  const isRtl = i18n.language === 'fa';
  const drawerAnchor = !isRtl ? 'right' : 'left';

  const appBarSx = {
    backdropFilter: 'blur(6px)',
    backgroundColor: theme.palette.background.default,
    borderBottom: `1px solid ${theme.palette.divider}`,
    width: { sm: `calc(100% - ${drawerWidth}px)` },
    // offset AppBar away from the drawer side on desktop
    ml: { sm: drawerAnchor === 'left' ? `${drawerWidth}px` : 0 },
    mr: { sm: drawerAnchor === 'right' ? `${drawerWidth}px` : 0 },
  };

  const mainSx = {
    flexGrow: 1,
    p: { xs: 2, md: 3 },
    width: '100%',
    mr: { sm: !isRtl ? `${drawerWidth}px` : 0 },
    direction: !isRtl ? 'rtl' : 'ltr',
  };

  const permanentDrawerOffset =
    drawerAnchor === 'right' ? { ml: 2 } : { mr: 2 };

  /* icons */
  const iconMap = {
    payments: <BarChartIcon />,
    needs: <InterestsOutlinedIcon />,
    checkpoints: <DirectionsOutlinedIcon />,
    virtualFamilies: <GroupsOutlinedIcon />,
    children: <ChildCareOutlinedIcon />,
    smartContracts: <ArticleOutlinedIcon />,
  };

  /* build translated reports */
  const translatedReports = useMemo(
    () =>
      REPORT_IDS.map((id) => ({
        id,
        title: t(`drawer.${id}`),
        icon: iconMap[id],
        component: (
          <Panel
            title={t(`reports.${id}.heading`)}
            align={!isRtl ? 'right' : 'left'}
            id={id}
          >
            <Typography fontWeight="100" sx={{ mb: 2 }}>
              {t(`reports.${id}.summary`)}
            </Typography>
          </Panel>
        ),
      })),
    [t, isRtl],
  );

  const activeReport = useMemo(
    () =>
      translatedReports.find((r) => r.id === selectedId) ||
      translatedReports[0],
    [selectedId, translatedReports],
  );

  const handleDrawerClose = () => {
    setIsClosing(true);
    setMobileOpen(false);
  };

  const handleDrawerTransitionEnd = () => {
    setIsClosing(false);
  };

  const handleDrawerToggle = () => {
    if (!isClosing) setMobileOpen((o) => !o);
  };

  const handleSelect = (id) => {
    setSelectedId(id);
    setMobileOpen(false);
  };

  /* drawer content; dir follows language so MUI components behave naturally */
  const drawer = (
    <Box
      dir={!isRtl ? 'rtl' : 'ltr'}
      sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <Toolbar sx={{ px: 2 }}>
        <Typography
          variant="h6"
          sx={{ flexGrow: 1, fontWeight: 700 }}
          align={!isRtl ? 'right' : 'left'}
        >
          {t('app.title')}
        </Typography>
      </Toolbar>

      <Divider />

      <Box sx={{ px: 1.5, mt: 1, flexGrow: 1 }}>
        <List sx={{ display: 'grid', gap: 1 }}>
          {translatedReports.map((r) => (
            <ListItem key={r.id} disablePadding>
              <ListItemButton
                disabled={r.id === 'smartContracts'}
                onClick={() => handleSelect(r.id)}
                selected={r.id === selectedId}
                sx={{
                  borderRadius: 2,
                  px: 1.5,
                  py: 1,
                  justifyContent: 'flex-start',
                  flexDirection: !isRtl ? 'row-reverse' : 'row',
                  '&.Mui-selected': {
                    bgcolor: (th) => th.palette.action.selected,
                    boxShadow: (th) => `0 6px 18px ${th.palette.action.hover}`,
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    direction: 'rtl',
                    minWidth: 40,
                    color:
                      r.id === selectedId ? 'primary.main' : 'text.secondary',
                  }}
                >
                  {r.icon}
                </ListItemIcon>

                <ListItemText
                  primary={r.title}
                  primaryTypographyProps={{
                    fontWeight: 600,
                    align: !isRtl ? 'right' : 'left',
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      <Divider sx={{ mt: 1 }} />

      <Grid container sx={{ justifyContent: 'center', alignItems: 'center' }}>
        <Grid item lg={8}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              const next = i18n.language === 'fa' ? 'en' : 'fa';
              i18n.changeLanguage(next);
            }}
            sx={{
              display: { xs: 'inline-flex', sm: 'inline-flex', width: '100%' },
            }}
          >
            {t('navbar.langButton')}
          </Button>
        </Grid>
        <Grid item>
          <ThemeToggle />
        </Grid>
      </Grid>
    </Box>
  );

  // container for temporary drawer
  const container =
    window !== undefined ? () => window().document.body : undefined;

  // true if viewport width is < MUI 'sm' breakpoint
  const isSmDown = useMediaQuery(theme.breakpoints.down('sm'));
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" elevation={0} sx={appBarSx}>
        <Toolbar>
          {/* drawer on left: show menu icon + lang button before title (mobile menu => left) */}
          <>
            <IconButton
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

            <Box
              sx={{
                m: 'auto',
                top: '0',
              }}
            >
              <LogoIcon />
            </Box>
          </>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: isRtl && drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="reports navigation"
      >
        {!isSmDown && (
          <>
            <CircleBackground />
            <Box
              sx={{
                position: 'absolute',
                left: !isRtl && '-20px',
                right: isRtl && '-20px',
                top: '-200px',
                backgroundColor: '#FF8417',
                backgroundImage: 'none',
                backgroundSize: 'contain',
                backgroundPosition: '175px center',
                borderRadius: '50%',
                width: 730, // adjust as needed
                height: 730, // adjust as needed
                opacity: 0.3,
                zIndex: -1,
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                left: !isRtl && '-20px',
                right: isRtl && '-20px',
                top: '250px',
                backgroundColor: '#F05A31',
                backgroundImage: 'none',
                backgroundSize: 'contain',
                backgroundPosition: '175px center',
                borderRadius: '50%',
                width: 385, // adjust as needed
                height: 385, // adjust as needed
                opacity: 0.3,
                zIndex: -1,
              }}
            />
          </>
        )}

        {/* Temporary mobile drawer (uses same anchor as desktop) */}
        <Drawer
          container={container}
          variant="temporary"
          open={mobileOpen}
          onTransitionEnd={handleDrawerTransitionEnd}
          onClose={handleDrawerClose}
          ModalProps={{ keepMounted: true }}
          anchor={drawerAnchor}
          PaperProps={{ dir: !isRtl ? 'rtl' : 'ltr' }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Permanent desktop drawer */}
        <Drawer
          variant="permanent"
          open
          anchor={drawerAnchor}
          PaperProps={{ dir: !isRtl ? 'rtl' : 'ltr' }}
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              mt: 2,
              height: `calc(100% - 32px)`,
              borderRadius: 2,
              boxShadow: '0 6px 26px rgba(20,20,40,0.06)',
              ...permanentDrawerOffset,
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={mainSx}>
        <Toolbar />
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            {activeReport.component}
          </Grid>
          {activeReport.id === 'payments' && (
            <Grid item xs={12} md={4}>
              <PaymentLeftPanel
                options={options}
                setSeason={setSeason}
                season={season}
              />
            </Grid>
          )}
          {activeReport.id === 'needs' && (
            <Grid item xs={12} md={4}>
              <NeedLeftPanel
                options={options}
                setSeason={setSeason}
                season={season}
              />
            </Grid>
          )}
          {activeReport.id === 'virtualFamilies' && (
            <Grid item xs={12} md={4}>
              <VirtualFamilyLeftPanel
                options={options}
                setSeason={setSeason}
                season={season}
              />
            </Grid>
          )}
          {activeReport.id === 'children' && (
            <Grid item xs={12} md={4}>
              <ChildLeftPanel
                options={options}
                setSeason={setSeason}
                season={season}
              />
            </Grid>
          )}
        </Grid>
      </Box>
    </Box>
  );
}

ResponsiveDrawer.propTypes = {
  window: PropTypes.func,
};
