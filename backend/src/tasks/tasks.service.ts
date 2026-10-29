import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';

const TASK_INCLUDE = {
  assignees: { select: { id: true, name: true, avatarUrl: true } },
  reporter: { select: { id: true, name: true, avatarUrl: true } },
  project: { select: { id: true, name: true, key: true } },
};

/** Open tasks first (by due date, then created); finished ones last. */
function sortForList<T extends { status: string; dueDate: Date | null; createdAt: Date }>(
  tasks: T[],
): T[] {
  const isClosed = (status: string) => status === 'DONE' || status === 'CANCELLED';

  return [...tasks].sort((a, b) => {
    const closed = Number(isClosed(a.status)) - Number(isClosed(b.status));
    if (closed !== 0) return closed;

    const aDue = a.dueDate ? a.dueDate.getTime() : Number.POSITIVE_INFINITY;
    const bDue = b.dueDate ? b.dueDate.getTime() : Number.POSITIVE_INFINITY;
    if (aDue !== bDue) return aDue - bDue;

    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateTaskDto, reporterId: string) {
    const { assigneeIds, dueDate, ...rest } = dto;

    return this.prisma.task.create({
      data: {
        ...rest,
        reporterId,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        assignees: assigneeIds?.length
          ? { connect: assigneeIds.map((id) => ({ id })) }
          : undefined,
      },
      include: TASK_INCLUDE,
    });
  }

  async findAll(projectId?: string) {
    const tasks = await this.prisma.task.findMany({
      where: projectId ? { projectId } : undefined,
      include: TASK_INCLUDE,
    });
    return sortForList(tasks);
  }

  async findMyTasks(userId: string) {
    const tasks = await this.prisma.task.findMany({
      where: { assignees: { some: { id: userId } }, status: { notIn: ['DONE', 'CANCELLED'] } },
      include: TASK_INCLUDE,
    });
    return sortForList(tasks);
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({ where: { id }, include: TASK_INCLUDE });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async update(id: string, dto: UpdateTaskDto) {
    await this.findOne(id);

    const { assigneeIds, dueDate, ...rest } = dto;
    return this.prisma.task.update({
      where: { id },
      data: {
        ...rest,
        dueDate: dueDate === undefined ? undefined : dueDate ? new Date(dueDate) : null,
        // When assigneeIds is provided, it fully replaces the assignee set
        assignees:
          assigneeIds !== undefined ? { set: assigneeIds.map((id) => ({ id })) } : undefined,
      },
      include: TASK_INCLUDE,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.task.delete({ where: { id } });
    return { message: 'Task deleted' };
  }
}
