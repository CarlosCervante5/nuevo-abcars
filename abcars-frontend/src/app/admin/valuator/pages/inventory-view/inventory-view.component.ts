import { Component } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { reload } from '@helpers/session.helper';
import Swal from 'sweetalert2';
import { environment } from '@environments/environment';

import { VehicleService } from '@services/vehicle.service';
import { Vehicle, SearchResponse } from '@interfaces/vehicle_data.interface';
import { Overview } from '@interfaces/admin.interfaces';
import { ReferralService } from '@services/referral.service';

@Component({
    selector: 'app-inventory-view',
    templateUrl: './inventory-view.component.html',
    styleUrls: ['./inventory-view.component.css'],
    standalone: false
})
export class InventoryViewComponent {
    public length: number = 0;
    public pageSize: number = 12;
    public pageSizeOptions: number[] = [15, 30, 45, 60, 150];
    pageEvent!: PageEvent;

    public vehicles: Vehicle[] = [];
    public palabra_busqueda: string = '';
    public relationship_names: string[] = ['brand', 'line', 'model', 'version', 'body', 'dealership', 'specification', 'firstImage', 'images'];
    public pageIndex: number = 1;

    public itemOverview: Overview;
    public dataSource!: MatTableDataSource<Vehicle>;
    public displayedColumns: string[] = ['status', 'nameVehicle', 'vin', 'km', 'price', 'image', 'actions'];
    public showShareColumn: boolean = false;
    public currentYear: number = new Date().getFullYear();

    private role = localStorage.getItem('role') || '';

    get baseUrl(): string {
        return this.role === 'seller' ? '/admin/seller' : '/admin/valuator';
    }

    constructor(
        private _vehicleService: VehicleService,
        private _router: Router,
        private _referralService: ReferralService
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
                    {
                        title: 'Inventario',
                        icon: 'fi fi-rr-car-garage',
                        permalink: base + '/inventory'
                    },
                    {
                        title: 'Citas de valuación',
                        icon: 'fi fi-rr-calendar',
                        permalink: base + '/appointment'
                    }
                ]
            };
        } catch {
            this.itemOverview = {
                user: {
                    name: 'Usuario',
                    surname: '',
                    role: roleLabel,
                    email: '',
                    picturepath: ''
                },
                pages: [
                    {
                        title: 'Inventario',
                        icon: 'fi fi-rr-car-garage',
                        permalink: base + '/inventory'
                    },
                    {
                        title: 'Citas de valuación',
                        icon: 'fi fi-rr-calendar',
                        permalink: base + '/appointment'
                    }
                ]
            };
        }

        this.dataSource = new MatTableDataSource<Vehicle>([]);
        this.showShareColumn = this.role === 'seller';
        this.getVehicles(1);
    }

    copyVehicleReferralLink(vehicle: Vehicle, event: Event): void {
        event.stopPropagation();
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const uuid = user?.uuid;
        if (!uuid) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo obtener tu identificador.' });
            return;
        }
        const url = this._referralService.buildVehicleReferralUrl(vehicle.uuid, uuid);
        navigator.clipboard.writeText(url).then(() => {
            const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, timerProgressBar: true });
            Toast.fire({ icon: 'success', title: 'Link copiado' });
        });
    }

    shareVehicleWhatsApp(vehicle: Vehicle, event: Event): void {
        event.stopPropagation();
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const uuid = user?.uuid;
        if (!uuid) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo obtener tu identificador.' });
            return;
        }
        const vehicleUrl = this._referralService.buildVehicleReferralUrl(vehicle.uuid, uuid);
        const vehicleName = vehicle.name || 'este vehículo';
        const message = `¡Hola! Te comparto ${vehicleName} de ABCars. Míralo aquí: ${vehicleUrl}`;
        const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
    }

    public getVehicles(page: number) {
        this._vehicleService.getVehicles(page, this.palabra_busqueda, this.pageSize, this.relationship_names)
            .subscribe({
                next: (response: SearchResponse) => {
                    this.vehicles = response.data.data;
                    this.dataSource = new MatTableDataSource(this.vehicles);
                    this.length = response.data.total;
                },
                error: (error: unknown) => {
                    reload(error, this._router);
                }
            });
    }

    public paginationChange(pageEvent: PageEvent) {
        this.pageEvent = pageEvent;
        this.pageSize = this.pageEvent.pageSize;
        this.pageIndex = this.pageEvent.pageIndex + 1;
        this.getVehicles(this.pageIndex);
    }

    public image(primera_imagen: string | null | undefined): string {
        return primera_imagen || 'assets/images/demo_image.png';
    }

    viewDetail(vehicle: Vehicle): void {
        this._router.navigate([this.baseUrl, 'inventory', vehicle.uuid]);
    }

    downloadPhotos(vehicle: Vehicle, event: Event): void {
        event.stopPropagation();

        const imageUrls: string[] = [];
        if (vehicle.images?.length) {
            vehicle.images.forEach(img => {
                const url = img.service_image_url?.startsWith('http') ? img.service_image_url : `${environment.baseUrl}${img.service_image_url?.startsWith('/') ? '' : '/'}${img.service_image_url}`;
                if (url) imageUrls.push(url);
            });
        } else if (vehicle.first_image?.service_image_url) {
            const url = vehicle.first_image.service_image_url.startsWith('http') ? vehicle.first_image.service_image_url : `${environment.baseUrl}${vehicle.first_image.service_image_url.startsWith('/') ? '' : '/'}${vehicle.first_image.service_image_url}`;
            imageUrls.push(url);
        }

        if (imageUrls.length === 0) {
            Swal.fire({
                icon: 'info',
                title: 'Sin imágenes',
                text: 'Esta unidad no tiene fotos disponibles para descargar.',
                confirmButtonColor: '#EEB838'
            });
            return;
        }

        const safeName = (vehicle.name || vehicle.vin || 'unidad').replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 30);
        let downloaded = 0;

        const downloadNext = (index: number) => {
            if (index >= imageUrls.length) {
                Swal.fire({
                    icon: 'success',
                    title: 'Descarga completada',
                    text: `Se descargaron ${downloaded} foto(s) de ${safeName}`,
                    confirmButtonColor: '#EEB838',
                    timer: 2500
                });
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

        Swal.fire({
            icon: 'info',
            title: 'Descargando fotos...',
            text: `Preparando ${imageUrls.length} imagen(es)`,
            allowOutsideClick: false,
            timer: 1500,
            showConfirmButton: false
        });

        setTimeout(() => downloadNext(0), 500);
    }
}
