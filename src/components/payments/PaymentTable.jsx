/* eslint-disable no-underscore-dangle */
/* eslint-disable react/prop-types */
/* eslint-disable react/no-unstable-nested-components */

import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import LastPageIcon from '@mui/icons-material/LastPage';
import {
  TableFooter,
  Skeleton,
  IconButton,
  TableContainer,
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  Collapse,
  CardMedia,
  Link,
  LinearProgress,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { visuallyHidden } from '@mui/utils';
import {
  dateCleaner,
  dateConvertor,
  numberConvertor,
} from '../../utils/persianToEnglish';
import { fetchTransactions } from '../../features/reportSlice';
import {
  NeedTypeEnum,
  PaymentStatusEnum,
  ProductStatusEnum,
} from '../../utils/types';
import { prepareUrl } from '../../utils/helpers';
import PayerTooltip from './PayerTooltip';

function TablePaginationActions(props) {
  const { i18n } = useTranslation();
  const { count, page, rowsPerPage, onPageChange } = props;

  const isRtl = i18n.language === 'fa';

  const handleFirstPageButtonClick = (event) => {
    const newPage = 0;
    onPageChange(event, newPage);
  };

  const handleBackButtonClick = (event) => {
    const newPage = page - 1;
    onPageChange(event, newPage);
  };

  const handleNextButtonClick = (event) => {
    const newPage = page + 1;
    onPageChange(event, newPage);
  };

  const handleLastPageButtonClick = (event) => {
    // guard against rowsPerPage === 0
    const lastPage =
      rowsPerPage > 0 ? Math.max(0, Math.ceil(count / rowsPerPage) - 1) : 0;
    onPageChange(event, lastPage);
  };

  return (
    <Box sx={{ flexShrink: 0, ml: 2.5 }}>
      <IconButton
        onClick={handleFirstPageButtonClick}
        disabled={page === 0}
        aria-label="first page"
      >
        {!isRtl ? <LastPageIcon /> : <FirstPageIcon />}
      </IconButton>
      <IconButton
        onClick={handleBackButtonClick}
        disabled={page === 0}
        aria-label="previous page"
      >
        {!isRtl ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
      </IconButton>
      <IconButton
        onClick={handleNextButtonClick}
        disabled={
          rowsPerPage > 0 ? page >= Math.ceil(count / rowsPerPage) - 1 : true
        }
        aria-label="next page"
      >
        {!isRtl ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
      </IconButton>
      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={
          rowsPerPage > 0 ? page >= Math.ceil(count / rowsPerPage) - 1 : true
        }
        aria-label="last page"
      >
        {!isRtl ? <FirstPageIcon /> : <LastPageIcon />}
      </IconButton>
    </Box>
  );
}

TablePaginationActions.propTypes = {
  count: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  page: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
};

function descendingComparator(a, b, orderBy) {
  if (
    orderBy === 'updated' ||
    orderBy === 'created' ||
    orderBy === 'doneAt' ||
    orderBy === 'confirmDate' ||
    orderBy === 'purchase_date' ||
    orderBy === 'status_updated_at' ||
    orderBy === 'expected_delivery_date' ||
    orderBy === 'ngo_delivery_date' ||
    orderBy === 'child_delivery_date'
  ) {
    if (new Date(b[orderBy]).getTime() < new Date(a[orderBy]).getTime()) {
      return -1;
    }
    if (new Date(b[orderBy]).getTime() > new Date(a[orderBy]).getTime()) {
      return 1;
    }
  } else {
    if (b[orderBy] < a[orderBy]) {
      return -1;
    }
    if (b[orderBy] > a[orderBy]) {
      return 1;
    }
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

function EnhancedTableHead(props) {
  const { t, i18n } = useTranslation();

  const [headCells, setHeadCells] = useState();
  const { order, orderBy } = props;

  const headCellsProduct = [
    {
      id: '#',
      numeric: false,
      disablePadding: false,
      label: '',
      width: '50px',
    },
    {
      id: 'id',
      numeric: true,
      disablePadding: false,
      label: t('need.id'),
      width: '50px',
    },
    {
      id: 'img',
      numeric: false,
      disablePadding: false,
      label: t('need.img.product'),
      width: '50px',
    },
    {
      id: '_cost',
      numeric: true,
      disablePadding: false,
      label: t('need.cost'),
      width: '100px',
    },
    {
      id: 'purchase_cost',
      numeric: true,
      disablePadding: false,
      label: t('need.purchaseCost'),
      width: '120px',
    },
    {
      id: 'need_amount',
      numeric: true,
      disablePadding: false,
      label: t('need.needAmount'),
      width: '50px',
    },
    {
      id: 'refund',
      numeric: true,
      disablePadding: false,
      label: t('need.refund'),
      width: '50px',
    },
    {
      id: 'sayContribution',
      numeric: true,
      disablePadding: false,
      label: t('need.sayContribution'),
      width: '50px',
    },
    {
      id: 'donation',
      numeric: true,
      disablePadding: false,
      label: t('need.donation'),
      width: '120px',
    },
  ];

  useEffect(() => {
    setHeadCells(headCellsProduct);
  }, [i18n.language]);

  return (
    <TableHead>
      <TableRow>
        {headCells &&
          headCells.map((headCell) => (
            <TableCell
              key={headCell.id}
              align="center"
              padding={headCell.disablePadding ? 'none' : 'normal'}
              sx={{ minWidth: headCell.width }}
            >
              <>
                <Typography
                  variant="subtitle1"
                  fontWeight="500"
                  fontSize="small"
                >
                  {headCell.label}
                </Typography>
                {orderBy === headCell.id ? (
                  <Box component="span" sx={visuallyHidden}>
                    {order === 'desc'
                      ? 'sorted descending'
                      : 'sorted ascending'}
                  </Box>
                ) : null}
              </>
            </TableCell>
          ))}
      </TableRow>
    </TableHead>
  );
}

EnhancedTableHead.propTypes = {
  order: PropTypes.oneOf(['asc', 'desc']).isRequired,
  orderBy: PropTypes.string.isRequired,
};

export default function PaymentTable() {
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isRtl = i18n.language === 'fa';

  // transactions pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('doneAt');

  const transactions = useSelector((s) => s.report.transactions);
  const loadingTransactions = useSelector((s) => s.report.loadingTransactions);

  // total items (fall back to data length if meta is missing)
  const totalItems = React.useMemo(
    () =>
      transactions &&
      transactions.meta &&
      typeof transactions.meta.totalItems === 'number'
        ? transactions.meta.totalItems
        : transactions && transactions.data
          ? transactions.data.length
          : 0,
    [transactions],
  );

  const needs = useMemo(
    () =>
      transactions?.data && transactions.data.length ? transactions.data : [],
    [transactions],
  );

  // initial load
  useEffect(() => {
    dispatch(
      fetchTransactions({
        page,
        rowsPerPage,
        start: null,
        end: null,
      }),
    );
  }, []);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    dispatch(
      fetchTransactions({
        page: newPage,
        rowsPerPage,
        start: null,
        end: null,
      }),
    );
  };

  const handleChangeRowsPerPage = (event) => {
    const value = parseInt(event.target.value, 10);
    setRowsPerPage(value);
    setPage(0);
    dispatch(
      fetchTransactions({
        page: 0,
        rowsPerPage: value,
        start: null,
        end: null,
      }),
    );
  };
  // compute the slice of transactions to display for the current page
  // If the backend provides paginated data (i.e. only the current page in transactions.data)
  // we should display it as-is. If the frontend has the full dataset, we slice it client-side.
  const paginatedData = React.useMemo(() => {
    if (!transactions || !transactions.data) return [];

    // Detect server-side pagination: backend commonly returns a `currentPage` or similar field
    const isServerSide =
      transactions.meta &&
      (typeof transactions.meta.currentPage === 'number' ||
        typeof transactions.meta.page === 'number');

    if (isServerSide) {
      // transactions.data already contains the items for the current page
      return transactions.data;
    }

    // Client-side pagination (we have the full dataset)
    if (rowsPerPage <= 0) return transactions.data; // show all
    const start = page * rowsPerPage;
    return transactions.data.slice(start, start + rowsPerPage);
  }, [transactions, page, rowsPerPage]);

  function Row(props) {
    const { row } = props;

    const [accOpen, setAccOpen] = useState(false);

    const theCost = row.purchase_cost && row.purchase_cost;

    const payAmount = row.p
      .filter((a) => a.id_user !== Number(import.meta.env.VITE_SAY_ID))
      .map((p) => Number(p.need_amount))
      .filter((a) => Number.isFinite(a) && a > 0)
      .reduce((accumulator, currentValue) => accumulator + currentValue, 0);

    const credit =
      row.p.filter(
        (p) => Number(p.credit_amount) && Number(p.credit_amount) < 0,
      )[0] &&
      row.p
        .filter((p) => Number(p.credit_amount) && Number(p.credit_amount) < 0)
        .map((p) => Number(p.credit_amount))
        .reduce((accumulator, currentValue) => accumulator + currentValue, 0);

    const sayPay = row.p
      .filter((a) => a.id_user === Number(import.meta.env.VITE_SAY_ID))
      .map((p) => Number(p.need_amount))
      .filter((a) => Number.isFinite(a) && a > 0)
      .reduce((accumulator, currentValue) => accumulator + currentValue, 0);

    const sayEmpower = row.p
      .map((p) => Number(p.donation_amount) && Number(p.donation_amount))
      .reduce((accumulator, currentValue) => accumulator + currentValue, 0);

    return (
      <>
        <TableRow
          hover
          role="checkbox"
          tabIndex={-1}
          sx={{ '& > *': { borderBottom: 'unset' }, height: '100px' }}
        >
          <TableCell align="center">
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={() => setAccOpen(!accOpen)}
            >
              {accOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          </TableCell>
          <TableCell
            sx={{
              color: (th) =>
                theCost / payAmount < 1.5
                  ? th.palette.text.secondary
                  : row.child_delivery_date !== null && 'red',
              fontSize: 12,
            }}
            component="th"
            scope="row"
          >
            {row.id}
          </TableCell>
          <TableCell align="center">
            <Box display="flex" alignItems="center">
              <Link href={row.link} target="_blank">
                <CardMedia
                  component="img"
                  image={
                    row.img && row.img
                      ? row.img
                      : row.imageUrl && prepareUrl(row.imageUrl)
                  }
                  alt={
                    row.name_translation
                      ? row.name_translation.en
                      : prepareUrl(row.imageUrl)
                  }
                  sx={{
                    borderRadius: '10px',
                    height: '50px',
                    width: '50px',
                  }}
                />
              </Link>
              <Box
                sx={{
                  ml: isRtl && 2,
                  mr: !isRtl && 2,
                }}
              >
                <Typography
                  sx={{ color: 'gray' }}
                  variant="subtitle1"
                  fontWeight="600"
                >
                  {i18n.language === 'fa'
                    ? row.name_translations.fa
                    : row.name_translations.en}
                </Typography>
              </Box>
            </Box>
          </TableCell>
          <TableCell
            sx={{
              color: () => theme.palette.text.secondary,
            }}
          >
            {row._cost.toLocaleString()}
          </TableCell>
          <TableCell
            sx={{
              color: () => theme.palette.text.secondary,
            }}
          >
            {(theCost && theCost.toLocaleString()) ||
              (row.status >= PaymentStatusEnum.COMPLETE_PAY ? (
                <Typography
                  sx={{ fontSize: 9, textAlign: 'center' }}
                  fontWeight="400"
                >
                  <br />
                  {row.type === NeedTypeEnum.PRODUCT
                    ? t('need.waitingPurchase')
                    : !row.bank_track_id
                      ? t('need.waitingTransfer')
                      : t('need.waitingNgo')}
                </Typography>
              ) : (
                <Typography
                  sx={{ fontSize: 9, textAlign: 'center' }}
                  fontWeight="400"
                >
                  {t('need.waitingPayment')}
                </Typography>
              ))}
          </TableCell>
          <TableCell
            sx={{
              color: () => theme.palette.text.secondary,
            }}
          >
            {payAmount && payAmount.toLocaleString()}
            <Typography sx={{ fontSize: 9 }} fontWeight="400">
              {row.status < PaymentStatusEnum.COMPLETE_PAY && (
                <>
                  {t('need.partialPay')}
                  {`(${Math.round(
                    (row.p
                      .map((p) => Number(p.need_amount))
                      .filter((a) => Number.isFinite(a) && a > 0)
                      .reduce(
                        (accumulator, currentValue) =>
                          accumulator + currentValue,
                        0,
                      ) /
                      row._cost) *
                      100,
                  )}%)`}
                  <LinearProgress
                    variant="determinate"
                    value={
                      (row.p
                        .map((p) => Number(p.need_amount))
                        .filter((a) => Number.isFinite(a) && a > 0)
                        .reduce(
                          (accumulator, currentValue) =>
                            accumulator + currentValue,
                          0,
                        ) /
                        row._cost) *
                      100
                    } // Value from 0 to 100
                    sx={{
                      height: 3, // Small height for a tiny bar
                      borderRadius: 2, // Optional: rounded corners
                      width: '100%', // Full width of the container
                    }}
                  />
                </>
              )}
            </Typography>
          </TableCell>
          <TableCell align="center" sx={{ direction: 'rtl' }}>
            {(credit && credit.toLocaleString()) ||
              (row.type === NeedTypeEnum.PRODUCT &&
              row.status > PaymentStatusEnum.COMPLETE_PAY ? (
                payAmount <= theCost ? (
                  '-'
                ) : (
                  <Typography
                    sx={{ fontSize: 9, textAlign: 'center' }}
                    fontWeight="400"
                  >
                    {t('need.waitingNgo')}
                  </Typography>
                )
              ) : (
                '-'
              ))}
          </TableCell>
          {/* SAY contribution */}
          <TableCell align="center">
            {row.type === NeedTypeEnum.PRODUCT &&
            row.status >= PaymentStatusEnum.COMPLETE_PAY &&
            row.status >= ProductStatusEnum.DELIVERED_TO_NGO &&
            payAmount < theCost ? (
              sayPay.toLocaleString()
            ) : row.type === NeedTypeEnum.SERVICE || payAmount >= theCost ? (
              '-'
            ) : (
              <Typography
                sx={{ fontSize: 9, textAlign: 'center' }}
                fontWeight="400"
              >
                {t('need.waitingNgo')}
              </Typography>
            )}
          </TableCell>
          {/* Say empower */}
          <TableCell align="center">
            {sayEmpower ? sayEmpower.toLocaleString() : '-'}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
            <Collapse in={accOpen} timeout="auto" unmountOnExit>
              <Box sx={{ mb: 5 }}>
                <Typography
                  gutterBottom
                  variant="h5"
                  sx={{
                    mt: 2,
                    backgroundColor: () => theme.palette.grey.A400,
                    p: '5px 15px',
                    color: (th) =>
                      `${
                        th.palette.mode === 'dark'
                          ? th.palette.grey.A700
                          : 'rgba(0, 0, 0, 0.87)'
                      }`,
                  }}
                >
                  {t('report.history.title')}
                </Typography>
                <Table size="small" aria-label="purchases">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, width: '100px' }}>
                        {t('report.history.status')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '100px' }}>
                        {t('report.history.date')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '100px' }}>
                        {t('report.history.receipt')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{ fontSize: 12, fontWeight: 600 }}
                      >
                        {t('need.created')}
                      </TableCell>
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{ fontSize: 12 }}
                      >
                        {row.created
                          ? isRtl
                            ? dateConvertor(row.created)
                            : dateCleaner(row.created)
                          : '-'}
                      </TableCell>
                      <TableCell> - </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{ fontSize: 12, fontWeight: 600 }}
                      >
                        {t('need.confirmDate')}
                      </TableCell>
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{ fontSize: 12 }}
                      >
                        {row.confirmDate
                          ? isRtl
                            ? dateConvertor(row.confirmDate)
                            : dateCleaner(row.confirmDate)
                          : '-'}
                      </TableCell>
                      <TableCell>-</TableCell>
                    </TableRow>
                    {/* <TableRow>
                      <TableCell component="th" scope="row">
                        {t('need.updated')}
                      </TableCell>
                      <TableCell component="th" scope="row">
                        {row.updated ? dateConvertor(row.updated) : '-'}
                      </TableCell>
                      <TableCell>-</TableCell>
                    </TableRow> */}
                    {/* 2   Complete payment	*/}
                    <TableRow>
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{ fontSize: 12, fontWeight: 600 }}
                      >
                        {t('need.needStatus.2')}
                      </TableCell>
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{ fontSize: 12 }}
                      >
                        {row.doneAt
                          ? isRtl
                            ? dateConvertor(row.doneAt)
                            : dateCleaner(row.doneAt)
                          : '-'}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12 }}>
                        {row.p && row.p[0] && <PayerTooltip row={row} />}
                      </TableCell>
                    </TableRow>
                    {/* 3 Product delivered to NGO - Money transferred to the NGO */}
                    <TableRow>
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{ fontSize: 12, fontWeight: 600 }}
                      >
                        {row.type === NeedTypeEnum.PRODUCT
                          ? t('need.needStatus.p3')
                          : t('need.needStatus.s3')}
                      </TableCell>
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{ fontSize: 12 }}
                      >
                        {row.type === NeedTypeEnum.PRODUCT && row.purchase_date
                          ? isRtl
                            ? dateConvertor(row.purchase_date)
                            : dateCleaner(row.purchase_date)
                          : row.type === NeedTypeEnum.SERVICE &&
                              row.ngo_delivery_date
                            ? isRtl
                              ? dateConvertor(row.ngo_delivery_date)
                              : dateCleaner(row.ngo_delivery_date)
                            : '-'}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12 }}>
                        {row.deliveryCode &&
                          parseInt(numberConvertor(row.deliveryCode), 10)
                            .toLocaleString('en-US')
                            .replace(/,/g, '-')}
                        {row.type === NeedTypeEnum.SERVICE &&
                          row.status > 2 &&
                          row.bank_track_id &&
                          parseInt(numberConvertor(row.bank_track_id), 10)}
                      </TableCell>
                    </TableRow>
                    {/* 4 Product delivered to NGO - service delivery to child */}
                    <TableRow>
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{ fontSize: 12, fontWeight: 600 }}
                      >
                        {row.type === NeedTypeEnum.PRODUCT
                          ? t('need.needStatus.p4')
                          : t('need.needStatus.s4')}
                      </TableCell>
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{ fontSize: 12 }}
                      >
                        {row.type === NeedTypeEnum.PRODUCT &&
                        row.ngo_delivery_date
                          ? isRtl
                            ? dateConvertor(row.ngo_delivery_date)
                            : dateCleaner(row.ngo_delivery_date)
                          : row.type === NeedTypeEnum.SERVICE &&
                              row.child_delivery_date
                            ? isRtl
                              ? dateConvertor(row.child_delivery_date)
                              : dateCleaner(row.child_delivery_date)
                            : '-'}
                        <Typography sx={{ fontSize: 8, color: 'grey' }}>
                          {row.type === NeedTypeEnum.PRODUCT &&
                            !row.ngo_delivery_date &&
                            row.expected_delivery_date &&
                            (isRtl
                              ? dateConvertor(row.expected_delivery_date)
                              : dateCleaner(row.expected_delivery_date))}
                        </Typography>
                      </TableCell>
                    </TableRow>
                    {/* 5 product delivery to child */}
                    {row.type === NeedTypeEnum.PRODUCT && (
                      <TableRow>
                        <TableCell
                          component="th"
                          scope="row"
                          sx={{ fontSize: 12, fontWeight: 600 }}
                        >
                          {t('need.needStatus.p5')}
                        </TableCell>
                        <TableCell
                          component="th"
                          scope="row"
                          sx={{ fontSize: 12 }}
                        >
                          {row.child_delivery_date
                            ? isRtl
                              ? dateConvertor(row.child_delivery_date)
                              : dateCleaner(row.child_delivery_date)
                            : '-'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      </>
    );
  }

  Row.propTypes = {
    row: PropTypes.shape({
      id: PropTypes.number,
      child_id: PropTypes.number,
      childFirstName: PropTypes.string,
      childSayName: PropTypes.string,
      childLastName: PropTypes.string,
      name: PropTypes.string,
      title: PropTypes.string,
      informations: PropTypes.string,
      details: PropTypes.string,
      paid: PropTypes.number,
      expected_delivery_date: PropTypes.string,
      purchase_cost: PropTypes.number,
      status: PropTypes.number,
      type: PropTypes.number,
      img: PropTypes.string,
      imageUrl: PropTypes.string,
      amount: PropTypes.number,
      ngoId: PropTypes.number,
      created_by_id: PropTypes.number,
      created: PropTypes.string,
      updated: PropTypes.string,
      confirmDate: PropTypes.string,
      child_delivery_date: PropTypes.string,
      ngo_delivery_date: PropTypes.string,
      purchase_date: PropTypes.string,
      doneAt: PropTypes.string,
      _cost: PropTypes.number,
      bank_track_id: PropTypes.string,
      dkc: PropTypes.string,
      payments: PropTypes.array,
      affiliateLinkUrl: PropTypes.string,
      link: PropTypes.string,
    }),
  };

  return (
    <TableContainer
      // component={Paper}
      sx={{
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(0,0,0,0.22) transparent',

        '&::WebkitScrollbar': {
          width: 8,
          height: 8, // horizontal thickness
        },
        '&::WebkitScrollbarThumb': {
          background: 'rgba(0,0,0,0.22)',
          borderRadius: '999px',
          minHeight: 24,
          minWidth: 24,
          border: '2px solid transparent',
          backgroundClip: 'padding-box',
        },
        '&::WebkitScrollbarTrack': {
          background: 'transparent',
        },
      }}
    >
      {loadingTransactions ? (
        <Skeleton width="100%" height={600} />
      ) : (
        <Table sx={{ minWidth: 500 }} aria-label="custom pagination table">
          <EnhancedTableHead
            order={order}
            orderBy={orderBy}
            onRequestSort={handleRequestSort}
            rowCount={needs.length}
          />
          <TableBody>
            {paginatedData.length > 0 &&
              stableSort(paginatedData, getComparator(order, orderBy)).map(
                (row) => <Row key={row.id} row={row} />,
              )}
          </TableBody>
          <TableFooter
            sx={{
              direction: isRtl ? 'rtl' : 'ltr',
            }}
          >
            <TableRow>
              <TablePagination
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} از ${count !== -1 ? count : `بیشتر از ${to}`}`
                }
                labelRowsPerPage={t('app.rowsPerPage')}
                rowsPerPageOptions={[5, 10, 25]}
                count={totalItems}
                rowsPerPage={rowsPerPage}
                page={page}
                sx={{
                  direction: isRtl ? 'rtl' : 'ltr',
                }}
                slotProps={{
                  select: {
                    inputProps: {
                      'aria-label': 'rows per page',
                    },
                    native: true,
                  },
                }}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                ActionsComponent={(subprops) => (
                  <TablePaginationActions
                    {...subprops}
                    rowsPerPage={rowsPerPage}
                  />
                )}
              />
            </TableRow>
          </TableFooter>
        </Table>
      )}
    </TableContainer>
  );
}
