import {
  Provider,
  Role,
  StatusReview,
  TransmissionType,
  LoanOrLeaseStatus,
  PlannedSaleTime,
  ExteriorCondition,
  InteriorDamage,
  TireReplacementTimeframe,
  ConditionStatus,
  PlannedSaleTimeline,
} from "@prisma/client";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
  phoneNumber?: string;
  otpToken?: string;
  expiredOtpToken?: Date;
  refreshToken: string;
  provider: Provider;
  avatar: string;
  role: Role;
  activityLogs: ActivityLog[];
  Cars: Car[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Car {
  id: string;
  user?: User;
  userId?: string;
  slug: string;
  vin?: string;
  miliage: number;
  statusReview: StatusReview;
  transmission_type: TransmissionType;
  isSoloOwner: boolean;
  color: string;
  loanOrLeaseStatus: LoanOrLeaseStatus;
  isTradeIn: boolean;
  plannedSaleTime: PlannedSaleTime;
  additionalFeature: string[];
  exteriorCondition: ExteriorCondition;
  interiorDamage: InteriorDamage;
  keyCount: number;
  tireSetCount: number;
  tireReplacementTimeframe: TireReplacementTimeframe;
  hasOriginalFactoryRims: boolean;
  hasMechanicalIssues: boolean;
  isDriveable: boolean;
  hasAccidentOrClaimStatus: boolean;
  overallConditionStatus: ConditionStatus;
  plannedSaleTimeline: PlannedSaleTimeline;
  activityLogs: ActivityLog[];
  CardImages: CarImage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CarImage {
  id: string;
  Car: Car;
  carId: string;
  imageUrl: string;
}

export interface ActivityLog {
  id: string;
  Car?: Car;
  carId?: string;
  User?: User;
  userId?: string;
}
