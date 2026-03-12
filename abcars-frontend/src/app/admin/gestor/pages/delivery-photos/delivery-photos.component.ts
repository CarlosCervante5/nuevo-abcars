import { Component, OnInit } from '@angular/core';
import { DeliveryPhotosService, DeliveryPhoto } from '@services/delivery-photos.service';
import { Overview } from '@interfaces/admin.interfaces';
import { MatSnackBar } from '@angular/material/snack-bar';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-delivery-photos',
  templateUrl: './delivery-photos.component.html',
  styleUrls: ['./delivery-photos.component.css'],
  standalone: false
})
export class DeliveryPhotosComponent implements OnInit {
  itemOverview: Overview;
  photos: DeliveryPhoto[] = [];
  loading = false;
  uploading = false;
  currentPage = 1;
  lastPage = 1;
  totalPhotos = 0;
  readonly perPage = 10;

  selectedFile: File | null = null;
  caption = '';
  sortOrder: number | null = null;

  constructor(
    private deliveryPhotosService: DeliveryPhotosService,
    private snackBar: MatSnackBar
  ) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.itemOverview = {
      user: {
        name: user.name || user.nickname || 'Usuario',
        surname: user.surname || '',
        role: 'Gestor de marketing',
        email: user.email || '',
        picturepath: ''
      },
      pages: [
        { title: 'Promociones', icon: 'fi fi-rr-car', permalink: '/admin/gestor/promotions' },
        { title: 'Fotos de entregas', icon: 'fi fi-rr-gift', permalink: '/admin/gestor/delivery-photos' }
      ]
    };
  }

  ngOnInit() {
    this.loadPhotos();
  }

  loadPhotos(page = 1) {
    this.loading = true;
    this.deliveryPhotosService.list(page, this.perPage).subscribe({
      next: (resp) => {
        const d = resp?.data;
        if (d && Array.isArray(d.data)) {
          this.photos = d.data;
          this.currentPage = d.current_page ?? 1;
          this.lastPage = d.last_page ?? 1;
          this.totalPhotos = d.total ?? 0;
        } else {
          this.photos = [];
        }
        this.loading = false;
      },
      error: () => {
        this.photos = [];
        this.loading = false;
        this.snackBar.open('Error al cargar las fotos', 'Cerrar', { duration: 3000 });
      }
    });
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.loadPhotos(this.currentPage - 1);
    }
  }

  nextPage() {
    if (this.currentPage < this.lastPage) {
      this.loadPhotos(this.currentPage + 1);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file && file.type.startsWith('image/')) {
      this.selectedFile = file;
    } else {
      this.selectedFile = null;
      this.snackBar.open('Selecciona una imagen válida (JPEG, PNG, GIF, WebP)', 'Cerrar', { duration: 3000 });
    }
    input.value = '';
  }

  upload() {
    if (!this.selectedFile) {
      this.snackBar.open('Selecciona una imagen', 'Cerrar', { duration: 3000 });
      return;
    }

    this.uploading = true;
    this.deliveryPhotosService.upload(this.selectedFile, this.caption || undefined, this.sortOrder ?? undefined).subscribe({
      next: (resp) => {
        this.uploading = false;
        this.selectedFile = null;
        this.caption = '';
        this.sortOrder = null;
        this.loadPhotos(this.currentPage);
        this.snackBar.open(resp.message || 'Foto subida correctamente', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        this.uploading = false;
        const msg = err?.error?.message || 'Error al subir la foto';
        this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
      }
    });
  }

  deletePhoto(photo: DeliveryPhoto) {
    Swal.fire({
      title: '¿Eliminar foto?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.deliveryPhotosService.delete(photo.uuid).subscribe({
          next: () => {
            const pageToLoad = this.currentPage > 1 && this.photos.length <= 1
              ? this.currentPage - 1
              : this.currentPage;
            this.loadPhotos(pageToLoad);
            this.snackBar.open('Foto eliminada', 'Cerrar', { duration: 3000 });
          },
          error: () => {
            this.snackBar.open('Error al eliminar la foto', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  clearForm() {
    this.selectedFile = null;
    this.caption = '';
    this.sortOrder = null;
  }
}
