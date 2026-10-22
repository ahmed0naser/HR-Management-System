import {
  IsDateString,
  IsEnum,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { PermissionType } from 'src/common/enums/permission-type.enum';

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class CreatePermissionDto {
  @IsEnum(PermissionType)
  type: PermissionType;

  @IsDateString()
  @Matches(DATE_ONLY_REGEX, {
    message: 'startDate must be a date-only string (YYYY-MM-DD)',
  })
  startDate: string;

  @IsDateString()
  @Matches(DATE_ONLY_REGEX, {
    message: 'endDate must be a date-only string (YYYY-MM-DD)',
  })
  endDate: string;

  @IsString()
  @Length(1, 1000)
  reason: string;
}
