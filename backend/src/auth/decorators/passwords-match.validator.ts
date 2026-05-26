import { registerDecorator, ValidationOptions, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

/**
 * Validates that two password fields match
 */
@ValidatorConstraint({ name: 'PasswordsMatch', async: false })
export class PasswordsMatchConstraint implements ValidatorConstraintInterface {
  validate(confirmPassword: any, args: ValidationArguments) {
    const obj = args.object as any;
    return obj.newPassword === confirmPassword || obj.password === confirmPassword;
  }

  defaultMessage() {
    return 'Passwords do not match';
  }
}

export function PasswordsMatch(validationOptions?: ValidationOptions) {
  return function (target: Object, propertyName: string) {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: PasswordsMatchConstraint,
    });
  };
}
