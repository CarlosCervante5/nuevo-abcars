import { Component, OnInit } from '@angular/core';
import { AbstractControlOptions, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';

// Animations
import Swal from 'sweetalert2';

// Services
import { AuthService } from '../../services/auth.service';

// Interfaces
import { RegisterResponse } from '@interfaces/auth.interface';

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styles: [`
        mat-form-field { 
            width: 100%;
        }

        button {
            width: 80%;
        }
    `],
    standalone: false
})

export class RegisterComponent implements OnInit {

    // References of Help
    public hide: boolean = true;
    public spinner: boolean = false;

    // Form References
    public form!: UntypedFormGroup;
    public auth!: UntypedFormGroup;

    constructor(
        private _router: Router,
        private _formBuilder: UntypedFormBuilder, 
        private _authService: AuthService,
        private titleService: Title
    ) { 
        // Set Title View
        this.titleService.setTitle('ABCars | Registrarme');

        // Create form
        this.createForm();
    }

    ngOnInit(): void {
        this.scrollTop();
    }

    scrollTop() {
        window.scrollTo(0, 0);
    }

    /**
     * Getters Inputs Check
     */
    get nameInvalid() {
        return this.form.get('name')!.invalid && (this.form.get('name')!.dirty || this.form.get('name')!.touched);
    }

    get lastnameInvalid() {
        return this.form.get('last_name')!.invalid && (this.form.get('last_name')!.dirty || this.form.get('last_name')!.touched);
    }

    get emailInvalid() {
        return this.form.get('email')!.invalid && (this.form.get('email')!.dirty || this.form.get('email')!.touched);
    }

    get passwordInvalid() {
        return this.form.get('password')!.invalid && (this.form.get('password')!.dirty || this.form.get('password')!.touched);
    }

    get passwordLength() {
        let password = this.form.get('password')!.value;
        return this.form.get('password')!.touched && (password.length < 8 || password.length > 32); 
    }

    /**
     * Login Form Initialization
     */
    public createForm() {
        this.form = this._formBuilder.group({
            name: ['', [Validators.required, Validators.pattern("[a-zA-ZÀ-ÿ ]+")]],
            last_name: ['', [Validators.required, Validators.pattern("[a-zA-ZÀ-ÿ ]+")]],
            email: ['', [Validators.required, Validators.pattern("[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$")]],
            password: ['', [Validators.required, Validators.pattern(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+/), Validators.minLength(8), Validators.maxLength(32)]],
            confirmPassword: ['', Validators.required]
        }, {validators: [this.passwordMatchValidator]} as AbstractControlOptions);
    }

    /**
     * Form Client Information 
     */
    public onSubmit() { 
        // Change spinner
        this.spinner = true;

        // Launch request
        this._authService.register(this.form.value)
        .subscribe({
            next: ( registerResponse : RegisterResponse) => {
                
            localStorage.setItem('user_token', registerResponse.data.token);
            localStorage.setItem('user', JSON.stringify( registerResponse.data.user));
            localStorage.setItem('role', registerResponse.data.role);
            localStorage.setItem('profile', JSON.stringify( registerResponse.data.profile));

            Swal.fire({
                icon: 'success',
                title: 'Bienvenido ' + registerResponse.data.profile.name,
                text: 'Registro exitoso, este es tu perfil en bmwvecsahidalgo.com',
                showConfirmButton: true,
                confirmButtonColor: '#EEB838',
                timer: 3500
            });

            this._router.navigateByUrl('/auth/mi-cuenta');

            }, 
            error: () => {

                Swal.fire({
                    icon: 'error',
                    title: 'Oupps..',
                    text: 'Al parecer ocurrio un error al registrar su cuenta, verifique y vuelva a intentarlo.',
                    showConfirmButton: true,
                    confirmButtonColor: '#EEB838',
                    timer: 3500
                });

                this.spinner = false;
            }
        });
    }

    /**
     * Checking length input   
     * @param object any input
     */
    public maxLengthCheck(object: any) {   
        if (object.value.length > object.maxLength) {
        object.value = object.value.slice(0, object.maxLength)
        }
    }

    /**
     * Helper function to convert text String to Uppercase
     * @param event keyup
     * @returns string
     */
    public convertMayus(event: any): string {
        return event.target.value = event.target.value.toUpperCase();
    }

    passwordMatchValidator(formGroup: UntypedFormGroup) {
        return formGroup.get('password')!.value === formGroup.get('confirmPassword')!.value ? null : { mismatch: true };
    }
}
