import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

const PROJECT_INCLUDE = {
  responsible: { select: { id: true, name: true } },
  _count: { select: { tasks: true } },
};

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProjectDto) {
    const key = dto.key.toUpperCase();
    const existing = await this.prisma.project.findUnique({ where: { key } });
    if (existing) throw new ConflictException(`Project key "${key}" already exists`);

    return this.prisma.project.create({
      data: {
        ...dto,
        key,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        // Forms submit '' for "nobody" — don't try to link a user with an empty id
        responsibleId: dto.responsibleId || undefined,
      },
      include: PROJECT_INCLUDE,
    });
  }

  findAll() {
    return this.prisma.project.findMany({
      include: PROJECT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: PROJECT_INCLUDE,
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.findOne(id);

    const { startDate, endDate, responsibleId, ...rest } = dto;
    return this.prisma.project.update({
      where: { id },
      data: {
        ...rest,
        // `undefined` leaves the value alone, '' / null clears it
        startDate: startDate === undefined ? undefined : startDate ? new Date(startDate) : null,
        endDate: endDate === undefined ? undefined : endDate ? new Date(endDate) : null,
        responsibleId: responsibleId === undefined ? undefined : responsibleId || null,
      },
      include: PROJECT_INCLUDE,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.project.delete({ where: { id } });
    return { message: 'Project deleted' };
  }
}
