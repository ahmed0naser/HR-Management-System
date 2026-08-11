import { PartialType } from '@nestjs/mapped-types';
import { CreateAttendanceRuleDto } from './createAttendanceRule.dto';

export class UpdateAttendanceRuleDto extends PartialType(
  CreateAttendanceRuleDto,
) {}
