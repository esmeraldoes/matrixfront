// components/BrokerConnectionForm.tsx
import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  MenuItem,
  Select,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useCreateBrokerConnection, useUpdateBrokerConnection, useTestConnection,
  useCreateAndValidateBrokerConnection
 } from '@/hooks/useBrokers';
import { useAppDispatch } from '@/store/hooks';
import { showToast } from '@/store/uiSlice';
import { useToast } from '@/hooks/use-toast';
import type { BrokerConnection, TestConnectionData } from '@/store/types/broker';

interface BrokerConnectionFormProps {
  connection?: BrokerConnection;
  onSuccess: () => void;
  onCancel: () => void;
}

// Custom type for test status
type TestStatus = {
  state: 'idle' | 'testing' | 'success' | 'error';
  message: string;
  details?: string;
  account_status?: string;
} | null;

const BROKER_TYPES = [
  { value: 'alpaca', label: 'Alpaca' },
  { value: 'alpaca_crypto', label: 'Alpaca Crypto' },
  { value: 'ibkr', label: 'Interactive Brokers' },
  { value: 'tradier', label: 'Tradier' },
  { value: 'tdameritrade', label: 'TD Ameritrade' },
  { value: 'coinbase', label: 'Coinbase' },
  { value: 'binance', label: 'Binance' },
];

const ENVIRONMENTS = [
  { value: 'paper', label: 'Paper Trading' },
  { value: 'live', label: 'Live Trading' },
];

const AUTH_TYPES = [
  { value: 'api_key', label: 'API Key' },
  { value: 'oauth', label: 'OAuth' },
];

