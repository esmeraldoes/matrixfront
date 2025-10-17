// src/store/types.ts
import type { ThunkAction } from '@reduxjs/toolkit';
import type { UnknownAction } from 'redux';
import type { RootState } from './store';

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  undefined,
  UnknownAction
>;

// Export other shared types here