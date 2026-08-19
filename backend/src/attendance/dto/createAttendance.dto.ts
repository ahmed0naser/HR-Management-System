// src/attendance/dto/createAttendance.dto.ts
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { AttendanceStatus } from 'src/common/enums/attendanceStatus.enum';

export class CreateAttendanceDto {
  @IsUUID()
  employeeId: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsDateString()
  checkIn?: string;

  @IsOptional()
  @IsDateString()
  checkOut?: string;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;
}