export const BrokerConnectionForm: React.FC<BrokerConnectionFormProps> = ({
  connection,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState<Partial<BrokerConnection>>(
    connection || {
      name: '',
      broker_type: 'alpaca',
      environment: 'paper',
      auth_type: 'api_key',
      is_default: false,
      is_active: true,
    }
  );

  // Replaced testResult and activeStep with a single testStatus
  const [testStatus, setTestStatus] = useState<TestStatus>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const createMutation = useCreateBrokerConnection();
  const updateMutation = useUpdateBrokerConnection();
  const testMutation = useTestConnection();
  const createAndValidateMutation = useCreateAndValidateBrokerConnection();

  const isEditing = !!connection;
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isTesting = testMutation.isPending;
  const isDisabled = isSaving || isTesting || createAndValidateMutation.isPending;

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear test status on form change
    setTestStatus(null);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.broker_type) newErrors.broker_type = 'Broker type is required';
    if (!formData.environment) newErrors.environment = 'Environment is required';
    if (!formData.auth_type) newErrors.auth_type = 'Authentication type is required';

    if (formData.auth_type === 'api_key') {
      if (!formData.api_key) newErrors.api_key = 'API key is required';
      if (!formData.api_secret) newErrors.api_secret = 'API secret is required';
      
      // Validate Alpaca API key format
      if (formData.api_key && formData.broker_type?.includes('alpaca')) {
        if (!formData.api_key.startsWith('PK') && !formData.api_key.startsWith('AK')) {
          newErrors.api_key = 'Alpaca API key should start with PK (paper) or AK (live)';
        }
      }
    } else if (formData.auth_type === 'oauth') {
      if (!formData.oauth_access_token) newErrors.oauth_access_token = 'Access token is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTest = (): Promise<boolean> => {
    setTestStatus({ state: 'testing', message: 'Testing connection...' });

    const testData: TestConnectionData = {
      broker_type: formData.broker_type!,
      environment: formData.environment!,
      auth_type: formData.auth_type!,
      api_key: formData.api_key,
      api_secret: formData.api_secret,
      api_token: formData.api_token,
      oauth_access_token: formData.oauth_access_token,
      oauth_client_id: formData.oauth_client_id,
      base_url: formData.base_url,
      name: formData.name, 
    };

    return new Promise((resolve) => {
      testMutation.mutate(testData, {
        onSuccess: (result) => {
          if (result.valid) {
            setTestStatus({
              state: 'success',
              message: result.message || '✅ Connection test succeeded! Credentials are valid.',
              account_status: result.account_info?.status,
            });
            resolve(true);
          } else {
            setTestStatus({
              state: 'error',
              message: result.message || '❌ Connection test failed.',
              details: result.account_info ? `Account status: ${result.account_info.status}` : 'Please check your credentials.',
            });
            resolve(false);
          }
        },
        onError: (error: any) => {
          const errorData = error.response?.data;
          const errorMessage = errorData?.message || 'Connection test failed: An unexpected error occurred.';
          
          setTestStatus({
            state: 'error',
            message: 'Connection test failed.',
            details: errorMessage,
          });
          
          if (errorData && typeof errorData === 'object') {
            const fieldErrors: Record<string, string> = {};
            Object.keys(errorData).forEach(key => {
              if (key !== 'message' && typeof errorData[key] === 'string') {
                fieldErrors[key] = errorData[key];
              }
            });
            if (Object.keys(fieldErrors).length > 0) {
              setErrors(fieldErrors);
            }
          }
          
          resolve(false);
        },
      });
    });
  };

  const handleSubmit = () => {
    const mutation = isEditing ? updateMutation : createMutation;
    const data = isEditing ? { id: connection!.id, data: formData } : formData;

    mutation.mutate(data as any, {
      onSuccess: () => {
        dispatch(showToast({
          message: isEditing ? 'Connection updated successfully' : 'Connection created successfully',
          type: 'success'
        }));
        toast({
          title: isEditing ? "Connection Updated" : "Connection Created",
          description: isEditing ? "Broker connection has been updated successfully" : "Broker connection has been created successfully",
          variant: "default",
        });
        onSuccess();
      },
      onError: (error: any) => {
        if (error.response?.data && !error.response.data.message) {
           setErrors(error.response.data);
        }
        const errorMessage = error.response?.data?.message ||
          (isEditing ? 'Failed to update connection' : 'Failed to create connection');
        
        dispatch(showToast({
          message: errorMessage,
          type: 'error'
        }));
        toast({
          title: isEditing ? "Update Failed" : "Creation Failed",
          description: errorMessage,
          variant: "destructive",
        });
      },
    });
  };

  const handleSave = async () => {
    if (!validateForm()) {
      setTestStatus({ state: 'error', message: 'Please correct the form errors before saving.' });
      toast({
        title: "Validation Error",
        description: "Please correct the form errors before saving.",
        variant: "destructive",
      });
      return;
    }

    if (isEditing) {
      const testPassed = await handleTest();
      if (testPassed) {
        handleSubmit();
      }
    } else {
      setTestStatus({ state: 'testing', message: 'Testing and saving connection...' });
      
      createAndValidateMutation.mutate(formData as any, {
        onSuccess: (result) => {
          if (result.success && result.created) {
            let successMessage = result.message || 'Connection created and validated successfully!';
            
            if (result.account_info) {
              successMessage += ` Account: ${result.account_info.account_number || 'Connected'}`;
            }
            
            setTestStatus({
              state: 'success',
              message: successMessage,
              account_status: result.account_info?.status,
            });
            
            dispatch(showToast({
              message: successMessage,
              type: 'success'
            }));
            toast({
              title: "Connection Created",
              description: successMessage,
              variant: "default",
            });
            
            // Small delay to show success message before closing
            setTimeout(() => {
              onSuccess();
            }, 1500);
          } else {
            setTestStatus({
              state: 'error',
              message: result.message || 'Failed to create connection',
            });
            toast({
              title: "Connection Failed",
              description: result.message || 'Failed to create connection',
              variant: "destructive",
            });
          }
        },
        onError: (error: any) => {
          const errorMessage = error.response?.data?.message || 'Failed to create connection';
          setTestStatus({
            state: 'error',
            message: errorMessage,
          });
          dispatch(showToast({
            message: errorMessage,
            type: 'error'
          }));
          toast({
            title: "Connection Failed",
            description: errorMessage,
            variant: "destructive",
          });
          
          if (error.response?.data) {
            setErrors(error.response.data);
          }
        },
      });
    }
  };

  const inputBaseSx = (theme: any) => ({
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#fff',
    borderRadius: 1,
    '& .MuiOutlinedInput-root': {
      color: theme.palette.mode === 'dark' ? '#fff' : 'inherit',
      '& fieldset': {
        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
      },
      '&:hover fieldset': {
        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.18)' : undefined,
      },
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.mode === 'dark' ? '#00c6ff' : undefined,
      },
    },
    '& .MuiInputBase-input': {
      color: theme.palette.mode === 'dark' ? '#fff' : 'inherit',
      '&::placeholder': {
        color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
        opacity: 1,
      },
    },
  });

  const renderAuthFields = () => {
    if (formData.auth_type === 'api_key') {
      return (
        <>
          <Box sx={{ gridColumn: 'span 2' }}>
            <TextField
              fullWidth
              placeholder="API Key"
              aria-label="API Key"
              value={formData.api_key || ''}
              onChange={(e) => handleChange('api_key', e.target.value)}
              error={!!errors.api_key}
              helperText={errors.api_key}
              type="password"
              sx={(theme) => inputBaseSx(theme)}
            />
          </Box>

          <Box sx={{ gridColumn: 'span 2' }}>
            <TextField
              fullWidth
              placeholder="API Secret"
              aria-label="API Secret"
              value={formData.api_secret || ''}
              onChange={(e) => handleChange('api_secret', e.target.value)}
              error={!!errors.api_secret}
              helperText={errors.api_secret}
              type="password"
              sx={(theme) => inputBaseSx(theme)}
            />
          </Box>

          <Box sx={{ gridColumn: 'span 2' }}>
            <TextField
              fullWidth
              placeholder="API Token (Optional)"
              aria-label="API Token"
              value={formData.api_token || ''}
              onChange={(e) => handleChange('api_token', e.target.value)}
              type="password"
              sx={(theme) => inputBaseSx(theme)}
            />
          </Box>
        </>
      );
    } else if (formData.auth_type === 'oauth') {
      return (
        <>
          <Box sx={{ gridColumn: 'span 2' }}>
            <TextField
              fullWidth
              placeholder="Access Token"
              aria-label="Access Token"
              value={formData.oauth_access_token || ''}
              onChange={(e) => handleChange('oauth_access_token', e.target.value)}
              error={!!errors.oauth_access_token}
              helperText={errors.oauth_access_token}
              type="password"
              sx={(theme) => inputBaseSx(theme)}
            />
          </Box>

          <Box sx={{ gridColumn: 'span 2' }}>
            <TextField
              fullWidth
              placeholder="Refresh Token (Optional)"
              aria-label="Refresh Token"
              value={formData.oauth_refresh_token || ''}
              onChange={(e) => handleChange('oauth_refresh_token', e.target.value)}
              type="password"
              sx={(theme) => inputBaseSx(theme)}
            />
          </Box>

          <Box sx={{ gridColumn: 'span 2' }}>
            <TextField
              fullWidth
              placeholder="Client ID (Optional)"
              aria-label="Client ID"
              value={formData.oauth_client_id || ''}
              onChange={(e) => handleChange('oauth_client_id', e.target.value)}
              sx={(theme) => inputBaseSx(theme)}
            />
          </Box>
        </>
      );
    }
    return null;
  };

  const findLabel = (list: { value: string; label: string }[], val: any) => {
    const found = list.find((i) => i.value === val);
    return found ? found.label : '';
  };

  const renderFormContent = () => (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
      }}
    >
      <Box sx={{ gridColumn: 'span 2' }}>
        <TextField
          fullWidth
          placeholder="Connection Name"
          aria-label="Connection Name"
          value={formData.name || ''}
          onChange={(e) => handleChange('name', e.target.value)}
          error={!!errors.name}
          helperText={errors.name}
          sx={(theme) => inputBaseSx(theme)}
        />
      </Box>

      <Box sx={{ gridColumn: { xs: 'span 2', sm: 'span 1' } }}>
        <FormControl fullWidth error={!!errors.broker_type} sx={(theme) => ({ ...inputBaseSx(theme) })}>
          <Select
            displayEmpty
            value={formData.broker_type ?? ''}
            onChange={(e) => handleChange('broker_type', e.target.value)}
            renderValue={(selected) =>
              selected ? findLabel(BROKER_TYPES, selected) : <span style={{ opacity: 0.75 }}>Select broker type</span>
            }
            inputProps={{ 'aria-label': 'Broker Type' }}
            sx={{
              '& .MuiSelect-select': (theme: any) => ({
                color: theme.palette.mode === 'dark' ? '#fff' : 'inherit',
              }),
            }}
          >
            <MenuItem value="" disabled>
              Select broker type
            </MenuItem>
            {BROKER_TYPES.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </Select>
          {errors.broker_type && <FormHelperText>{errors.broker_type}</FormHelperText>}
        </FormControl>
      </Box>

      <Box sx={{ gridColumn: { xs: 'span 2', sm: 'span 1' } }}>
        <FormControl fullWidth error={!!errors.environment} sx={(theme) => ({ ...inputBaseSx(theme) })}>
          <Select
            displayEmpty
            value={formData.environment ?? ''}
            onChange={(e) => handleChange('environment', e.target.value)}
            renderValue={(selected) =>
              selected ? findLabel(ENVIRONMENTS, selected) : <span style={{ opacity: 0.75 }}>Select environment</span>
            }
            inputProps={{ 'aria-label': 'Environment' }}
            sx={{
              '& .MuiSelect-select': (theme: any) => ({
                color: theme.palette.mode === 'dark' ? '#fff' : 'inherit',
              }),
            }}
          >
            <MenuItem value="" disabled>
              Select environment
            </MenuItem>
            {ENVIRONMENTS.map((env) => (
              <MenuItem key={env.value} value={env.value}>
                {env.label}
              </MenuItem>
            ))}
          </Select>
          {errors.environment && <FormHelperText>{errors.environment}</FormHelperText>}
        </FormControl>
      </Box>

      <Box sx={{ gridColumn: 'span 2' }}>
        <FormControl fullWidth error={!!errors.auth_type} sx={(theme) => ({ ...inputBaseSx(theme) })}>
          <Select
            displayEmpty
            value={formData.auth_type ?? ''}
            onChange={(e) => handleChange('auth_type', e.target.value)}
            renderValue={(selected) =>
              selected ? findLabel(AUTH_TYPES, selected) : <span style={{ opacity: 0.75 }}>Select authentication type</span>
            }
            inputProps={{ 'aria-label': 'Authentication Type' }}
            sx={{
              '& .MuiSelect-select': (theme: any) => ({
                color: theme.palette.mode === 'dark' ? '#fff' : 'inherit',
              }),
            }}
          >
            <MenuItem value="" disabled>
              Select authentication type
            </MenuItem>
            {AUTH_TYPES.map((auth) => (
              <MenuItem key={auth.value} value={auth.value}>
                {auth.label}
              </MenuItem>
            ))}
          </Select>
          {errors.auth_type && <FormHelperText>{errors.auth_type}</FormHelperText>}
        </FormControl>
      </Box>

      {renderAuthFields()}

      <Box sx={{ gridColumn: 'span 2' }}>
        <TextField
          fullWidth
          placeholder="Base URL (Optional)"
          aria-label="Base URL"
          value={formData.base_url || ''}
          onChange={(e) => handleChange('base_url', e.target.value)}
          sx={(theme) => inputBaseSx(theme)}
        />
      </Box>

      <Box sx={{ gridColumn: 'span 2' }}>
        <TextField
          fullWidth
          placeholder="Account ID (Optional)"
          aria-label="Account ID"
          value={formData.account_id || ''}
          onChange={(e) => handleChange('account_id', e.target.value)}
          sx={(theme) => inputBaseSx(theme)}
        />
      </Box>

      <Box sx={{ gridColumn: 'span 2' }}>
        <FormControl fullWidth sx={(theme) => ({ ...inputBaseSx(theme) })}>
          <Select
            displayEmpty
            value={formData.is_active ? 'active' : 'inactive'}
            onChange={(e) => handleChange('is_active', e.target.value === 'active')}
            renderValue={(selected) => (selected ? (selected === 'active' ? 'Active' : 'Inactive') : <span style={{ opacity: 0.75 }}>Select status</span>)}
            inputProps={{ 'aria-label': 'Status' }}
            sx={{
              '& .MuiSelect-select': (theme: any) => ({
                color: theme.palette.mode === 'dark' ? '#fff' : 'inherit',
              }),
            }}
          >
            <MenuItem value="" disabled>
              Select status
            </MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ gridColumn: 'span 2' }}>
        <FormControl fullWidth sx={(theme) => ({ ...inputBaseSx(theme) })}>
          <Select
            displayEmpty
            value={formData.is_default ? 'yes' : 'no'}
            onChange={(e) => handleChange('is_default', e.target.value === 'yes')}
            renderValue={(selected) => (selected ? (selected === 'yes' ? 'Yes' : 'No') : <span style={{ opacity: 0.75 }}>Default connection?</span>)}
            inputProps={{ 'aria-label': 'Default Connection' }}
            sx={{
              '& .MuiSelect-select': (theme: any) => ({
                color: theme.palette.mode === 'dark' ? '#fff' : 'inherit',
              }),
            }}
          >
            <MenuItem value="" disabled>
              Default connection?
            </MenuItem>
            <MenuItem value="yes">Yes</MenuItem>
            <MenuItem value="no">No</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={(theme: any) => ({
        background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)',
        borderRadius: 2,
        p: 3,
        maxWidth: 920,
        mx: 'auto',
        boxShadow: theme.palette.mode === 'dark' ? '0 6px 24px rgba(0,0,0,0.6)' : '0 6px 24px rgba(0,0,0,0.12)',
        color: theme.palette.mode === 'dark' ? '#fff' : 'text.primary',
      })}
    >
      {renderFormContent()}
      
      {isTesting && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress size={24} sx={{ mr: 2 }} />
          Testing connection...
        </Box>
      )}

      {testStatus && testStatus.state !== 'testing' && (
        <Alert severity={testStatus.state === 'success' ? 'success' : 'error'} sx={{ mt: 3, mb: 0, borderRadius: 1 }}>
          {testStatus.message}
          {testStatus.account_status && <Box mt={1}>Account Status: {testStatus.account_status}</Box>}
          {testStatus.details && <Box mt={1}>Details: {testStatus.details}</Box>}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button onClick={onCancel} sx={{ textTransform: 'none' }}>
          Cancel
        </Button>

        <Button
          onClick={handleSave}
          variant="contained"
          disabled={isDisabled}
          sx={(theme: any) => ({
            borderRadius: 1,
            textTransform: 'none',
            color: '#fff',
            minWidth: 100
          })}
        >
          {isSaving ? 'Saving...' : (isTesting ? 'Testing...' : 'Save')}
        </Button>
      </Box>
    </Box>
  );
};

