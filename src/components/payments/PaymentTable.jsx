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
  TableSortLabel,
  Paper,
  Tooltip,
  Typography,
  Grid,
  Collapse,
  CardMedia,
  Link,
  LinearProgress,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { visuallyHidden } from '@mui/utils';
import { dateConvertor, numberConvertor } from '../../utils/persianToEnglish';
import { fetchTransactions } from '../../features/reportSlice';
import { NeedTypeEnum, PaymentStatusEnum } from '../../utils/types';
import { prepareUrl } from '../../utils/helpers';

function TablePaginationActions(props) {
  const theme = useTheme();
  const { count, page, rowsPerPage, onPageChange } = props;

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
        {theme.direction !== 'rtl' ? <LastPageIcon /> : <FirstPageIcon />}
      </IconButton>
      <IconButton
        onClick={handleBackButtonClick}
        disabled={page === 0}
        aria-label="previous page"
      >
        {theme.direction !== 'rtl' ? (
          <KeyboardArrowRight />
        ) : (
          <KeyboardArrowLeft />
        )}
      </IconButton>
      <IconButton
        onClick={handleNextButtonClick}
        disabled={
          rowsPerPage > 0 ? page >= Math.ceil(count / rowsPerPage) - 1 : true
        }
        aria-label="next page"
      >
        {theme.direction !== 'rtl' ? (
          <KeyboardArrowLeft />
        ) : (
          <KeyboardArrowRight />
        )}
      </IconButton>
      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={
          rowsPerPage > 0 ? page >= Math.ceil(count / rowsPerPage) - 1 : true
        }
        aria-label="last page"
      >
        {theme.direction !== 'rtl' ? <FirstPageIcon /> : <LastPageIcon />}
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
  const { order, orderBy, onRequestSort } = props;
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

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
      numeric: false,
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
      numeric: false,
      disablePadding: true,
      label: t('need.cost'),
      width: '120px',
    },
    {
      id: 'purchase_cost',
      numeric: false,
      disablePadding: true,
      label: t('need.purchaseCost'),
      width: '120px',
    },
    {
      id: 'need_amount',
      numeric: false,
      disablePadding: true,
      label: t('need.needAmount'),
      width: '50px',
    },
    {
      id: 'refund',
      numeric: false,
      disablePadding: true,
      label: t('need.refund'),
      width: '50px',
    },
    {
      id: 'donation',
      numeric: false,
      disablePadding: true,
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
              sortDirection={orderBy === headCell.id ? order : false}
              sx={{ minWidth: headCell.width }}
            >
              <TableSortLabel
                active={orderBy === headCell.id}
                direction={orderBy === headCell.id ? order : 'asc'}
                onClick={createSortHandler(headCell.id)}
              >
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
              </TableSortLabel>
            </TableCell>
          ))}
      </TableRow>
    </TableHead>
  );
}

EnhancedTableHead.propTypes = {
  onRequestSort: PropTypes.func.isRequired,
  order: PropTypes.oneOf(['asc', 'desc']).isRequired,
  orderBy: PropTypes.string.isRequired,
};

