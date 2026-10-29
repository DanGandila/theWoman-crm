import { IsString, IsOptional, IsEnum, IsEmail, MinLength, IsNotEmpty } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  /** Optional — only sent when an admin resets someone's password. */
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
