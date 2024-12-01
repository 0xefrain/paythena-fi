export interface ContributorInfo {
  name: string;
  salary: bigint;
  nextPayment: bigint;
  paymentFrequency: bigint;
  isActive: boolean;
  lastProcessedTime: bigint;
  address?: string;
}

export interface CompanyDetails {
  name: string;
  balance: bigint;
  contributorCount: bigint;
  isActive: boolean;
  admin?: string;
}

export interface PaymentRecord {
  paymentId: bigint;
  txHash: string;
  timestamp: bigint;
  amount: bigint;
  processed: boolean;
}
