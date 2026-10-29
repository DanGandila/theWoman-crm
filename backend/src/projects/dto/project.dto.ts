import {
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  Length,
  Matches,
  ValidateIf,
} from 'class-validator';
import { ProjectStatus } from '@prisma/client';

/** Accepts '' (clear the date) or an ISO date like 2026-01-31. */
const IsOptionalDate = () =>
  Matches(/^(\d{4}-\d{2}-\d{2}(T.*)?)?$/, { message: 'must be an ISO date (YYYY-MM-DD) or empty' });

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @Length(2, 10)
  @Matches(/^[A-Za-z0-9]+$/, { message: 'key must be letters and numbers only' })
  key: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsOptionalDate()
  startDate?: string;

  @IsOptional()
  @IsOptionalDate()
  endDate?: string;

  @IsOptional()
  @IsString()
  responsibleId?: string;
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsOptionalDate()
  startDate?: string;

  @IsOptional()
  @IsOptionalDate()
  endDate?: string;

  /** Pass `null` or '' to clear the responsible person. */
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  responsibleId?: string | null;
}
