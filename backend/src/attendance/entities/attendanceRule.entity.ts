import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ShiftType } from '../../common/enums/shiftType.enum';

@Entity()
export class AttendanceRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ShiftType, unique: true })
  shiftType: ShiftType;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column()
  lateToleranceMinutes: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  deductionPerLateOccurrence: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  deductionPerAbsence: number;
}
