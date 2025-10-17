// components/BrokerErrorLogs.tsx

import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  Pagination,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useBrokerErrorLogs } from '@/hooks/useBrokers';
import type { BrokerErrorLog } from '@/store/types/broker';

interface BrokerErrorLogsProps {
  connectionId: number;
}

const ERROR_CATEGORY_COLORS = {
  connection: 'default',
  authentication: 'error',
  rate_limit: 'warning',
  validation: 'info',
  account: 'error',
  other: 'default',
} as const;

export const BrokerErrorLogs: React.FC<BrokerErrorLogsProps> = ({ connectionId }) => {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  
  const { data, isLoading, error } = useBrokerErrorLogs(connectionId, page, pageSize);
  const errorLogs = data?.results || [];
  const totalCount = data?.count || 0;

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load error logs: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Error Logs</Typography>
        <Chip
          label={`Total: ${totalCount}`}
          variant="outlined"
        />
      </Box>

      {errorLogs.length === 0 ? (
        <Alert severity="info">No error logs found for this connection.</Alert>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell>Endpoint</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {errorLogs.map((error: BrokerErrorLog) => (
                  <TableRow key={error.id}>
                    <TableCell>{formatDate(error.created_at)}</TableCell>
                    <TableCell>
                      <Chip
                        label={error.error_category}
                        color={ERROR_CATEGORY_COLORS[error.error_category] as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{error.error_type}</TableCell>
                    <TableCell>
                      <Box maxWidth="300px">
                        <Typography
                          variant="body2"
                          noWrap
                          title={error.error_message}
                        >
                          {error.error_message}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {error.endpoint && (
                        <Typography variant="body2" noWrap>
                          {error.endpoint}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box display="flex" justifyContent="center" mt={2}>
            <Pagination
              count={Math.ceil(totalCount / pageSize)}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        </>
      )}
    </Box>
  );
};