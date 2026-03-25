import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { reload } from '@helpers/session.helper';
import Swal from 'sweetalert2';
import { environment } from '@environments/environment';

import { VehicleService } from '@services/vehicle.service';
import { UpdateVehicle, FullDetailResponse } from '@interfaces/vehicle_data.interface';
import { Overview } from '@interfaces/admin.interfaces';

@Component({
    selector: 'app-vehicle-detail-view',
    templateUrl: './vehicle-detail-view.component.html',
    styleUrls: ['./vehicle-detail-view.component.css'],
    standalone: false
})
export class VehicleDetailViewComponent implements OnInit {
    public vehicle: UpdateVehicle | null = null;
    public loading = true;
    public itemOverview: Overview;
    public currentYear: number = new Date().getFullYear();

    private role = localStorage.getItem('role') || '';
    private uuid = '';

    get baseUrl(): string {
        return this.role === 'seller' ? '/admin/seller' : '/admin/valuator';
    }

    constructor(
        private _route: ActivatedRoute,
        private _router: Router,
        private _vehicleService: VehicleService
    ) {
        const base = this.role === 'seller' ? '/admin/seller' : '/admin/valuator';
        const roleLabel = this.role === 'seller' ? 'Vendedor' : 'Valuator';

        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            this.itemOverview = {
                user: {
                    name: user.name || user.nickname || 'Usuario',
                    surname: user.surname || '',
                    role: roleLabel,
                    email: user.email || '',
                    picturepath: ''
                },
                pages: [
                    { title: 'Inventario', icon: 'fi fi-rr-car-garage', permalink: base + '/inventory' },
                    { title: 'Citas de valuación', icon: 'fi fi-rr-calendar', permalink: base + '/appointment' }
                ]
            };
        } catch {
            this.itemOverview = {
                user: { name: 'Usuario', surname: '', role: roleLabel, email: '', picturepath: '' },
                pages: [
                    { title: 'Inventario', icon: 'fi fi-rr-car-garage', permalink: base + '/inventory' },
                    { title: 'Citas de valuación', icon: 'fi fi-rr-calendar', permalink: base + '/appointment' }
                ]
            };
        }
    }

    ngOnInit(): void {
        this.uuid = this._route.snapshot.paramMap.get('uuid') || '';
        if (this.uuid) {
            this.loadVehicle();
        } else {
            this.loading = false;
            this._router.navigate([this.baseUrl, 'inventory']);
        }
    }

    loadVehicle(): void {
        this._vehicleService.getVehicle(this.uuid).subscribe({
            next: (res: FullDetailResponse) => {
                this.vehicle = res.data;
                this.loading = false;
            },
            error: (err: unknown) => {
                reload(err, this._router);
                this.loading = false;
            }
        });
    }

    image(url: string | null | undefined): string {
        return url || 'assets/images/demo_image.png';
    }

    getStatusLabel(status: string): string {
        const map: Record<string, string> = {
            active: 'Activo',
            inactive: 'Inactivo',
            sale: 'Vendido'
        };
        return map[status] || status;
    }

    getTypeLabel(type: string): string {
        const map: Record<string, string> = {
            car: 'Auto',
            moto: 'Motocicleta',
            truck: 'Camión',
            other: 'Otro'
        };
        return map[type] || type;
    }

    getCategoryLabel(cat: string): string {
        const map: Record<string, string> = {
            new: 'Nuevo',
            pre_owned: 'Seminuevo',
            demo: 'Demo'
        };
        return map[cat] || cat;
    }

    getTransmissionLabel(t: string): string {
        const map: Record<string, string> = {
            automatic: 'Automático',
            manual: 'Manual',
            semiautomatic: 'Semi-automática',
            cvt: 'CVT',
            triptronic: 'Triptronic',
            'dual-clutch': 'Dual-clutch'
        };
        return map[t] || t;
    }

    getFuelLabel(f: string): string {
        const map: Record<string, string> = {
            gasoline: 'Gasolina',
            diesel: 'Diesel',
            electric: 'Eléctrico',
            hybrid: 'Híbrido',
            hydrogen: 'Hidrógeno',
            natural_gas: 'Gas Natural'
        };
        return map[f] || f;
    }

    downloadPhotos(event: Event): void {
        event.preventDefault();
        if (!this.vehicle) return;

        const imageUrls: string[] = [];
        if (this.vehicle.images?.length) {
            this.vehicle.images.forEach(img => {
                const url = img.service_image_url?.startsWith('http') ? img.service_image_url : `${environment.baseUrl}${img.service_image_url?.startsWith('/') ? '' : '/'}${img.service_image_url}`;
                if (url) imageUrls.push(url);
            });
        } else if (this.vehicle.first_image?.service_image_url) {
            const url = this.vehicle.first_image.service_image_url.startsWith('http') ? this.vehicle.first_image.service_image_url : `${environment.baseUrl}${this.vehicle.first_image.service_image_url.startsWith('/') ? '' : '/'}${this.vehicle.first_image.service_image_url}`;
            imageUrls.push(url);
        }

        if (imageUrls.length === 0) {
            Swal.fire({ icon: 'info', title: 'Sin imágenes', text: 'Esta unidad no tiene fotos disponibles.', confirmButtonColor: '#EEB838' });
            return;
        }

        const safeName = (this.vehicle.name || this.vehicle.vin || 'unidad').replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 30);
        let downloaded = 0;

        const downloadNext = (index: number) => {
            if (index >= imageUrls.length) {
                Swal.fire({ icon: 'success', title: 'Descarga completada', text: `Se descargaron ${downloaded} foto(s)`, confirmButtonColor: '#EEB838', timer: 2500 });
                return;
            }
            const url = imageUrls[index];
            fetch(url, { mode: 'cors' })
                .then(res => res.blob())
                .then(blob => {
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = `${safeName}_${index + 1}.jpg`;
                    a.click();
                    URL.revokeObjectURL(a.href);
                    downloaded++;
                    setTimeout(() => downloadNext(index + 1), 300);
                })
                .catch(() => {
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${safeName}_${index + 1}.jpg`;
                    a.target = '_blank';
                    a.click();
                    downloaded++;
                    setTimeout(() => downloadNext(index + 1), 300);
                });
        };
        downloadNext(0);
    }
}