export default BrokerConnectionForm;










// // components/BrokerConnectionForm.tsx
// import React, { useState } from 'react';
// import {
//   Box,
//   Button,
//   FormControl,
//   FormHelperText,
//   MenuItem,
//   Select,
//   TextField,
//   Alert,
//   CircularProgress,
// } from '@mui/material';
// import { useCreateBrokerConnection, useUpdateBrokerConnection, useTestConnection,
//   useCreateAndValidateBrokerConnection
//  } from '@/hooks/useBrokers';
// import { useAppDispatch } from '@/store/hooks';
// import { showToast } from '@/store/uiSlice';
// import type { BrokerConnection, TestConnectionData } from '@/store/types/broker';

// interface BrokerConnectionFormProps {
//   connection?: BrokerConnection;
//   onSuccess: () => void;
//   onCancel: () => void;
// }

// // Custom type for test status
// type TestStatus = {
//   state: 'idle' | 'testing' | 'success' | 'error';
//   message: string;
//   details?: string;
//   account_status?: string;
// } | null;

// const BROKER_TYPES = [
//   { value: 'alpaca', label: 'Alpaca' },
//   { value: 'alpaca_crypto', label: 'Alpaca Crypto' },
//   { value: 'ibkr', label: 'Interactive Brokers' },
//   { value: 'tradier', label: 'Tradier' },
//   { value: 'tdameritrade', label: 'TD Ameritrade' },
//   { value: 'coinbase', label: 'Coinbase' },
//   { value: 'binance', label: 'Binance' },
// ];

