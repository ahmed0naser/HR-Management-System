import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Attendance } from './entities/attendance.entity';
import { Repository } from 'typeorm';
import { CreateAttendanceDto } from './dto/createAttendance.dto';
import { AttendanceRuleService } from './attendance-rule.service';
import { UserService } from 'src/users/users.service';
import { AttendanceStatus } from 'src/common/enums/attendanceStatus.enum';
import { User } from 'src/users/entities/user.entity';
import { UpdateAttendanceDto } from './dto/UpdateAttendance.dto';
import { AttendanceRule } from './entities/attendanceRule.entity';
import { payloadType } from 'src/common/types/payloadType';
import { RolesEnum } from 'src/common/enums/roles.enum';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepo: Repository<Attendance>,
    private readonly userService: UserService,
    private readonly attendanceRuleService: AttendanceRuleService,
  ) {}
  async create(dto: CreateAttendanceDto, recordedById: string) {
    if (
      (dto.status === AttendanceStatus.Present ||
        dto.status === AttendanceStatus.Late) &&
      !dto.checkIn
    ) {
      throw new BadRequestException(
        'checkIn is required when status is Present or Late',
      );
    }
    let isLate = false;

    const emp = await this.userService.findOne(dto.employeeId);
    if (!emp.shiftType)
      throw new BadRequestException('Employee has no assigned shift');
    const shift = await this.attendanceRuleService.findOne(emp.shiftType);

    if (dto.checkIn) {
      isLate = this.isLate(dto, shift);
    }

    const record = this.attendanceRepo.create({
      employee: { id: dto.employeeId } as User,
      recordedBy: { id: recordedById } as User,
      date: dto.date,
      checkIn: dto.checkIn ? new Date(dto.checkIn) : null,
      checkOut: dto.checkOut ? new Date(dto.checkOut) : null,
      status: dto.status,
      isLate,
    });

    const saved = await this.attendanceRepo.save(record);
    return saved;
  }
  async update(id: string, dto: UpdateAttendanceDto) {
    const record = await this.attendanceRepo.findOne({
      where: { id },
      relations: { employee: true },
    });
    if (!record) throw new NotFoundException('attendance record not found');
    const todayDate = new Date().toISOString().split('T')[0];
    if (todayDate !== record?.date) throw new ForbiddenException();
    if (dto.checkIn) {
      const emp = await this.userService.findOne(record.employee.id);
      if (!emp.shiftType)
        throw new BadRequestException('Employee has no assigned shift');
      const shift = await this.attendanceRuleService.findOne(emp.shiftType);
      record.isLate = this.isLate(dto, shift);
    }
    const newRecord = this.attendanceRepo.merge(record, dto);
    return this.attendanceRepo.save(newRecord);
  }
  async findOne(id: string, requestingUser: payloadType) {
    const record = await this.attendanceRepo.findOne({
      where: { id },
      relations: { employee: true },
    });
    if (!record) throw new NotFoundException();

    const isOwner = record.employee.id === requestingUser.sub;
    const isPrivileged = [
      RolesEnum.Admin,
      RolesEnum.HR_Manager,
      RolesEnum.Manager,
    ].includes(requestingUser.role);

    if (!isOwner && !isPrivileged) {
      throw new ForbiddenException();
    }

    return record;
  }
  async find(pageNumber: number, limit: number) {
    return this.attendanceRepo.find({
      take: limit,
      skip: limit * (pageNumber - 1),
      relations: { employee: true },
    });
  }

  private isLate(
    dto: UpdateAttendanceDto | CreateAttendanceDto,
    shift: AttendanceRule,
  ) {
    const checkInDate = new Date(dto.checkIn as string);
    const checKInMinutes =
      checkInDate.getUTCHours() * 60 + checkInDate.getUTCMinutes();
    const [hours, minutes] = shift.startTime.split(':');
    const shiftTimeInMinutes = parseInt(hours, 10) * 60 + parseInt(minutes, 10);
    if (checKInMinutes - shiftTimeInMinutes > shift.lateToleranceMinutes) {
      dto.status = AttendanceStatus.Late;
      return true;
    } else {
      return false;
    }
  }
}
