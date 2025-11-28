import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

// Animations
import Swal from 'sweetalert2';

// Services
import { AuthService } from '../../services/auth.service'; 

// Interfaces
import { LoginResponse } from '../../../shared/interfaces/auth.interface';

// Components
import { DarkNavComponent } from '../../../shared/components/dark-nav/dark-nav.component';
import { ModernFooterComponent } from '../../../shared/components/modern-footer/modern-footer.component';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styles: [`
    /* Estilos personalizados para el login */
    .login-container {
      min-height: 100vh;
    }
  `],
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, DarkNavComponent, ModernFooterComponent]
})

export class LoginComponent implements OnInit {

    // References of Help
    public hide: boolean = true;
    public spinner: boolean = false;  

    // Form References
    public form!: UntypedFormGroup;

    constructor(
        private _authService: AuthService,
        private _formBuilder: UntypedFormBuilder, 
        private _router: Router,
        private titleService: Title
    ) { 
        // Set Title View
        // this.titleService.setTitle('BMW VECSA HIDALGO');
        this.titleService.setTitle('ABcars | Login');

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
    get emailInvalid() {
        return this.form.get('email')!.invalid && (this.form.get('email')!.dirty || this.form.get('email')!.touched);
    }
  
    get passwordInvalid() {
        return this.form.get('password')!.invalid && this.form.get('password')!.dirty;
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
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(32)]]  
        });
    }

    /**
     * Form Client Information
     */
    public onSubmit() {
        if (this.form.invalid) {
            return;
        }
        
        // Change spinner
        this.spinner = true;

        // Launch request
        this._authService.login(this.form)
        .subscribe({
            next: ( loginResponse : LoginResponse) => {
                // Usar el AuthStateService para manejar el estado
                this._authService.setAuthState(
                    loginResponse.data.token,
                    loginResponse.data.user,
                    loginResponse.data.role
                );
                
                // Guardar el perfil por separado
                localStorage.setItem('profile', JSON.stringify( loginResponse.data.profile));

                // Lista de roles válidos con vistas
                const validRoles = [
                    'client', 'administrator', 'marketing', 'blog_manager', 
                    'gestor', 'receptionist', 'valuator', 'technician', 
                    'appointment_manager', 'bodywork_paint_technician', 
                    'spare_parts', 'valuation_manager'
                ];

                if( loginResponse.data.role === 'client') {
                    this._router.navigateByUrl('/auth/mi-cuenta');
                } else if (validRoles.includes(loginResponse.data.role)) {
                    this._router.navigateByUrl(`/admin/${loginResponse.data.role}`);
                } else {
                    // Rol no válido - mostrar error y logout
                    Swal.fire({
                        icon: 'error',
                        title: 'Rol no válido',
                        text: `El rol '${loginResponse.data.role}' no tiene una vista asignada. Contacte al administrador.`,
                        showConfirmButton: true,
                        confirmButtonColor: '#EEB838'
                    }).then(() => {
                        this._authService.clearAuthState();
                        this._router.navigateByUrl('/auth/iniciar-sesion');
                    });
                }

                this.spinner = false;
            },
            error: (error) => {
                Swal.fire({
                    icon: 'error',
                    title: 'Oupps..',
                    text: 'Al parecer ocurrio un error al autenticar su cuenta, verifique y vuelva a intentarlo.',
                    showConfirmButton: true,
                    confirmButtonColor: '#EEB838',
                    timer: 3500
                });

                this.spinner = false;
            }
        });
    }

}
