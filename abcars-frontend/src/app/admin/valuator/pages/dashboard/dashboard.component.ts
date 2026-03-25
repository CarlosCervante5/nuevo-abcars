import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Overview } from '@interfaces/admin.interfaces';
import { ReferralService } from '@services/referral.service';

@Component({
    selector: 'app-dashboard',
    // standalone: true,
    // imports: [
    //     CommonModule,
    // ],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css'],
    standalone: false
})
export class DashboardComponent {

    private user = JSON.parse(localStorage.getItem('user')!);

    constructor(private referralService: ReferralService) {}
    private role = localStorage.getItem('role') || '';

    public get baseUrl(): string {
        return this.role === 'seller' ? '/admin/seller' : '/admin/valuator';
    }

    public get referralLink(): string | undefined {
        if (this.role !== 'seller' || !this.user?.uuid) return undefined;
        return this.referralService.buildInventoryReferralUrl(this.user.uuid);
    }

    public itemOverview: Overview = {
        user: {
            name: this.user.name,
            surname: this.user.surname,
            role: this.role === 'seller' ? 'Seller Dashboard' : 'Valuator',
            email: this.user.email,
            picturepath: ''
        },
        pages: this.role === 'seller'
            ? [
                {
                    title: 'Inventario',
                    icon: 'fi fi-rr-folder',
                    permalink: '/admin/seller/inventory',
                    description: 'Gestiona tu catálogo de vehículos, sube nuevas fotos y actualiza precios.',
                    iconColor: 'blue'
                },
                {
                    title: 'Mis referidos',
                    icon: 'fi fi-rr-users-alt',
                    permalink: '/admin/appointment_manager/assing-valuations',
                    description: 'Consulta el estado de tus clientes referidos y el progreso de sus ventas.',
                    iconColor: 'purple'
                },
                {
                    title: 'Citas de valuación',
                    icon: 'fi fi-rr-calendar-check',
                    permalink: '/admin/seller/appointment',
                    description: 'Revisa el calendario de próximas citas para inspecciones físicas.',
                    iconColor: 'green'
                }
            ]
            : [
                {
                    title: 'Citas valuación',
                    icon: 'fi fi-rr-car',
                    permalink: '/admin/valuator/appointment'
                }
            ]
    };
}