// const ENVIRONMENTS = [
//   { value: 'paper', label: 'Paper Trading' },
//   { value: 'live', label: 'Live Trading' },
// ];

// const AUTH_TYPES = [
//   { value: 'api_key', label: 'API Key' },
//   { value: 'oauth', label: 'OAuth' },
// ];

// export const BrokerConnectionForm: React.FC<BrokerConnectionFormProps> = ({
//   connection,
//   onSuccess,
//   onCancel,
// }) => {
//   const [formData, setFormData] = useState<Partial<BrokerConnection>>(
//     connection || {
//       name: '',
//       broker_type: 'alpaca',
//       environment: 'paper',
//       auth_type: 'api_key',
//       is_default: false,
//       is_active: true,
//     }
//   );

//   // Replaced testResult and activeStep with a single testStatus
//   const [testStatus, setTestStatus] = useState<TestStatus>(null);
//   const [errors, setErrors] = useState<Record<string, string>>({});

//   const dispatch = useAppDispatch();
//   const createMutation = useCreateBrokerConnection();
//   const updateMutation = useUpdateBrokerConnection();
//   const testMutation = useTestConnection();
//   const createAndValidateMutation = useCreateAndValidateBrokerConnection();


//   const isEditing = !!connection;
//   const isSaving = createMutation.isPending || updateMutation.isPending;
//   const isTesting = testMutation.isPending;
//   // const isDisabled = isSaving || isTesting;

