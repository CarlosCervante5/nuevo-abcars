import { Component, Input, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

// Services
import { AccountService } from 'src/app/auth/pages/account/services/account.service';
import { AuthService } from 'src/app/auth/services/auth.service';

// Interfaces
import { Overview } from '@interfaces/admin.interfaces';

// SweetAlert2
import Swal from 'sweetalert2';

@Component({
    selector: 'app-overview',
    templateUrl: './overview.component.html',
    styleUrls: ['./overview.component.css'],
    standalone: false
})

export class OverviewComponent implements OnInit {

    // Input get information overview
    @Input() overview?: Overview;
    @Input() url_index?: String;

    // References    
    public image_path: string = '';
    public name: string = '';
    public email: string = '';
    public role: string = '';

    constructor(
        private _accountService: AccountService, 
        private titleService: Title,
        private _authService: AuthService,
        private _router: Router
    ) {}
    
    ngOnInit(): void {   
        this.userSessionStorage()
    }

    private userSessionStorage() {

        const user = JSON.parse(localStorage.getItem('user')!);
        const profile = JSON.parse(localStorage.getItem('profile')!);
            
        this.role = localStorage.getItem('role')!;

        this.name = profile?.name || user?.name || 'Usuario';

        this.image_path = profile?.picture || `assets/icons/profile.svg`;

        this.email = user.email;

        this.titleService.setTitle(`ABCars | ${ this.role }`);
    }

    public logout() {
        Swal.fire({
            title: '¿Estás seguro?',
            text: "¿Deseas cerrar sesión?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, cerrar sesión',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                // Llamar al servicio de logout
                this._authService.logout().subscribe({
                    next: () => {
                        console.log('Logout exitoso');
                    },
                    error: (error) => {
                        console.error('Error en logout:', error);
                    }
                });

                // Limpiar el estado de autenticación
                this._authService.clearAuthState();
                
                // Limpiar otros datos del localStorage
                localStorage.removeItem('profile');
                
                // Mostrar mensaje de éxito
                Swal.fire({
                    title: 'Sesión cerrada',
                    text: 'Has cerrado sesión correctamente',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
                
                // Navegar a la página principal
                this._router.navigate(['/']);
            }
        });
    }
}