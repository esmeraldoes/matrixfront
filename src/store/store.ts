// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { logout } from './authSlice';
import referralReducer from './referralSlice';
import paymentReducer from './paymentSlice';
import { api } from '../services/api';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    referrals: referralReducer,
    payment: paymentReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['payment/webhookEventReceived'],
        ignoredPaths: ['payment.payoutHistory.results'],
      },
    }),
});

// Set the unauthorized callback after store is created
api.setUnauthorizedCallback(() => {
  store.dispatch(logout());
});

// Start token monitoring after store is configured
api.startTokenMonitoring();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;



// // src/store/store.ts
// import { configureStore } from '@reduxjs/toolkit';
// import authReducer, { logout } from './authSlice';
// import referralReducer from './referralSlice';
// import paymentReducer from './paymentSlice';
// import { api } from '../services/api';

// export const store = configureStore({
//   reducer: {
//     auth: authReducer,
//     referrals: referralReducer,
//     payment: paymentReducer,
//   },
//   middleware: (getDefaultMiddleware) =>
//     getDefaultMiddleware({
//       serializableCheck: {
//         ignoredActions: ['payment/webhookEventReceived'],
//         ignoredPaths: ['payment.payoutHistory.results'],
//       },
//     }),
// });

// // Set the unauthorized callback after store is created
// api.setUnauthorizedCallback(() => {
//   store.dispatch(logout());
// });

// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;



// // src/store/store.ts
// import { configureStore } from '@reduxjs/toolkit';
// import authReducer from './authSlice';
// import referralReducer from './referralSlice';
// import paymentReducer from './paymentSlice';

// export const store = configureStore({
//   reducer: {
//     auth: authReducer,
//     referrals: referralReducer,
//     payment: paymentReducer,
//   },
//   middleware: (getDefaultMiddleware) =>
//     getDefaultMiddleware({
//       serializableCheck: {
//         ignoredActions: ['payment/webhookEventReceived'],
//         ignoredPaths: ['payment.payoutHistory.results'],
//       },
//     }),
// });

// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;







// // src/store/store.ts
// import { configureStore } from '@reduxjs/toolkit';
// import authReducer from './authSlice';
// import referralReducer from './referralSlice';
// import paymentReducer from './paymentSlice';

// export const store = configureStore({
//   reducer: {
//     auth: authReducer,
//     referrals: referralReducer,
//     payment: paymentReducer,
//   },
//   middleware: (getDefaultMiddleware) =>
//     getDefaultMiddleware({
//       serializableCheck: {
//         ignoredActions: ['payment/webhookEventReceived'],
//         ignoredPaths: ['payment.payoutHistory.results'],
//       },
//     }),
// });

// // ✅ Export cleanly inferred store types (no circular dependency)
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;


















// // // // src/store/store.ts
// // // import { configureStore } from '@reduxjs/toolkit';
// // // import authReducer from './authSlice';
// // // import referralReducer from './referralSlice';
// // // import paymentReducer from './paymentSlice';

// // // export const store = configureStore({
// // //   reducer: {
// // //     auth: authReducer,
// // //     referrals: referralReducer,
// // //     payment: paymentReducer,
// // //   },
// // //   middleware: (getDefaultMiddleware) => 
// // //     getDefaultMiddleware({
// // //       serializableCheck: {
// // //         ignoredActions: ['payment/webhookEventReceived'],
// // //         ignoredPaths: ['payment.payoutHistory.results'],
// // //       },
// // //     }),
// // // });

// // // // Re-export types for backward compatibility
// // // export type RootState = ReturnType<typeof store.getState>;
// // // export type AppDispatch = typeof store.dispatch;
// // // export type AppThunkDispatch = ThunkDispatch<RootState, undefined, UnknownAction>;


// // // src/store/store.ts
// // import { configureStore, type ThunkAction, type Action } from '@reduxjs/toolkit';
// // import authReducer from './authSlice';
// // import referralReducer from './referralSlice';
// // import paymentReducer from './paymentSlice';

