import { IsString, IsOptional, IsEnum, IsArray, IsNotEmpty, Matches } from 'class-validator';
import { TaskStatus, TaskPriority } from '@prisma/client';

/** Accepts '' (clear the date) or an ISO date like 2026-01-31. */
const IsOptionalDate = () =>
  Matches(/^(\d{4}-\d{2}-\d{2}(T.*)?)?$/, { message: 'must be an ISO date (YYYY-MM-DD) or empty' });

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  projectId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsOptionalDate()
  dueDate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assigneeIds?: string[];
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  projectId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsOptionalDate()
  dueDate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assigneeIds?: string[];
}
