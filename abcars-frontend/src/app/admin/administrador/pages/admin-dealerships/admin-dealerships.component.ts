import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService } from '@services/admin.service';
import { Dealership, DealerShipResponse, DealershipServiceType } from '@interfaces/admin.interfaces';
import { dealershipServiceTypeLabel } from 'src/app/shared/utils/public-dealerships';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-dealerships',
  templateUrl: './admin-dealerships.component.html',
  styleUrls: ['./admin-dealerships.component.css'],
  standalone: false
})
export class AdminDealershipsComponent implements OnInit {
  dealerships: Dealership[] = [];
  loading = true;
  editingId: number | null = null;
  formData: Partial<Dealership> = {};
  isCreating = false;
  /** Si la URL trae ?edit=id, abrir el formulario al cargar el listado (p. ej. desde «Ubicaciones»). */
  private pendingEditId: number | null = null;

  constructor(
    private adminService: AdminService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const raw = this.route.snapshot.queryParamMap.get('edit');
    if (raw != null && raw !== '') {
      const n = Number(raw);
      this.pendingEditId = Number.isFinite(n) ? n : null;
    }
    this.loadDealerships();
  }

  loadDealerships(): void {
    this.loading = true;
    this.adminService.getDealershipsList().subscribe({
      next: (res: DealerShipResponse) => {
        this.dealerships = res.data || [];
        this.loading = false;
        this.tryOpenPendingEditFromQuery();
      },
      error: () => {
        this.loading = false;
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar las sucursales.' });
      }
    });
  }

  startCreate(): void {
    this.isCreating = true;
    this.editingId = null;
    this.formData = {
      name: '',
      location: '',
      service_type: 'venta',
      description: '',
      address: '',
      latitude: null,
      longitude: null
    };
  }

  startEdit(d: Dealership): void {
    this.isCreating = false;
    this.editingId = d.id ?? null;
    const st: DealershipServiceType =
      d.service_type === 'servicios' ? 'servicios' : 'venta';
    this.formData = { ...d, service_type: st };
  }

  private tryOpenPendingEditFromQuery(): void {
    if (this.pendingEditId == null) {
      return;
    }
    const d = this.dealerships.find((x) => x.id === this.pendingEditId);
    this.pendingEditId = null;
    if (d) {
      this.startEdit(d);
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { edit: null },
        queryParamsHandling: 'merge',
        replaceUrl: true
      });
    }
  }

  cancelForm(): void {
    this.editingId = null;
    this.isCreating = false;
    this.formData = {};
  }

  save(): void {
    if (!this.formData.name?.trim() || !this.formData.location?.trim()) {
      Swal.fire({ icon: 'warning', title: 'Campos requeridos', text: 'Nombre y ubicación son obligatorios.' });
      return;
    }
    const lat = this.formData.latitude != null ? Number(this.formData.latitude) : null;
    const lng = this.formData.longitude != null ? Number(this.formData.longitude) : null;
    if (lat != null && (lat < -90 || lat > 90)) {
      Swal.fire({ icon: 'warning', title: 'Latitud inválida', text: 'La latitud debe estar entre -90 y 90.' });
      return;
    }
    if (lng != null && (lng < -180 || lng > 180)) {
      Swal.fire({ icon: 'warning', title: 'Longitud inválida', text: 'La longitud debe estar entre -180 y 180. En México usa valores negativos (ej: -99.13).' });
      return;
    }
    const serviceType: DealershipServiceType =
      this.formData.service_type === 'servicios' ? 'servicios' : 'venta';
    const payload: Partial<Dealership> = {
      name: this.formData.name!.trim(),
      location: this.formData.location!.trim(),
      service_type: serviceType,
      description: this.formData.description?.trim() || null,
      address: this.formData.address?.trim() || null,
      latitude: lat,
      longitude: lng
    };
    if (this.isCreating) {
      this.adminService.createDealership(payload).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Sucursal creada' });
          this.cancelForm();
          this.loadDealerships();
        },
        error: (err) => this.showError(err, 'crear')
      });
    } else if (this.editingId) {
      this.adminService.updateDealership(this.editingId, payload).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Sucursal actualizada' });
          this.cancelForm();
          this.loadDealerships();
        },
        error: (err) => this.showError(err, 'actualizar')
      });
    }
  }

  deleteDealership(d: Dealership): void {
    if (!d.id) return;
    Swal.fire({
      title: '¿Eliminar sucursal?',
      text: `Se eliminará "${d.name}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService.deleteDealership(d.id!).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Sucursal eliminada' });
            this.loadDealerships();
          },
          error: (err) => Swal.fire({ icon: 'error', title: 'Error', text: err?.error?.message || 'Error al eliminar.' })
        });
      }
    });
  }

  openInMaps(d: Dealership): void {
    if (d.latitude != null && d.longitude != null) {
      window.open(`https://www.google.com/maps?q=${d.latitude},${d.longitude}`, '_blank');
    } else if (d.address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.address)}`, '_blank');
    } else {
      const q = encodeURIComponent(`${d.name} ${d.location}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
    }
  }

  capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  serviceTypeLabel(t: Dealership['service_type']): string {
    return dealershipServiceTypeLabel(t);
  }

  private showError(err: any, action: string): void {
    const msg = err?.error?.message;
    const errors = err?.error?.errors;
    const text = msg || (errors ? Object.values(errors).flat().join(' ') : `Error al ${action}.`);
    Swal.fire({ icon: 'error', title: 'Error', text });
  }
}