// // export const store = configureStore({
// //   reducer: {
// //     auth: authReducer,
// //     referrals: referralReducer,
// //     payment: paymentReducer,
// //   },
// //   middleware: (getDefaultMiddleware) =>
// //     getDefaultMiddleware({
// //       serializableCheck: {
// //         ignoredActions: ['payment/webhookEventReceived'],
// //         ignoredPaths: ['payment.payoutHistory.results'],
// //       },
// //     }),
// // });

// // // ✅ Correct unified types
// // export type RootState = ReturnType<typeof store.getState>;
// // export type AppDispatch = typeof store.dispatch;

// // export type AppThunk<ReturnType = void> = ThunkAction<
// //   ReturnType,
// //   RootState,
// //   unknown, // ✅ Use `unknown`, not `undefined`
// //   Action<string>
// // >;





























































// // // // // // // src/store/store.ts
// // // import { configureStore } from '@reduxjs/toolkit';
// // // import authReducer from './authSlice';
// // // import referralReducer from './referralSlice';
// // // import paymentReducer from './paymentSlice';
// // // import type { ThunkDispatch } from '@reduxjs/toolkit';
// // // import type { UnknownAction } from 'redux';

// // // export const store = configureStore({
// // //   reducer: {
// // //     auth: authReducer,
// // //     referrals: referralReducer,
// // //     payment: paymentReducer,
// // //   },
// // //   middleware: (getDefaultMiddleware) => 
// // //     getDefaultMiddleware({
// // //       serializableCheck: {
// // //         ignoredActions: ['payment/webhookEventReceived'],
// // //         ignoredPaths: ['payment.payoutHistory.results'],
// // //       },
// // //     }),
// // // });

// // // export type RootState = ReturnType<typeof store.getState>;
// // // export type AppDispatch = typeof store.dispatch;

// // // // Add this explicit type for ThunkDispatch
// // // export type AppThunkDispatch = ThunkDispatch<RootState, undefined, UnknownAction>;


















// // // // import { configureStore } from '@reduxjs/toolkit';
// // // // import authReducer from './authSlice';
// // // // import referralReducer from './referralSlice';
// // // // import paymentReducer from './paymentSlice';

// // // // export const store = configureStore({
// // // //   reducer: {
// // // //     auth: authReducer,
// // // //     referrals: referralReducer,
// // // //     payment: paymentReducer,
// // // //   },
// // // //   middleware: (getDefaultMiddleware) => 
// // // //     getDefaultMiddleware({
// // // //       serializableCheck: {
// // // //         ignoredActions: ['payment/webhookEventReceived'],
// // // //         ignoredPaths: ['payment.payoutHistory.results'],
// // // //       },
// // // //     }),
// // // // });

// // // // export type RootState = ReturnType<typeof store.getState>;
// // // // export type AppDispatch = typeof store.dispatch;














// // // // // // import { configureStore } from '@reduxjs/toolkit';
// // // // // // import authReducer from './authSlice';
// // // // // // import referralReducer from './referralSlice';
// // // // // // import paymentReducer from './paymentSlice';  // Add this



// // // // // // export const store = configureStore({
// // // // // //   reducer: {
// // // // // //     auth: authReducer,
// // // // // //     referrals: referralReducer,
// // // // // //     payment: paymentReducer,
// // // // // //     // Add other reducers here
// // // // // //   },
// // // // // // });

// // // // // // export type RootState = ReturnType<typeof store.getState>;
// // // // // // export type AppDispatch = typeof store.dispatch;


// // // // // import { configureStore, type ThunkAction, type Action } from '@reduxjs/toolkit';
// // // // // import authReducer from './authSlice';
// // // // // import referralReducer from './referralSlice';
// // // // // import paymentReducer from './paymentSlice';

// // // // // export const store = configureStore({
// // // // //   reducer: {
// // // // //     auth: authReducer,
// // // // //     referrals: referralReducer,
// // // // //     payment: paymentReducer,
// // // // //   },
// // // // // });

// // // // // // Export properly typed hooks
// // // // // export type RootState = ReturnType<typeof store.getState>;
// // // // // export type AppDispatch = typeof store.dispatch;
// // // // // export type AppThunk<ReturnType = void> = ThunkAction<
// // // // //   ReturnType,
// // // // //   RootState,
// // // // //   unknown,
// // // // //   Action<string>
// // // // // >;