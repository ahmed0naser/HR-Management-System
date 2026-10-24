import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { PermissionRequest } from './entities/permission-request.entity';
import { User } from 'src/users/entities/user.entity';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { PermissionActionDto } from './dto/permission-action.dto';
import { payloadType } from 'src/common/types/payloadType';
import { PermissionType } from 'src/common/enums/permission-type.enum';
import { PermissionStatus } from 'src/common/enums/permission-status.enum';
import { PermissionAction } from 'src/common/enums/permission-action.enum';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { APPROVAL_CHAIN } from 'src/common/constants/approval-chain';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(PermissionRequest)
    private readonly permissionRepo: Repository<PermissionRequest>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
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

  async findAll(
    pageNumber: number,
    limit: number,
    status: PermissionStatus | undefined,
    type: PermissionType | undefined,
    user: payloadType,
  ) {
    const where: FindOptionsWhere<PermissionRequest> = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (user.role === RolesEnum.Manager) {
      where.employee = { manager: { id: user.sub } };
    }

    return this.permissionRepo.find({
      where,
      relations: { employee: true },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: limit * (pageNumber - 1),
    });
  }

  async findOne(id: string, user: payloadType) {
    const request = await this.permissionRepo.findOne({
      where: { id },
      relations: { employee: { manager: true } },
    });
    if (!request) throw new NotFoundException('permission request not found');

    const isOwner = request.employee.id === user.sub;
    const isAdminOrHr = [RolesEnum.Admin, RolesEnum.HR_Manager].includes(
      user.role,
    );
    const isTheirManager =
      user.role === RolesEnum.Manager &&
      request.employee.manager?.id === user.sub;

    if (!isOwner && !isAdminOrHr && !isTheirManager) {
      throw new ForbiddenException('you cannot view this permission request');
    }

    return request;
  }

  async cancel(id: string, user: payloadType) {
    const request = await this.permissionRepo.findOne({
      where: { id },
      relations: { employee: true },
    });
    if (!request) throw new NotFoundException('permission request not found');

    if (request.employee.id !== user.sub) {
      throw new ForbiddenException('only the owner can cancel this request');
    }

    if (
      request.status !== PermissionStatus.Pending &&
      request.status !== PermissionStatus.ManagerApproved
    ) {
      throw new BadRequestException(
        'only pending or manager-approved requests can be cancelled',
      );
    }

    request.status = PermissionStatus.Cancelled;
    return this.permissionRepo.save(request);
  }

  async managerAction(id: string, dto: PermissionActionDto, user: payloadType) {
    const request = await this.permissionRepo.findOne({
      where: { id },
      relations: { employee: { manager: true } },
    });
    if (!request) throw new NotFoundException('permission request not found');

    if (request.employee.manager?.id !== user.sub) {
      throw new ForbiddenException(
        'only the employee manager can act on this request',
      );
    }

    if (request.status !== PermissionStatus.Pending) {
      throw new BadRequestException('permission request is not pending');
    }

    if (APPROVAL_CHAIN[request.type][0] !== 'manager') {
      throw new BadRequestException(
        'this permission type does not require manager approval',
      );
    }

    const comment = dto.comment?.trim();
    if (!comment) {
      throw new BadRequestException('comment is required for manager action');
    }

    if (dto.action === PermissionAction.Reject) {
      request.status = PermissionStatus.Rejected;
      request.managerComment = comment;
      return this.permissionRepo.save(request);
    }

    if (APPROVAL_CHAIN[request.type].includes('hr')) {
      request.status = PermissionStatus.ManagerApproved;
      request.managerComment = comment;
      return this.permissionRepo.save(request);
    }

    return this.finalize(request.id, {
      expectedStatuses: [PermissionStatus.Pending],
      managerComment: comment,
    });
  }

  async hrAction(id: string, dto: PermissionActionDto, user: payloadType) {
    const request = await this.permissionRepo.findOne({
      where: { id },
      relations: { employee: true },
    });
    if (!request) throw new NotFoundException('permission request not found');

    if (request.employee.id === user.sub) {
      throw new ForbiddenException(
        'you cannot approve or reject your own permission request',
      );
    }

    const chain = APPROVAL_CHAIN[request.type];
    const isAwaitingHr =
      request.status === PermissionStatus.ManagerApproved ||
      (request.status === PermissionStatus.Pending &&
        chain.length === 1 &&
        chain[0] === 'hr');

    if (!isAwaitingHr) {
      throw new BadRequestException(
        'permission request is not awaiting HR action',
      );
    }

    if (dto.action === PermissionAction.Reject) {
      const comment = dto.comment?.trim();
      if (!comment) {
        throw new BadRequestException('comment is required when rejecting');
      }
      request.status = PermissionStatus.Rejected;
      request.hrComment = comment;
      return this.permissionRepo.save(request);
    }

    return this.finalize(request.id, {
      expectedStatuses:
        request.status === PermissionStatus.ManagerApproved
          ? [PermissionStatus.ManagerApproved]
          : [PermissionStatus.Pending],
      hrComment: dto.comment?.trim(),
    });
  }

  private finalize(
    id: string,
    options: {
      expectedStatuses: PermissionStatus[];
      managerComment?: string;
      hrComment?: string;
    },
  ): Promise<PermissionRequest> {
    return this.dataSource.transaction(async (manager) => {
      const request = await manager.findOne(PermissionRequest, {
        where: { id },
        relations: { employee: true },
      });
      if (!request) throw new NotFoundException('permission request not found');

      const locked = await manager.findOne(PermissionRequest, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!locked) throw new NotFoundException('permission request not found');

      if (!options.expectedStatuses.includes(locked.status)) {
        throw new BadRequestException(
          'permission request has already been processed',
        );
      }

      if (locked.type === PermissionType.Annual) {
        const employee = await manager.findOne(User, {
          where: { id: request.employee.id },
          lock: { mode: 'pessimistic_write' },
        });
        if (!employee) throw new NotFoundException('employee not found');

        const days = this.countDays(locked.startDate, locked.endDate);
        if (days > employee.annualLeaveBalance) {
          throw new BadRequestException(
            `Annual leave request is ${days} day(s) but only ${employee.annualLeaveBalance} day(s) remain`,
          );
        }

        employee.annualLeaveBalance -= days;
        await manager.save(employee);
      }

      locked.status = PermissionStatus.Approved;
      if (options.managerComment !== undefined) {
        locked.managerComment = options.managerComment;
      }
      if (options.hrComment !== undefined) {
        locked.hrComment = options.hrComment;
      }
      return manager.save(locked);
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
