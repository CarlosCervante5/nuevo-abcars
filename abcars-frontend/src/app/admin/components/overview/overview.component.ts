import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
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
    standalone: false,
    encapsulation: ViewEncapsulation.None
})

export class OverviewComponent implements OnInit {

    // Input get information overview
    @Input() overview?: Overview;
    @Input() url_index?: String;
    @Input() hideModules: boolean = false; // Para ocultar la sección "Mis Modulos"
    @Input() referralLink?: string; // Link de referido para mostrar junto al título (sellers)
    @Input() referralStats: { total_referrals: number; month_referrals: number; converted_referrals: number } | null = null;
    @Input() statsLoading: boolean = false;

    // References    
    public image_path: string = '';
    public name: string = '';
    public email: string = '';
    public role: string = '';
    public mobileMenuOpen: boolean = false;
    public currentYear: number = new Date().getFullYear();

    get isSellerDashboard(): boolean {
        const role = this.overview?.user?.role;
        return (role === 'Vendedor' || role === 'Seller Dashboard') && !this.hideModules && !!this.overview?.pages?.length;
    }

    get isAdminDashboard(): boolean {
        const role = this.overview?.user?.role;
        return (role === 'Admin' || role === 'Super Admin') && !this.hideModules && !!this.overview?.pages?.length;
    }

    /** Usa las tarjetas modernas (Mis Módulos) con ícono por color y enlace "VER MÁS" con flecha para Admin, Seller y Marketing. */
    get useModuleCardsLayout(): boolean {
        const role = this.overview?.user?.role;
        return (role === 'Admin' || role === 'Super Admin' || role === 'Marketing' || role === 'Vendedor' || role === 'Seller Dashboard')
            && !this.hideModules && !!this.overview?.pages?.length;
    }

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

    public toggleMobileMenu() {
        this.mobileMenuOpen = !this.mobileMenuOpen;
    }

    public closeMobileMenu() {
        this.mobileMenuOpen = false;
    }

    copyReferralLink(): void {
        if (this.referralLink) {
            navigator.clipboard.writeText(this.referralLink).then(() => {
                const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, timerProgressBar: true });
                Toast.fire({ icon: 'success', title: 'Link copiado' });
            });
        }
    }

    openExternal(url: string): void {
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
    }

    shareWhatsApp(): void {
        if (this.referralLink) {
            const message = `¡Hola! Te comparto el catálogo de vehículos de ABCars. Encuentra tu próximo auto aquí: ${this.referralLink}`;
            const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');
        }
    }
}