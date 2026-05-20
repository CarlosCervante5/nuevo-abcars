import { Component, Optional, type OnInit } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { Router } from '@angular/router';
import { CompraTuAutoService } from '@services/compra-tu-auto.service';
import { LoadBannerImageService } from '@services/load-banner-image.service';
import { MainBannerVariant } from '@interfaces/loadMainBanner.interfaces';
import Swal from 'sweetalert2';

interface Result {
  reload: boolean;
}

@Component({
  selector: 'app-main-banner',
  templateUrl: './main-banner.component.html',
  styleUrl: './main-banner.component.css',
  standalone: false,
})
export class MainBannerComponent implements OnInit {
  desktopFile: File | null = null;
  mobileFile: File | null = null;
  desktopDisabled = true;
  mobileDisabled = true;
  desktopLoading = false;
  mobileLoading = false;

  previewDesktop: string | null = null;
  previewMobile: string | null = null;

  result: Result = { reload: false };

  get isInBottomSheet(): boolean {
    return this._bottomSheetRef != null;
  }

  constructor(
    @Optional() private _bottomSheetRef: MatBottomSheetRef<MainBannerComponent> | null,
    private _loadBannerService: LoadBannerImageService,
    private _compraTuAutoService: CompraTuAutoService,
    private _router: Router,
  ) {}

  ngOnInit(): void {
    this.loadCurrentBanners();
  }

  loadCurrentBanners(): void {
    this._compraTuAutoService.loadMainBanner('Imagen banner principal').subscribe({
      next: (resp) => {
        const d = (resp?.data?.image_path_desktop || resp?.data?.image_path || '').trim();
        const m = (resp?.data?.image_path_mobile || '').trim();
        this.previewDesktop = d || null;
        this.previewMobile = m || null;
      },
      error: () => {
        this.previewDesktop = null;
        this.previewMobile = null;
      },
    });
  }

  assignImage(event: Event, variant: MainBannerVariant): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList = element.files;
    if (!fileList?.length) {
      return;
    }
    const file = fileList[0];
    if (variant === 'desktop') {
      this.desktopFile = file;
      this.desktopDisabled = false;
    } else {
      this.mobileFile = file;
      this.mobileDisabled = false;
    }
  }

  upload(variant: MainBannerVariant): void {
    const file = variant === 'desktop' ? this.desktopFile : this.mobileFile;
    if (!file) {
      return;
    }

    if (variant === 'desktop') {
      this.desktopLoading = true;
      this.desktopDisabled = true;
    } else {
      this.mobileLoading = true;
      this.mobileDisabled = true;
    }

    this._loadBannerService.setBannerImage([file], variant).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Listo',
          text:
            variant === 'mobile'
              ? 'Banner móvil del inicio actualizado.'
              : 'Banner escritorio del inicio actualizado.',
          confirmButtonColor: '#008bcc',
          timer: 3500,
        });
        if (variant === 'desktop') {
          this.desktopFile = null;
          this.desktopLoading = false;
          this.desktopDisabled = true;
        } else {
          this.mobileFile = null;
          this.mobileLoading = false;
          this.mobileDisabled = true;
        }
        this.loadCurrentBanners();
        this._bottomSheetRef?.dismiss(this.result);
      },
      error: (err) => {
        if (variant === 'desktop') {
          this.desktopLoading = false;
          this.desktopDisabled = !this.desktopFile;
        } else {
          this.mobileLoading = false;
          this.mobileDisabled = !this.mobileFile;
        }
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err?.error?.message || 'No se pudo subir la imagen.',
        });
        this._bottomSheetRef?.dismiss(this.result);
      },
    });
  }

  close(): void {
    this._bottomSheetRef?.dismiss(this.result);
  }

  goToPanel(): void {
    void this._router.navigate(['/admin/administrator']);
  }
}
