import { IsEnum, IsNumber, IsMilitaryTime, Min, IsInt } from 'class-validator';
import { ShiftType } from 'src/common/enums/shiftType.enum';

export class CreateAttendanceRuleDto {
  @IsEnum(ShiftType)
  shiftType: ShiftType;
  @IsMilitaryTime()
  startTime: string;
  @IsMilitaryTime()
  endTime: string;
  @IsInt()
  @Min(0)
  lateToleranceMinutes: number;
  @IsNumber()
  @Min(0)
  deductionPerLateOccurrence: number;
  @IsNumber()
  @Min(0)
  deductionPerAbsence: number;
}
