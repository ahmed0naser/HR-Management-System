import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AttendanceRule } from './entities/attendanceRule.entity';
import { Repository } from 'typeorm';
import { CreateAttendanceRuleDto } from './dto/createAttendanceRule.dto';
import { ShiftType } from 'src/common/enums/shiftType.enum';
import { UpdateAttendanceRuleDto } from './dto/updateAttendanceRule.dto';

@Injectable()
export class AttendanceRuleService {
  constructor(
    @InjectRepository(AttendanceRule)
    private readonly attendanceRuleRepo: Repository<AttendanceRule>,
  ) {}
  async create(dto: CreateAttendanceRuleDto) {
    try {
      const record = this.attendanceRuleRepo.create(dto);
      const saved = await this.attendanceRuleRepo.save(record);
      return saved;
    } catch (e) {
      if (e.code === '23505') throw new ConflictException();
      else throw e;
    }
  }
  async findAll() {
    const records = await this.attendanceRuleRepo.find();
    return records;
  }
  async findOne(shiftType: ShiftType) {
    const record = await this.attendanceRuleRepo.findOne({
      where: { shiftType },
    });
    if (!record) {
      throw new BadRequestException('provide a valid shift type');
    }
    return record;
  }
  async update(id: string, dto: UpdateAttendanceRuleDto) {
    const record = await this.attendanceRuleRepo.findOne({ where: { id } });
    if (!record) {
      throw new BadRequestException();
    }
    const updated = this.attendanceRuleRepo.merge(record, dto);

    return this.attendanceRuleRepo.save(updated);
  }
}
