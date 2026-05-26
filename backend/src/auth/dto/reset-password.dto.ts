import { IsString, MinLength, IsNotEmpty, MaxLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty({ message: 'Token is required' })
  @IsString({ message: 'Token must be a string' })
  token!: string;

  @IsNotEmpty({ message: 'New password is required' })
  @IsString({ message: 'New password must be a string' })
  @MinLength(8, { message: 'Password must have at least 8 characters' })
  @Matches(/(?=.*[a-z])(?=.*[A-Z])/, { message: 'Password must contain at least one uppercase and one lowercase letter' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  newPassword!: string;

  @IsNotEmpty({ message: 'Password confirmation is required' })
  @IsString({ message: 'Password confirmation must be a string' })
  @MaxLength(128, { message: 'Password confirmation must not exceed 128 characters' })
  confirmPassword!: string;
}
