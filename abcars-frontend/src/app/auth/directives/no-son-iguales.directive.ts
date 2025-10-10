import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export const noSonIguales: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const password = control?.get("password")
    const confirmarPassword = control?.get("passwordRepeat")
  
    return password && confirmarPassword && password.value === confirmarPassword.value ? null : { valid: true };
};