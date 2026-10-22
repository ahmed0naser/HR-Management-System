import { PermissionType } from 'src/common/enums/permission-type.enum';

export type ApprovalStep = 'manager' | 'hr';

export const APPROVAL_CHAIN: Record<PermissionType, ApprovalStep[]> = {
  [PermissionType.Annual]: ['manager', 'hr'],
  [PermissionType.Sick]: ['hr'],
  [PermissionType.Emergency]: ['manager', 'hr'],
  [PermissionType.Exit]: ['manager'],
  [PermissionType.WorkFromHome]: ['manager'],
  [PermissionType.Unpaid]: ['manager', 'hr'],
};