export default function PaymentTable() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const theme = useTheme();

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

  function ImageComponent({ row }) {
    const [isImageValid, setIsImageValid] = useState(null); // null = not checked yet, true = valid, false = invalid

    // Function to check image validity
    const checkImage = async (url) => {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          setIsImageValid(true);
        } else {
          setIsImageValid(false);
        }
      } catch (error) {
        setIsImageValid(false);
        console.log(error);
      }
    };

    // Check the image validity once when row.img or row.imageUrl changes
    useEffect(() => {
      if (row.img) {
        checkImage(row.img); // Check the main image
      } else {
        checkImage(prepareUrl(row.imageUrl)); // Fallback image check
      }
    }, [row.img, row.imageUrl]);

    // If isImageValid is null, it means the image is still being checked
    if (isImageValid === null) {
      return (
        <Skeleton
          sx={{
            borderRadius: '10px',
            height: '50px',
            width: '50px',
          }}
        />
      );
    }

    return (
      <CardMedia
        component="img"
        image={
          isImageValid
            ? row.img || prepareUrl(row.imageUrl)
            : prepareUrl(row.imageUrl)
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
    );
  }

  function Row(props) {
    const { i18n } = useTranslation();

    const { row } = props;

    const [accOpen, setAccOpen] = useState(false);

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
              color: (th) => th.palette.text.secondary,
            }}
            component="th"
            scope="row"
          >
            {row.id}
          </TableCell>
          <TableCell align="center">
            <Box display="flex" alignItems="center">
              <Link href={row.link} target="_blank">
                <ImageComponent row={row} />
              </Link>
              <Box
                sx={{
                  ml: 2,
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
            {row.purchase_cost ? (
              row.purchase_cost.toLocaleString()
            ) : row.status >= PaymentStatusEnum.COMPLETE_PAY ? (
              <Typography
                sx={{ fontSize: 9, textAlign: 'center' }}
                fontWeight="400"
              >
                <br />
                {t('need.waitingPurchase')}
              </Typography>
            ) : (
              <Typography
                sx={{ fontSize: 9, textAlign: 'center' }}
                fontWeight="400"
              >
                {t('need.waitingPurchase')}
              </Typography>
            )}
          </TableCell>
          <TableCell
            sx={{
              color: () => theme.palette.text.secondary,
            }}
          >
            {row.p
              .map((p) => Number(p.need_amount))
              .filter((a) => Number.isFinite(a) && a > 0)
              .reduce(
                (accumulator, currentValue) => accumulator + currentValue,
                0,
              )
              .toLocaleString()}
            <Typography sx={{ fontSize: 9 }} fontWeight="400">
              {row.status < PaymentStatusEnum.COMPLETE_PAY && (
                <>
                  {t('need.partialPay')}{' '}
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
          <TableCell align="center">
            {row.p.map(
              (p) => Number(p.credit_amount) && Number(p.credit_amount) < 0,
            )[0] ? (
              row.p.map((p) => Number(p.credit_amount).toLocaleString())
            ) : row.status >= 3 ? (
              row.p
                .map((p) => Number(p.need_amount))
                .reduce((acc, curr) => acc + curr, 0) === row.purchase_cost ? (
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
            )}
          </TableCell>
          <TableCell align="center">
            {row.p.map(
              (p) => Number(p.donation_amount) && Number(p.donation_amount),
            )
              ? row.p
                  .map(
                    (p) =>
                      Number(p.donation_amount) && Number(p.donation_amount),
                  )
                  .reduce(
                    (accumulator, currentValue) => accumulator + currentValue,
                    0,
                  )
                  .toLocaleString()
              : '-'}
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
                      <TableCell sx={{ fontWeight: 600 }}>
                        {t('report.history.status')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {t('report.history.date')}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {t('report.history.receipt')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" scope="row">
                        {t('need.created')}
                      </TableCell>
                      <TableCell component="th" scope="row">
                        {row.created ? dateConvertor(row.created) : '-'}
                      </TableCell>
                      <TableCell align="right"> - </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">
                        {t('need.confirmDate')}
                      </TableCell>
                      <TableCell component="th" scope="row">
                        {row.confirmDate ? dateConvertor(row.confirmDate) : '-'}
                      </TableCell>
                      <TableCell align="right">-</TableCell>
                    </TableRow>
                    {/* <TableRow>
                      <TableCell component="th" scope="row">
                        {t('need.updated')}
                      </TableCell>
                      <TableCell component="th" scope="row">
                        {row.updated ? dateConvertor(row.updated) : '-'}
                      </TableCell>
                      <TableCell align="right">-</TableCell>
                    </TableRow> */}
                    {/* 2   Complete payment	*/}
                    <TableRow>
                      <TableCell component="th" scope="row">
                        {t('need.needStatus.2')}
                      </TableCell>
                      <TableCell component="th" scope="row">
                        {row.doneAt ? dateConvertor(row.doneAt) : '-'}
                      </TableCell>
                      <TableCell align="right">
                        {row.p && row.p[0] && (
                          <Tooltip
                            title={row.p.map((p) => {
                              if (p.verified && p.gateway_track_id) {
                                return (
                                  <Grid key={p.id}>
                                    <Typography
                                      variant="subtitle2"
                                      sx={{
                                        backgroundColor:
                                          p.need_amount > 0 ? 'green' : 'red',
                                      }}
                                    >
                                      {`User:${p.id_user} Track Id:${p.gateway_track_id} => ${(
                                        p.need_amount +
                                        p.donation_amount -
                                        p.donation_amount -
                                        p.credit_amount
                                      ).toLocaleString()}`}
                                    </Typography>
                                    <Typography
                                      variant="subtitle2"
                                      sx={{
                                        backgroundColor:
                                          p.need_amount > 0 ? 'orange' : 'red',
                                      }}
                                    >
                                      {`Donation => ${p.donation_amount.toLocaleString()}`}
                                    </Typography>
                                    <Typography
                                      variant="subtitle2"
                                      sx={{
                                        backgroundColor:
                                          p.need_amount > 0 ? 'orange' : 'red',
                                      }}
                                    >
                                      {`Wallet => ${p.credit_amount.toLocaleString()}`}
                                    </Typography>
                                  </Grid>
                                );
                              }
                              return (
                                <Typography variant="subtitle2" key={p.id}>
                                  {p.verified &&
                                    `SAY ${(p.need_amount + p.donation_amount).toLocaleString()}`}
                                </Typography>
                              );
                            })}
                            placement="top-end"
                          >
                            <Typography color="textSecondary" variant="body1">
                              {row.p.filter((p) => p.verified).length}{' '}
                              {t('need.payers')}
                            </Typography>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                    {/* 3 Product delivered to NGO - Money transferred to the NGO */}
                    <TableRow>
                      <TableCell component="th" scope="row">
                        {row.type === NeedTypeEnum.PRODUCT
                          ? t('need.needStatus.p3')
                          : t('need.needStatus.s3')}
                      </TableCell>
                      <TableCell component="th" scope="row">
                        {row.type === NeedTypeEnum.PRODUCT && row.purchase_date
                          ? dateConvertor(row.purchase_date)
                          : row.type === NeedTypeEnum.SERVICE &&
                              row.ngo_delivery_date
                            ? dateConvertor(row.ngo_delivery_date)
                            : '-'}
                      </TableCell>
                      <TableCell align="right">
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
                      <TableCell component="th" scope="row">
                        {row.type === NeedTypeEnum.PRODUCT
                          ? t('need.needStatus.p4')
                          : t('need.needStatus.s4')}
                      </TableCell>
                      <TableCell component="th" scope="row">
                        {row.type === NeedTypeEnum.PRODUCT &&
                        row.ngo_delivery_date
                          ? dateConvertor(row.ngo_delivery_date)
                          : row.type === NeedTypeEnum.SERVICE &&
                              row.child_delivery_date
                            ? dateConvertor(row.child_delivery_date)
                            : '-'}
                        <Typography sx={{ fontSize: 8, color: 'grey' }}>
                          {row.type === NeedTypeEnum.PRODUCT &&
                            !row.ngo_delivery_date &&
                            row.expected_delivery_date &&
                            dateConvertor(row.expected_delivery_date)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                    {/* 5 product delivery to child */}
                    {row.type === NeedTypeEnum.PRODUCT && (
                      <TableRow>
                        <TableCell component="th" scope="row">
                          {t('need.needStatus.p5')}
                        </TableCell>
                        <TableCell component="th" scope="row">
                          {row.child_delivery_date
                            ? dateConvertor(row.child_delivery_date)
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
    <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
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
              direction: () => (theme.direction === 'rtl' ? 'rtl' : 'ltr'),
            }}
          >
            <TableRow>
              <TablePagination
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} از ${count !== -1 ? count : `بیشتر از ${to}`}`
                }
                labelRowsPerPage="ردیف در هر صفحه"
                rowsPerPageOptions={[5, 10, 25]}
                count={totalItems}
                rowsPerPage={rowsPerPage}
                page={page}
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
