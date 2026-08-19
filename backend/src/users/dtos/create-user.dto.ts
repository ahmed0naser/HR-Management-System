// src/users/dto/create-user.dto.ts
import {
  IsEmail,
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  Length,
  MinLength,
  MaxLength,
} from 'class-validator';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { EmpStatus } from 'src/common/enums/EmpStatus.enum';
import { ShiftType } from 'src/common/enums/shiftType.enum';

export class CreateUserDto {
  @IsEmail()
  @Length(5, 250)
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @IsString()
  @Length(3, 250)
  name: string;

  @IsString()
  @Length(14, 14)
  nationalId: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  @IsString()
  contractType?: string;

  @IsDateString()
  hireDate: string;

  @IsOptional()
  @IsString()
  salaryGrade?: string;

  @IsOptional()
  @IsString()
  bankAccount?: string;

  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @IsOptional()
  @IsEnum(EmpStatus)
  empStatus?: EmpStatus;

  @IsOptional()
  @IsEnum(RolesEnum)
  role?: RolesEnum;
  @IsOptional()
  @IsEnum(ShiftType)
  shiftType?: ShiftType;
}
