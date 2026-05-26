import { IsString, MinLength, IsNotEmpty, MaxLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty({ message: 'Current password is required' })
  @IsString({ message: 'Current password must be a string' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  oldPassword!: string;

  @IsNotEmpty({ message: 'New password is required' })
  @IsString({ message: 'New password must be a string' })
  @MinLength(8, { message: 'New password must have at least 8 characters' })
  @Matches(/(?=.*[a-z])(?=.*[A-Z])/, { message: 'New password must contain at least one uppercase and one lowercase letter' })
  @MaxLength(128, { message: 'New password must not exceed 128 characters' })
  newPassword!: string;

  @IsNotEmpty({ message: 'Password confirmation is required' })
  @IsString({ message: 'Password confirmation must be a string' })
  @MaxLength(128, { message: 'Password confirmation must not exceed 128 characters' })
  confirmPassword!: string;
}