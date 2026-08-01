import { Exclude } from 'class-transformer';

import { EmpStatus } from 'src/common/enums/EmpStatus.enum';
import { RolesEnum } from 'src/common/enums/roles.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RefreshToken } from './refreshToken.entity';
const DEFAULT_TIME = 'CURRENT_TIMESTAMP(6)';
@Entity({ name: 'Users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ unique: true, type: 'varchar', length: 250 })
  email: string;
  @Column({ type: 'varchar' })
  @Exclude()
  password: string;
  @Column({ type: 'varchar', length: 250 })
  name: string;
  @Column({ type: 'varchar', length: 14 })
  nationalId: string;
  @Column({ nullable: true })
  photoUrl: string;
  @Column({ nullable: true })
  department: string;
  @Column({ nullable: true })
  jobTitle: string;
  @Column({ nullable: true })
  contractType: string;
  @Column()
  hireDate: Date;
  @Column({ nullable: true })
  salaryGrade: string;
  @Column({ nullable: true })
  bankAccount: string;
  @Column({ nullable: true })
  emergencyContact: string;
  @Column({ type: 'enum', enum: EmpStatus, default: EmpStatus.Active })
  empStatus: EmpStatus;

  @Column({ type: 'enum', enum: RolesEnum, default: RolesEnum.Employee })
  role: RolesEnum;
  @CreateDateColumn({ type: 'timestamp', default: () => DEFAULT_TIME })
  createdAt: Date;
  @UpdateDateColumn({
    type: 'timestamp',
    default: () => DEFAULT_TIME,
    onUpdate: DEFAULT_TIME,
  })
  updatedAt: Date;
  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: RefreshToken[];
}
