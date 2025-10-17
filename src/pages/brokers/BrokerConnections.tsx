// components/BrokerConnections.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Star as StarIcon,
  Error as ErrorIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useBrokerConnections, useDeleteBrokerConnection, useSetDefaultBroker, useValidateBroker } from '@/hooks/useBrokers';
import { useAppDispatch } from '@/store/hooks';
import { useToast } from '@/hooks/use-toast';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { BrokerConnectionForm } from './BrokerConnectionForm';
import { BrokerErrorLogs } from './BrokerErrorLogs';
import { showToast } from '@/store/uiSlice';
import type { BrokerConnection } from '@/store/types/broker';

export const BrokerConnections: React.FC = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showErrorsDialog, setShowErrorsDialog] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<BrokerConnection | null>(null);
  const navigate = useNavigate();

  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { data: connections, isLoading, error, refetch } = useBrokerConnections();
  const deleteMutation = useDeleteBrokerConnection();
  const setDefaultMutation = useSetDefaultBroker();
  const validateMutation = useValidateBroker();

  const handleEdit = (id: number) => {
    navigate(`/brokers/edit/${id}`);
  };

  const handleAddNew = () => {
    navigate('/brokers/new');
  };

  const handleDelete = (connection: BrokerConnection) => {
    setSelectedConnection(connection);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!selectedConnection) return;

    deleteMutation.mutate(selectedConnection.id, {
      onSuccess: () => {
        dispatch(showToast({ message: 'Connection deleted successfully', type: 'success' }));
        toast({
          title: "Connection Deleted",
          description: "Broker connection has been deleted successfully",
          variant: "default",
        });
        setShowDeleteModal(false);
        setSelectedConnection(null);
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.message || 'Failed to delete connection';
        dispatch(showToast({
          message: errorMessage,
          type: 'error'
        }));
        toast({
          title: "Deletion Failed",
          description: errorMessage,
          variant: "destructive",
        });
        setShowDeleteModal(false);
        setSelectedConnection(null);
      },
    });
  };

  const handleSetDefault = (id: number) => {
    setDefaultMutation.mutate(id, {
      onSuccess: () => {
        dispatch(showToast({ message: 'Default connection set successfully', type: 'success' }));
        toast({
          title: "Default Connection Set",
          description: "Default broker connection has been updated successfully",
          variant: "default",
        });
        refetch();
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.message || 'Failed to set default connection';
        dispatch(showToast({
          message: errorMessage,
          type: 'error'
        }));
        toast({
          title: "Default Connection Failed",
          description: errorMessage,
          variant: "destructive",
        });
      },
    });
  };

  const handleValidate = (id: number) => {
    validateMutation.mutate(id, {
      onSuccess: (data) => {
        if (data.valid) {
          dispatch(showToast({ message: 'Connection validated successfully', type: 'success' }));
          toast({
            title: "Validation Successful",
            description: "Broker connection has been validated successfully",
            variant: "default",
          });
          refetch();
        } else {
          const errorMessage = data.message || 'Connection validation failed';
          dispatch(showToast({
            message: errorMessage,
            type: 'error'
          }));
          toast({
            title: "Validation Failed",
            description: errorMessage,
            variant: "destructive",
          });
        }
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.message || 'Validation failed';
        dispatch(showToast({
          message: errorMessage,
          type: 'error'
        }));
        toast({
          title: "Validation Error",
          description: errorMessage,
          variant: "destructive",
        });
      },
    });
  };

  const handleShowErrors = (id: number) => {
    setSelectedConnection(connections?.find(c => c.id === id) || null);
    setShowErrorsDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'success';
      case 'invalid': return 'error';
      case 'rate_limited': return 'warning';
      case 'disabled': return 'default';
      default: return 'default';
    }
  };

  if (isLoading) {
    return <LinearProgress />;
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load connections: {error.message}
      </Alert>
    );
  }

  return (
    <>
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedConnection(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Broker Connection"
        message={
          selectedConnection ? (
            <div className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                Are you sure you want to delete the connection <strong>"{selectedConnection.name}"</strong>?
              </p>
              <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-3 rounded">
                <p className="text-sm text-red-700 dark:text-red-300">
                  This action cannot be undone and all associated trading data will be lost.
                </p>
              </div>
            </div>
          ) : null
        }
        confirmText="Delete Connection"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      <Box sx={{ p: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'grey.800' }}>
            Broker Connections
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddNew}
            sx={{
              backgroundColor: '#0d1b2a',
              '&:hover': { backgroundColor: '#1b263b' }
            }}
          >
            Add Connection
          </Button>
        </Box>

        {/* Connections Grid */}
        {(!connections || connections.length === 0) ? (
          <Card sx={{ textAlign: 'center', p: 4, backgroundColor: '#0d1b2a' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                No connections found
              </Typography>
              <Button
                variant="contained"
                onClick={handleAddNew}
                sx={{ backgroundColor: '#415a77', color: 'white' }}
              >
                Add First Connection
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {connections.map((connection) => (
              <Grid key={connection.id} size={{ xs: 12, md: 6, lg: 4 }}>
                <Card sx={{ backgroundColor: '#0d1b2a', color: 'white', borderRadius: 1 }}>
                  <CardContent sx={{ p: 2 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'white' }}>
                          {connection.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#778da9', fontSize: '0.8rem' }}>
                          {connection.broker_type} • {connection.environment}
                        </Typography>
                      </Box>
                      <Chip
                        label={connection.status}
                        size="small"
                        color={getStatusColor(connection.status)}
                        sx={{ color: 'white', fontWeight: 500 }}
                      />
                    </Box>

                    {/* Default Badge */}
                    {connection.is_default && (
                      <Box sx={{ mb: 1 }}>
                        <Chip
                          icon={<StarIcon sx={{ color: 'white' }} />}
                          label="Default Connection"
                          size="small"
                          sx={{ backgroundColor: '#1b263b', color: 'white' }}
                        />
                      </Box>
                    )}

                    {/* Validation Message */}
                    {connection.validation_message && (
                      <Alert 
                        severity="info" 
                        sx={{ 
                          mb: 2, 
                          backgroundColor: '#1b263b',
                          color: 'white',
                          '& .MuiAlert-icon': { color: 'white' },
                          fontSize: '0.8rem',
                          py: 0.5
                        }}
                      >
                        {connection.validation_message}
                      </Alert>
                    )}

                    {/* Actions */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Validate">
                          <IconButton
                            size="small"
                            onClick={() => handleValidate(connection.id)}
                            disabled={validateMutation.isPending}
                            sx={{ color: '#778da9' }}
                          >
                            <RefreshIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(connection.id)}
                            sx={{ color: '#778da9' }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="View Errors">
                          <IconButton
                            size="small"
                            onClick={() => handleShowErrors(connection.id)}
                            sx={{ color: '#778da9' }}
                          >
                            <ErrorIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {!connection.is_default && (
                          <Tooltip title="Set as Default">
                            <IconButton
                              size="small"
                              onClick={() => handleSetDefault(connection.id)}
                              disabled={setDefaultMutation.isPending}
                              sx={{ color: '#ffd600' }}
                            >
                              <StarIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(connection)}
                            disabled={deleteMutation.isPending}
                            sx={{ color: '#ff6b6b' }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Dialogs */}
        <Dialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Add Broker Connection</DialogTitle>
          <DialogContent>
            <BrokerConnectionForm
              onSuccess={() => setShowCreateDialog(false)}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>

        <Dialog
          open={showErrorsDialog}
          onClose={() => setShowErrorsDialog(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>Error Logs</DialogTitle>
          <DialogContent>
            {selectedConnection && <BrokerErrorLogs connectionId={selectedConnection.id} />}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowErrorsDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
};