//   const handleChange = (field: string, value: any) => {
//     setFormData((prev) => ({ ...prev, [field]: value }));
//     // Clear test status on form change
//     setTestStatus(null);
//     if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
//   };


//   // components/BrokerConnectionForm.tsx - Enhanced validation

//   const validateForm = () => {
//     const newErrors: Record<string, string> = {};
    
//     if (!formData.name) newErrors.name = 'Name is required';
//     if (!formData.broker_type) newErrors.broker_type = 'Broker type is required';
//     if (!formData.environment) newErrors.environment = 'Environment is required';
//     if (!formData.auth_type) newErrors.auth_type = 'Authentication type is required';

//     if (formData.auth_type === 'api_key') {
//       if (!formData.api_key) newErrors.api_key = 'API key is required';
//       if (!formData.api_secret) newErrors.api_secret = 'API secret is required';
      
//       // Validate Alpaca API key format
//       if (formData.api_key && formData.broker_type?.includes('alpaca')) {
//         if (!formData.api_key.startsWith('PK') && !formData.api_key.startsWith('AK')) {
//           newErrors.api_key = 'Alpaca API key should start with PK (paper) or AK (live)';
//         }
//       }
//     } else if (formData.auth_type === 'oauth') {
//       if (!formData.oauth_access_token) newErrors.oauth_access_token = 'Access token is required';
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };



//   const handleTest = (): Promise<boolean> => {
//     setTestStatus({ state: 'testing', message: 'Testing connection...' });

//     const testData: TestConnectionData = {
//       broker_type: formData.broker_type!,
//       environment: formData.environment!,
//       auth_type: formData.auth_type!,
//       api_key: formData.api_key,
//       api_secret: formData.api_secret,
//       api_token: formData.api_token,
//       oauth_access_token: formData.oauth_access_token,
//       oauth_client_id: formData.oauth_client_id,
//       base_url: formData.base_url,
//       name: formData.name, 
//     };

//     return new Promise((resolve) => {
//       testMutation.mutate(testData, {
//         onSuccess: (result) => {
//           if (result.valid) {
//             setTestStatus({
//               state: 'success',
//               message: result.message || '✅ Connection test succeeded! Credentials are valid.',
//               account_status: result.account_info?.status,
//             });
//             resolve(true);
//           } else {
//             setTestStatus({
//               state: 'error',
//               message: result.message || '❌ Connection test failed.',
//               details: result.account_info ? `Account status: ${result.account_info.status}` : 'Please check your credentials.',
//             });
//             resolve(false);
//           }
//         },
//         onError: (error: any) => {
//           const errorData = error.response?.data;
//           const errorMessage = errorData?.message || 'Connection test failed: An unexpected error occurred.';
          
//           setTestStatus({
//             state: 'error',
//             message: 'Connection test failed.',
//             details: errorMessage,
//           });
          
//           // Set specific field errors if provided by backend
//           if (errorData && typeof errorData === 'object') {
//             const fieldErrors: Record<string, string> = {};
//             Object.keys(errorData).forEach(key => {
//               if (key !== 'message' && typeof errorData[key] === 'string') {
//                 fieldErrors[key] = errorData[key];
//               }
//             });
//             if (Object.keys(fieldErrors).length > 0) {
//               setErrors(fieldErrors);
//             }
//           }
          
