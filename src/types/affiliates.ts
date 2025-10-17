import type{ User } from './user';

export type ReferralStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type CommissionStatus = 'PENDING' | 'APPROVED' | 'PAID';

export interface ReferralCode {
  id: string;
  userId: string;
  code: string;
  createdAt: string;
  expiresAt?: string;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredId: string;
  referralCode: string;
  status: ReferralStatus;
  createdAt: string;
  convertedAt?: string;
  referrer?: User;
  referred?: User;
}

// export interface CommissionTier {
//   id: string;
//   name: string;
//   minReferrals: number;
//   maxReferrals?: number;
//   commissionRate: number;
//   createdAt: string;
// }

// export interface Commission {
//   id: string;
//   referralId: string;
//   amount: number;
//   status: CommissionStatus;
//   createdAt: string;
//   paidAt?: string;
//   referral?: Referral;
// }

export interface AffiliateStats {
  totalReferrals: number;
  activeReferrals: number;
  pendingCommissions: number;
  totalEarnings: number;
  currentTier: CommissionTier;
  conversionRate: number;
}





// src/services/types_refer.ts

// 1. Commission Record
export interface Commission {
  id: number;
  amount: string; // You can cast to number later
  status: 'PENDING' | 'PROCESSED' | 'REJECTED';
  created_at: string;
  processed_at?: string | null;
}

// 2. Referral Row Info
export interface ReferralRow {
  email: string;
  status: string;
  date: string;
  earned: string;
}

// 3. Referral Info (user summary)
// export interface ReferralInfo {
//   code: string;
//   total_referred: number;
//   active_referrals: number;
//   referrals: ReferralRow[];
// }

export interface ReferralInfo {
  code: string;
  successful_referrals: number;
  active_referrals: number;
  referrals: Array<{
    email: string;
    status: string;
    date: string;
    earned: string;
  }>;
}

// 4. Commission Tier
export interface CommissionTier {
  id: string;
  name: string;
  commission_rate: number;
  payout_threshold: number;
  min_referrals: number;
  max_referrals: number | null;
  is_active: boolean;
}

// 5. User Stats
// export interface UserStats {
//   pending_commissions: string;
//   earned_commissions: string;
//   successful_referrals: number;
//   current_tier: CommissionTier;
//   available_payout: string;
// }

export interface UserStats {
  pending: number | string;
  earned: number | string;
  committed: number | string;
  available: number | string;
  successful_referrals: number;
  current_tier: CommissionTier | null;
}

// 6. Payout Response
export interface PayoutResponse {
  id: number;
  amount: string;
  status: string;
  created_at: string;
  processed_at?: string;
}

// 7. Admin Payout (for approvals)
export interface AdminPayout {
  id: number;
  user_email: string;
  amount: string;
  status: string;
  created_at: string;
  processed_at?: string;
}
