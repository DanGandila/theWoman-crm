import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

const SAFE_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  avatarUrl: true,
  createdAt: true,
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const hash = await bcrypt.hash(dto.password, 12);
    return this.prisma.user.create({
      data: { email: dto.email, name: dto.name, password: hash, role: dto.role },
      select: SAFE_SELECT,
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      select: SAFE_SELECT,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: SAFE_SELECT });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    const { password, ...rest } = dto;
    return this.prisma.user.update({
      where: { id },
      data: {
        ...rest,
        ...(password ? { password: await bcrypt.hash(password, 12) } : {}),
      },
      select: SAFE_SELECT,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
    return { message: 'User deleted' };
  }
}