//           resolve(false);
//         },
//       });
//     });
//   };

//   const handleSubmit = () => {
//     const mutation = isEditing ? updateMutation : createMutation;
//     const data = isEditing ? { id: connection!.id, data: formData } : formData;

//     mutation.mutate(data as any, {
//       onSuccess: () => {
//         dispatch(showToast({
//           message: isEditing ? 'Connection updated successfully' : 'Connection created successfully',
//           type: 'success'
//         }));
//         onSuccess();
//       },
//       onError: (error: any) => {
//         if (error.response?.data && !error.response.data.message) {
//            setErrors(error.response.data);
//         }
//         dispatch(showToast({
//           message: error.response?.data?.message ||
//             (isEditing ? 'Failed to update connection' : 'Failed to create connection'),
//           type: 'error'
//         }));
//       },
//     });
//   };



// // Updated handleSave function
// const handleSave = async () => {
//   if (!validateForm()) {
//     setTestStatus({ state: 'error', message: 'Please correct the form errors before saving.' });
//     return;
//   }

//   if (isEditing) {
//     const testPassed = await handleTest();
//     if (testPassed) {
//       handleSubmit();
//     }
//   } else {
//     setTestStatus({ state: 'testing', message: 'Testing and saving connection...' });
    
//     createAndValidateMutation.mutate(formData as any, {

//           onSuccess: (result) => {
//             if (result.success && result.created) {
//               let successMessage = result.message || 'Connection created and validated successfully!';
              
//               if (result.account_info) {
//                 successMessage += ` Account: ${result.account_info.account_number || 'Connected'}`;
//               }
              
//               setTestStatus({
//                 state: 'success',
//                 message: successMessage,
//                 account_status: result.account_info?.status,
//               });
              
//               dispatch(showToast({
//                 message: successMessage,
//                 type: 'success'
//               }));
              
//               // Small delay to show success message before closing
//               setTimeout(() => {
//                 onSuccess();
//               }, 1500);
//             } else {
//               setTestStatus({
//                 state: 'error',
//                 message: result.message || 'Failed to create connection',
//               });
//             }
//           },
          
   
//       onError: (error: any) => {
//         const errorMessage = error.response?.data?.message || 'Failed to create connection';
//         setTestStatus({
//           state: 'error',
//           message: errorMessage,
//         });
//         dispatch(showToast({
//           message: errorMessage,
//           type: 'error'
//         }));
        
//         if (error.response?.data) {
//           setErrors(error.response.data);
//         }
//       },
//     });
//   }
// };

// const isDisabled = isSaving || isTesting || createAndValidateMutation.isPending;
//   const inputBaseSx = (theme: any) => ({
//     backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#fff',
//     borderRadius: 1,
//     '& .MuiOutlinedInput-root': {
//       color: theme.palette.mode === 'dark' ? '#fff' : 'inherit',
//       '& fieldset': {
//         borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
//       },
//       '&:hover fieldset': {
//         borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.18)' : undefined,
//       },
//       '&.Mui-focused fieldset': {
//         borderColor: theme.palette.mode === 'dark' ? '#00c6ff' : undefined,
//       },
//     },
//     '& .MuiInputBase-input': {
//       color: theme.palette.mode === 'dark' ? '#fff' : 'inherit',
//       '&::placeholder': {
//         color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
//         opacity: 1,
//       },
//     },
//   });

//   const renderAuthFields = () => {
//     if (formData.auth_type === 'api_key') {
//       return (
//         <>
//           <Box sx={{ gridColumn: 'span 2' }}>
//             <TextField
//               fullWidth
//               placeholder="API Key"
//               aria-label="API Key"
//               value={formData.api_key || ''}
//               onChange={(e) => handleChange('api_key', e.target.value)}
//               error={!!errors.api_key}
//               helperText={errors.api_key}
//               type="password"
//               sx={(theme) => inputBaseSx(theme)}
//             />
//           </Box>

//           <Box sx={{ gridColumn: 'span 2' }}>
//             <TextField
//               fullWidth
//               placeholder="API Secret"
//               aria-label="API Secret"
//               value={formData.api_secret || ''}
//               onChange={(e) => handleChange('api_secret', e.target.value)}
//               error={!!errors.api_secret}
//               helperText={errors.api_secret}
//               type="password"
//               sx={(theme) => inputBaseSx(theme)}
//             />
//           </Box>

//           <Box sx={{ gridColumn: 'span 2' }}>
//             <TextField
//               fullWidth
//               placeholder="API Token (Optional)"
//               aria-label="API Token"
//               value={formData.api_token || ''}
//               onChange={(e) => handleChange('api_token', e.target.value)}
//               type="password"
//               sx={(theme) => inputBaseSx(theme)}
//             />
//           </Box>
//         </>
//       );
//     } else if (formData.auth_type === 'oauth') {
//       return (
//         <>
//           <Box sx={{ gridColumn: 'span 2' }}>
//             <TextField
//               fullWidth
//               placeholder="Access Token"
//               aria-label="Access Token"
//               value={formData.oauth_access_token || ''}
//               onChange={(e) => handleChange('oauth_access_token', e.target.value)}
//               error={!!errors.oauth_access_token}
//               helperText={errors.oauth_access_token}
//               type="password"
//               sx={(theme) => inputBaseSx(theme)}
//             />
//           </Box>

