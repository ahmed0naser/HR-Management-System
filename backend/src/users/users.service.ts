import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { EmpStatus } from 'src/common/enums/EmpStatus.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async createUser(createUserDto: CreateUserDto) {
    const hashedPassword = await this.hashPassword(createUserDto.password, 10);
    const user = this.userRepo.create(createUserDto);
    return this.userRepo.save({ ...user, password: hashedPassword });
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
    const user = await this.findOne(id);
    const updated = this.userRepo.merge(user, dto);
    return this.userRepo.save(updated);
  }
  async remove(id: string) {
    const user = await this.findOne(id);
    user.empStatus = EmpStatus.Terminated;
    await this.userRepo.save(user);
    return user;
  }
  private async hashPassword(password: string, salt: number) {
    const hashed = await bcrypt.hash(password, salt);
    return hashed;
  }
}
