import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionRequest } from './entities/permission-request.entity';
import { User } from 'src/users/entities/user.entity';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { payloadType } from 'src/common/types/payloadType';
import { PermissionType } from 'src/common/enums/permission-type.enum';
import { PermissionStatus } from 'src/common/enums/permission-status.enum';
import { APPROVAL_CHAIN } from 'src/common/constants/approval-chain';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(PermissionRequest)
    private readonly permissionRepo: Repository<PermissionRequest>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(dto: CreatePermissionDto, user: payloadType) {
    if (dto.endDate < dto.startDate) {
      throw new BadRequestException('endDate cannot be before startDate');
    }

    if (dto.type === PermissionType.Exit && dto.startDate !== dto.endDate) {
      throw new BadRequestException('Exit permission must be for a single day');
    }

    const employee = await this.userRepo.findOne({
      where: { id: user.sub },
      relations: { manager: true },
    });
    if (!employee) throw new NotFoundException('user not found');

    if (dto.type === PermissionType.Annual) {
      const days = this.countDays(dto.startDate, dto.endDate);
      if (days > employee.annualLeaveBalance) {
        throw new BadRequestException(
          `Annual leave request is ${days} day(s) but only ${employee.annualLeaveBalance} day(s) remain`,
        );
      }
    }

    const chain = APPROVAL_CHAIN[dto.type];
    const status =
      chain[0] === 'manager' && !employee.manager
        ? PermissionStatus.ManagerApproved
        : PermissionStatus.Pending;

    const request = this.permissionRepo.create({
      employee: { id: employee.id },
      type: dto.type,
      status,
      startDate: dto.startDate,
      endDate: dto.endDate,
      reason: dto.reason,
    });

    return this.permissionRepo.save(request);
  }

  async findMine(user: payloadType) {
    return this.permissionRepo.find({
      where: { employee: { id: user.sub } },
      relations: { employee: true },
      order: { createdAt: 'DESC' },
    });
  }

  private countDays(startDate: string, endDate: string) {
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
    const start = Date.UTC(startYear, startMonth - 1, startDay);
    const end = Date.UTC(endYear, endMonth - 1, endDay);
    return Math.round((end - start) / MS_PER_DAY) + 1;
  }
}