//           <Box sx={{ gridColumn: 'span 2' }}>
//             <TextField
//               fullWidth
//               placeholder="Refresh Token (Optional)"
//               aria-label="Refresh Token"
//               value={formData.oauth_refresh_token || ''}
//               onChange={(e) => handleChange('oauth_refresh_token', e.target.value)}
//               type="password"
//               sx={(theme) => inputBaseSx(theme)}
//             />
//           </Box>

//           <Box sx={{ gridColumn: 'span 2' }}>
//             <TextField
//               fullWidth
//               placeholder="Client ID (Optional)"
//               aria-label="Client ID"
//               value={formData.oauth_client_id || ''}
//               onChange={(e) => handleChange('oauth_client_id', e.target.value)}
//               sx={(theme) => inputBaseSx(theme)}
//             />
//           </Box>
//         </>
//       );
//     }
//     return null;
//   };

//   const findLabel = (list: { value: string; label: string }[], val: any) => {
//     const found = list.find((i) => i.value === val);
//     return found ? found.label : '';
//   };

//   const renderFormContent = () => (
//     <Box
//       sx={{
//         display: 'grid',
//         gap: 2,
//         gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
//       }}
//     >
//       <Box sx={{ gridColumn: 'span 2' }}>
//         <TextField
//           fullWidth
//           placeholder="Connection Name"
//           aria-label="Connection Name"
//           value={formData.name || ''}
//           onChange={(e) => handleChange('name', e.target.value)}
//           error={!!errors.name}
//           helperText={errors.name}
//           sx={(theme) => inputBaseSx(theme)}
//         />
//       </Box>

//       <Box sx={{ gridColumn: { xs: 'span 2', sm: 'span 1' } }}>
//         <FormControl fullWidth error={!!errors.broker_type} sx={(theme) => ({ ...inputBaseSx(theme) })}>
//           <Select
//             displayEmpty
//             value={formData.broker_type ?? ''}
//             onChange={(e) => handleChange('broker_type', e.target.value)}
//             renderValue={(selected) =>
//               selected ? findLabel(BROKER_TYPES, selected) : <span style={{ opacity: 0.75 }}>Select broker type</span>
//             }
//             inputProps={{ 'aria-label': 'Broker Type' }}
//             sx={{
//               '& .MuiSelect-select': (theme: any) => ({
//                 color: theme.palette.mode === 'dark' ? '#fff' : 'inherit',
//               }),
//             }}
//           >
//             <MenuItem value="" disabled>
//               Select broker type
//             </MenuItem>
//             {BROKER_TYPES.map((type) => (
//               <MenuItem key={type.value} value={type.value}>
//                 {type.label}
//               </MenuItem>
//             ))}
//           </Select>
//           {errors.broker_type && <FormHelperText>{errors.broker_type}</FormHelperText>}
//         </FormControl>
//       </Box>

//       <Box sx={{ gridColumn: { xs: 'span 2', sm: 'span 1' } }}>
//         <FormControl fullWidth error={!!errors.environment} sx={(theme) => ({ ...inputBaseSx(theme) })}>
//           <Select
//             displayEmpty
//             value={formData.environment ?? ''}
//             onChange={(e) => handleChange('environment', e.target.value)}
//             renderValue={(selected) =>
//               selected ? findLabel(ENVIRONMENTS, selected) : <span style={{ opacity: 0.75 }}>Select environment</span>
//             }
//             inputProps={{ 'aria-label': 'Environment' }}
//             sx={{
//               '& .MuiSelect-select': (theme: any) => ({
//                 color: theme.palette.mode === 'dark' ? '#fff' : 'inherit',
//               }),
//             }}
//           >
//             <MenuItem value="" disabled>
//               Select environment
//             </MenuItem>
//             {ENVIRONMENTS.map((env) => (
//               <MenuItem key={env.value} value={env.value}>
//                 {env.label}
//               </MenuItem>
//             ))}
//           </Select>
//           {errors.environment && <FormHelperText>{errors.environment}</FormHelperText>}
//         </FormControl>
//       </Box>

//       <Box sx={{ gridColumn: 'span 2' }}>
//         <FormControl fullWidth error={!!errors.auth_type} sx={(theme) => ({ ...inputBaseSx(theme) })}>
//           <Select
//             displayEmpty
//             value={formData.auth_type ?? ''}
//             onChange={(e) => handleChange('auth_type', e.target.value)}
//             renderValue={(selected) =>
//               selected ? findLabel(AUTH_TYPES, selected) : <span style={{ opacity: 0.75 }}>Select authentication type</span>
//             }
//             inputProps={{ 'aria-label': 'Authentication Type' }}
//             sx={{
//               '& .MuiSelect-select': (theme: any) => ({
//                 color: theme.palette.mode === 'dark' ? '#fff' : 'inherit',
//               }),
//             }}
//           >
//             <MenuItem value="" disabled>
//               Select authentication type
//             </MenuItem>
//             {AUTH_TYPES.map((auth) => (
//               <MenuItem key={auth.value} value={auth.value}>
//                 {auth.label}
//               </MenuItem>
//             ))}
//           </Select>
//           {errors.auth_type && <FormHelperText>{errors.auth_type}</FormHelperText>}
//         </FormControl>
//       </Box>

