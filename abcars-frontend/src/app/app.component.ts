import { Component, DoCheck, ElementRef, ViewChild, OnInit } from '@angular/core';
import { AuthService } from './auth/services/auth.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SessionExpirationService } from './shared/services/session-expiration.service';
import { AnalyticsService } from './shared/services/analytics.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    standalone: false
})

export class AppComponent implements DoCheck, OnInit {

    public auth_user: boolean = false;
    public url_dashboard: string = '/auth/mi-cuenta';
    public spinner: boolean = false;

    // Elements navbar and footer
    @ViewChild('navbarSecondary') navbarSecondary!: ElementRef<HTMLElement>;
    @ViewChild('footer') footer!: ElementRef<HTMLElement>;

    constructor(
        private _router: Router,
        private _authService: AuthService,
        private _sessionExpirationService: SessionExpirationService,
        private _analyticsService: AnalyticsService
    ) {
        this._router.routeReuseStrategy.shouldReuseRoute = () => false;
    }

    ngOnInit(): void {
        this._router.events.pipe(
            filter((e): e is NavigationEnd => e instanceof NavigationEnd)
        ).subscribe((e: NavigationEnd) => {
            this._analyticsService.trackPageView(e.urlAfterRedirects, document.referrer || undefined)
                .subscribe({ error: () => {} });
        });
    }

    // Checking session storage for get token user
    ngDoCheck(): void {
        this.checkSessionStorageUser();
        this.url_dashboard = this.get_url_dashboard();
    }

    /**
     * Check Session Storage for get User and Token information
     */
    public checkSessionStorageUser() {

        this.auth_user = (localStorage.getItem('user_token') && localStorage.getItem('user')) ? true : false;    
    }

    /**
     * Logout
     */
    public logout() {
        
        this._authService.logout()
        .subscribe({
            next: () => {
            
            localStorage.removeItem('user_token');
            localStorage.removeItem('user');
            localStorage.removeItem('role');
            localStorage.removeItem('profile');

            Swal.fire({
                icon: 'success',
                title: 'Hasta luego!',
                text: 'Haz cerrado sesión correctamente.',
                showConfirmButton: true,
                confirmButtonColor: '#EEB838',
                timer: 3500
            });

            this._router.navigate(['/auth/iniciar-sesion']);

            },
            error: () => {

                localStorage.removeItem('user_token');
                localStorage.removeItem('user');
                localStorage.removeItem('role');
                localStorage.removeItem('profile');

                Swal.fire({
                    icon: 'success',
                    title: 'Hasta luego!',
                    text: 'Haz cerrado sesión correctamente.',
                    showConfirmButton: true,
                    confirmButtonColor: '#EEB838',
                    timer: 3500
                });

                this._router.navigate(['/auth/iniciar-sesion']);

                this.spinner = false;
            }
        });
    }

    public get_url_dashboard() {
        
        let role: any = localStorage.getItem('role');
        
        if(role != null){

            if(role === 'client')
                return `/auth/mi-cuenta`

            if(role === 'appraiser_technician')
                return `/admin/tecval`

            if(role === 'spare_parts')
                return `/admin/parts`

            if(role === 'spare_parts_manager')
                return `/admin/pmanager`

            if(role === 'accountant')
                return `/admin/contadora`

            return `/admin/${role}`;
        }

        return `/admin/not-autorized`;

    }

    deleteLS(){
        localStorage.removeItem('vehicle');
    }

}