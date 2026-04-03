// src/lib/types.ts
export interface ReferralStats {
  referral_code: string;
  referral_count: number;
  referral_points: number;
  total_points: number;
  referrals: Array<{
    username: string;
    joined_at: string;
    points_awarded: number;
  }>;
}