//       {renderAuthFields()}

//       <Box sx={{ gridColumn: 'span 2' }}>
//         <TextField
//           fullWidth
//           placeholder="Base URL (Optional)"
//           aria-label="Base URL"
//           value={formData.base_url || ''}
//           onChange={(e) => handleChange('base_url', e.target.value)}
//           sx={(theme) => inputBaseSx(theme)}
//         />
//       </Box>

//       <Box sx={{ gridColumn: 'span 2' }}>
//         <TextField
//           fullWidth
//           placeholder="Account ID (Optional)"
//           aria-label="Account ID"
//           value={formData.account_id || ''}
//           onChange={(e) => handleChange('account_id', e.target.value)}
//           sx={(theme) => inputBaseSx(theme)}
//         />
//       </Box>

//       <Box sx={{ gridColumn: 'span 2' }}>
//         <FormControl fullWidth sx={(theme) => ({ ...inputBaseSx(theme) })}>
//           <Select
//             displayEmpty
//             value={formData.is_active ? 'active' : 'inactive'}
//             onChange={(e) => handleChange('is_active', e.target.value === 'active')}
//             renderValue={(selected) => (selected ? (selected === 'active' ? 'Active' : 'Inactive') : <span style={{ opacity: 0.75 }}>Select status</span>)}
//             inputProps={{ 'aria-label': 'Status' }}
//             sx={{
//               '& .MuiSelect-select': (theme: any) => ({
//                 color: theme.palette.mode === 'dark' ? '#fff' : 'inherit',
//               }),
//             }}
//           >
//             <MenuItem value="" disabled>
//               Select status
//             </MenuItem>
//             <MenuItem value="active">Active</MenuItem>
//             <MenuItem value="inactive">Inactive</MenuItem>
//           </Select>
//         </FormControl>
//       </Box>

//       <Box sx={{ gridColumn: 'span 2' }}>
//         <FormControl fullWidth sx={(theme) => ({ ...inputBaseSx(theme) })}>
//           <Select
//             displayEmpty
//             value={formData.is_default ? 'yes' : 'no'}
//             onChange={(e) => handleChange('is_default', e.target.value === 'yes')}
//             renderValue={(selected) => (selected ? (selected === 'yes' ? 'Yes' : 'No') : <span style={{ opacity: 0.75 }}>Default connection?</span>)}
//             inputProps={{ 'aria-label': 'Default Connection' }}
//             sx={{
//               '& .MuiSelect-select': (theme: any) => ({
//                 color: theme.palette.mode === 'dark' ? '#fff' : 'inherit',
//               }),
//             }}
//           >
//             <MenuItem value="" disabled>
//               Default connection?
//             </MenuItem>
//             <MenuItem value="yes">Yes</MenuItem>
//             <MenuItem value="no">No</MenuItem>
//           </Select>
//         </FormControl>
//       </Box>
//     </Box>
//   );

//   return (
//     <Box
//       sx={(theme: any) => ({
//         background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)',
//         borderRadius: 2,
//         p: 3,
//         maxWidth: 920,
//         mx: 'auto',
//         boxShadow: theme.palette.mode === 'dark' ? '0 6px 24px rgba(0,0,0,0.6)' : '0 6px 24px rgba(0,0,0,0.12)',
//         color: theme.palette.mode === 'dark' ? '#fff' : 'text.primary',
//       })}
//     >
//       {renderFormContent()}
      
//       {isTesting && (
//         <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
//           <CircularProgress size={24} sx={{ mr: 2 }} />
//           **Testing connection...**
//         </Box>
//       )}

//       {testStatus && testStatus.state !== 'testing' && (
//         <Alert severity={testStatus.state === 'success' ? 'success' : 'error'} sx={{ mt: 3, mb: 0, borderRadius: 1 }}>
//           {testStatus.message}
//           {testStatus.account_status && <Box mt={1}>Account Status: **{testStatus.account_status}**</Box>}
//           {testStatus.details && <Box mt={1}>Details: **{testStatus.details}**</Box>}
//         </Alert>
//       )}

//       <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
//         <Button onClick={onCancel} sx={{ textTransform: 'none' }}>
//           Cancel
//         </Button>

//         <Button
//           onClick={handleSave}
//           variant="contained"
//           disabled={isDisabled}
//           sx={(theme: any) => ({
//             borderRadius: 1,
//             textTransform: 'none',
//             color: '#fff',
//             minWidth: 100
//           })}
//         >
//           {isSaving ? 'Saving...' : (isTesting ? 'Testing...' : 'Save')}
//         </Button>
//       </Box>
//     </Box>
//   );
// };

// export default BrokerConnectionForm;

