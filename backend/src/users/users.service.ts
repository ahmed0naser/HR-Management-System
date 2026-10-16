import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { EmpStatus } from 'src/common/enums/EmpStatus.enum';
import { RolesEnum } from 'src/common/enums/roles.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}
  private async assertValidManager(managerId: string, userId?: string) {
    if (managerId === userId) {
      throw new BadRequestException('A user cannot be their own manager');
    }
    const manager = await this.findOne(managerId);
    if (manager.role !== RolesEnum.Manager) {
      throw new BadRequestException(
        'Assigned manager must have the Manager role',
      );
    }
  }

  async createUser(createUserDto: CreateUserDto) {
    const { managerId, ...rest } = createUserDto;
    if (managerId) await this.assertValidManager(managerId);
    const hashedPassword = await this.hashPassword(rest.password, 10);
    const user = this.userRepo.create({
      ...rest,
      password: hashedPassword,
      manager: managerId ? { id: managerId } : null,
    });
    return this.userRepo.save(user);
  }
  async findAll(pageNumber: number = 1, limit: number = 20) {
    const users = await this.userRepo.find({
      take: limit,
      skip: limit * (pageNumber - 1),
    });
    return users;
  }
  async findOne(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('user not found');
    return user;
  }
  async findByEmail(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new NotFoundException();
    return user;
  }
  async update(id: string, dto: UpdateUserDto) {
    const { managerId, ...rest } = dto;
    const user = await this.findOne(id);
    if (managerId) {
      await this.assertValidManager(managerId, id);
      user.manager = { id: managerId } as User;
    }
    const updated = this.userRepo.merge(user, rest);
    return this.userRepo.save(updated);
  }
  async remove(id: string) {
    const user = await this.findOne(id);
    user.empStatus = EmpStatus.Terminated;
    await this.userRepo.save(user);
    return user;
  }
  async uploadImage(file: Express.Multer.File, id: string) {
    const user = await this.findOne(id);
    user.photoUrl = file.filename;
    await this.userRepo.save(user);
    return user.photoUrl;
  }
  private async hashPassword(password: string, salt: number) {
    const hashed = await bcrypt.hash(password, salt);
    return hashed;
  }
}
