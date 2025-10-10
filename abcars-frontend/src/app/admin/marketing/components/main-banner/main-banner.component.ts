import { Component, type OnInit } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { LoadBannerImageService } from '@services/load-banner-image.service';
import { OverviewComponent } from 'src/app/admin/components/overview/overview.component';
import Swal from 'sweetalert2';

interface Result {
  reload: boolean;
}
@Component({
  selector: 'app-main-banner',
  // imports: [],
  templateUrl: './main-banner.component.html',
  styleUrl: './main-banner.component.css',
  standalone: false
})
export class MainBannerComponent implements OnInit {
  files:File[] = [];
  disabled: Boolean = true;
  loading: Boolean = false;
  result: Result = {
    reload: false
  }

  constructor(
    private _bottomSheetRef: MatBottomSheetRef<OverviewComponent>,
    private _loadBannerService:LoadBannerImageService
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
    
    this._loadBannerService.setBannerImage(this.files)
    .subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Carga de imagenes de manera correcta',
          showConfirmButton: true,
          confirmButtonColor: '#008bcc',
          timer: 3500
        });
        this.loading = false;
        this._bottomSheetRef.dismiss(this.result);
      },
      error: (err) => {
        console.log('Hubo un error', err);
        this.loading = false;
        this._bottomSheetRef.dismiss(this.result);
      }
    });
    
  }

  close() {
    this._bottomSheetRef.dismiss(this.result);
  }

}
