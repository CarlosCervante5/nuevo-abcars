import { Component, Optional, type OnInit } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { Router } from '@angular/router';
import { LoadBannerImageService } from '@services/load-banner-image.service';
import Swal from 'sweetalert2';

interface Result {
  reload: boolean;
}
@Component({
  selector: 'app-main-banner',
  templateUrl: './main-banner.component.html',
  styleUrl: './main-banner.component.css',
  standalone: false
})
export class MainBannerComponent implements OnInit {
  files: File[] = [];
  disabled: Boolean = true;
  loading: Boolean = false;
  result: Result = {
    reload: false
  };

  /** true cuando se abrió desde MatBottomSheet (marketing). */
  get isInBottomSheet(): boolean {
    return this._bottomSheetRef != null;
  }

  constructor(
    @Optional() private _bottomSheetRef: MatBottomSheetRef<MainBannerComponent> | null,
    private _loadBannerService: LoadBannerImageService,
    private _router: Router
  ) {}

  ngOnInit(): void { }

  assignImage( event: Event) {
    const element = event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;
    if (fileList) {
      this.files = Array.from(fileList);
      if (this.files.length > 0) {
        this.disabled = false;
      }else{
        this.disabled = true;
      }
    }
  }

  uploadImages(){
    this.disabled = true;
    this.loading = true;
    // Swal.fire({
    //   title: 'Procesando...',
    //   allowOutsideClick: false
    // });
    // const formData = new FormData();
    // formData.append('image', this.files[0]);
    
    this._loadBannerService.setBannerImage(this.files).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Listo',
          text: 'El banner del inicio se actualizó correctamente.',
          showConfirmButton: true,
          confirmButtonColor: '#008bcc',
          timer: 3500
        });
        this.loading = false;
        this.files = [];
        this.disabled = true;
        this._bottomSheetRef?.dismiss(this.result);
      },
      error: (err) => {
        console.log('Hubo un error', err);
        this.loading = false;
        this.disabled = this.files.length === 0;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err?.error?.message || 'No se pudo subir la imagen.'
        });
        this._bottomSheetRef?.dismiss(this.result);
      }
    });
    
  }

  close() {
    this._bottomSheetRef?.dismiss(this.result);
  }

  goToPanel() {
    void this._router.navigate(['/admin/administrator']);
  }
}
