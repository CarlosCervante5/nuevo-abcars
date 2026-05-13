import { Campaign } from '@interfaces/admin.interfaces';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { AbstractControl, FormControl, FormGroup, UntypedFormBuilder, ValidatorFn, Validators } from '@angular/forms';
import { VehicleService } from '@services/vehicle.service';
import { ImagesService } from '@services/images.service';
import { GeminiVehicleImageService } from '@services/gemini-vehicle-image.service';
import Swal from "sweetalert2";
import { MatChipInputEvent } from '@angular/material/chips';
import { Observable, of, TimeoutError } from 'rxjs';
import { map, startWith, timeout, finalize } from 'rxjs/operators';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

import {UpdateVehicle,  FullDetailResponse, BrandsResponse, Brand, Model, Body, ModelsResponse, VersionsResponse, Version, BodiesResponse, VehicleUpdateResponse, GralResponse, ImageOrder} from '@interfaces/vehicle_data.interface';
import { GetcampaingResponse } from '@interfaces/admin.interfaces';
// import { CampaingService } from 'src/app/admin/gestor/services/campaing.service';
import { AdminService } from '@services/admin.service';

import { suggestBrandsByName } from '@helpers/brand-suggest.helper';
import {reload} from '@helpers/session.helper';
import { Router } from '@angular/router';
import { VehicleGalleryReplaceService } from '@services/vehicle-gallery-replace.service';
import { IntelimotorService } from '@services/intelimotor.service';
import { fetchImageAsFile } from '../../../../shared/utils/fetch-image-as-file';

type ImageRow = ImageOrder & { selected?: boolean };

@Component({
    selector: 'app-update-vehicle',
    templateUrl: './update-vehicle.component.html',
    styleUrls: ['./update-vehicle.component.css'],
    standalone: false
})
export class UpdateVehicleComponent implements OnInit, OnDestroy {
  
  
  public vehicle_uuid: string = '';
  public vehicle!: UpdateVehicle;
  public form!: FormGroup;

  public button: boolean = false;

  /** Pestaña inicial: 0 datos, 1 imágenes (desde accesos rápidos en la tabla). */
  selectedTabIndex = 0;

  imageFiles: File[] = [];
  imageUploadDisabled = true;
  imageUploadLoading = false;
  imageUploadPhase: 'idle' | 'ai' | 'upload' = 'idle';
  processImagesWithAi = false;
  geminiAiConfigured = false;
  imagesForSlider: ImageRow[] = [];
  imagesOrderSaving = false;
  /** Reemplazo por IA en curso (evita doble clic). */
  galleryReplacing = false;
  /** Fila cuyo botón de IA muestra preloader. */
  galleryReplacingIndex: number | null = null;
  imageDropZoneActive = false;
  pendingPreviewUrls: string[] = [];
  /** Si hubo cambios en imágenes sin cerrar, al cerrar se notifica reload al listado. */
  private imagesDirty = false;
  pushingIntelimotorPhotos = false;

  public camps: string[] = [];
  public id_camp: string[] = [];
  public responseCamp: Campaign[] = [];

  brandControl = new FormControl();
  public brands:Brand[] = [];
  filteredBrands: Observable<Brand[]> = of([]);

  campaignControl = new FormControl();
  public campaigns: Campaign[] = [];
  filteredCampaigns: Observable<Campaign[]> = of([]);

  // lineControl = new FormControl();
  // public lines:Line[] = [];
  // filteredLines: Observable<Line[]> = of([]);

  modelControl = new FormControl();
  public models:Model[] = [];
  filteredModels: Observable<Model[]> = of([]);

  versionControl = new FormControl();
  public versions:Version[] = [];
  filteredVersions: Observable<Version[]> = of([]);

  bodyControl = new FormControl();
  public bodies:Body[] = [];
  filteredBodies: Observable<Body[]> = of([]);

  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: { uuid: string; initialTab?: number },
    private _formBuilder: UntypedFormBuilder,
    private _vehicleService:VehicleService,
    private _campaignService:AdminService,
    private _imagesService: ImagesService,
    private _geminiVehicleImage: GeminiVehicleImageService,
    private _bottomSheetRef: MatBottomSheetRef<{ reload?: boolean } | undefined>,
    private _router: Router,
    private readonly _vehicleGalleryReplace: VehicleGalleryReplaceService,
    private readonly _intelimotorService: IntelimotorService,
  ) {
      this.vehicle_uuid = data.uuid;
      if (data.initialTab === 1) {
        this.selectedTabIndex = 1;
      }
      this.formInit();
  }

  ngOnInit(): void {
    this.geminiAiConfigured = this._geminiVehicleImage.isConfigured();
    this.getVehicle();
  }

  ngOnDestroy(): void {
    this.revokePendingPreviews();
  }

  formatBytes(n: number): string {
    if (!Number.isFinite(n) || n < 0) return '—';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  }

  private revokePendingPreviews(): void {
    for (const u of this.pendingPreviewUrls) {
      URL.revokeObjectURL(u);
    }
    this.pendingPreviewUrls = [];
  }

  private isAllowedImageFile(f: File): boolean {
    const t = (f.type || '').toLowerCase();
    if (['image/png', 'image/jpeg', 'image/webp'].includes(t)) return true;
    return /\.(png|jpe?g|webp)$/i.test(f.name);
  }

  private applySelectedImageFiles(
    list: FileList | File[] | null,
    mode: 'replace' | 'append' = 'replace',
  ): void {
    this.revokePendingPreviews();
    if (!list || !list.length) {
      if (mode === 'replace') {
        this.imageFiles = [];
        this.imageUploadDisabled = true;
      }
      return;
    }
    const raw = Array.isArray(list)
      ? list
      : Array.from(list as ArrayLike<File>);
    const incoming = raw.filter((f) => this.isAllowedImageFile(f));
    if (!incoming.length) {
      if (mode === 'replace') {
        this.imageFiles = [];
        this.imageUploadDisabled = true;
      }
      return;
    }
    const next =
      mode === 'append' ? [...this.imageFiles, ...incoming] : incoming;
    this.imageFiles = next;
    this.imageUploadDisabled = next.length === 0;
    this.pendingPreviewUrls = next.map((f) => URL.createObjectURL(f));
  }

  onImageDragOver(ev: DragEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
    if (ev.dataTransfer) {
      ev.dataTransfer.dropEffect = 'copy';
    }
    this.imageDropZoneActive = true;
  }

  onImageDragLeave(ev: DragEvent): void {
    const cur = ev.currentTarget as HTMLElement;
    const rel = ev.relatedTarget as Node | null;
    if (rel && cur.contains(rel)) return;
    this.imageDropZoneActive = false;
  }

  onImageDrop(ev: DragEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.imageDropZoneActive = false;
    const dt = ev.dataTransfer;
    if (!dt?.files?.length) return;
    this.applySelectedImageFiles(dt.files, 'append');
  }

  clearPendingImages(): void {
    this.applySelectedImageFiles(null);
  }

  private filters(): void {

    this.filteredCampaigns = this.campaignControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value, this.campaigns)),
    )

    this.filteredBrands = this.brandControl.valueChanges.pipe(
      startWith(''),
      map((value) =>
        suggestBrandsByName(
          typeof value === 'string' ? value : '',
          this.brands,
          { limit: 20 }
        )
      )
    );

    // this.filteredLines = this.lineControl.valueChanges.pipe(
    //   startWith(''),
    //   map(value => this._filter(value, this.lines))
    // );

    this.filteredModels = this.modelControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value, this.models))
    );

    this.filteredVersions = this.versionControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value, this.versions))
    );

    this.filteredBodies = this.bodyControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value, this.bodies))
    );
  }

  private _filter<T extends { name: string }>(value: string, options: T[]): T[] {
    const filterValue = (value ?? '').toLowerCase();
    return options.filter(
      (option) => option != null && option.name && option.name.toLowerCase().includes(filterValue)
    );
  }

  public add( event: MatChipInputEvent ): void {
    const value = (event.value || '').trim();
    if (value) {
          this.camps.push(value);
          this.campaignControl.setValue(null);
          event.chipInput!.clear();
    }
    
  }

  public addCampaign(): void {
    const value = this.form.get('campaign_2')?.value?.trim();
    if (value && !this.camps.includes(value)) {
      this.camps.push(value);
      this.form.patchValue({ campaign_2: '' });
    }
  }
  public remove( event: string): void{
    let index = this.camps.indexOf(event);
    this.camps.splice(index, 1);
    this.id_camp.splice(index, 1);
  }

  onBrandSelected(event: MatAutocompleteSelectedEvent): void {
    const selectedBrand = event.option.value;
    this.form.patchValue({ brand: selectedBrand });
    this.getModels(selectedBrand).then(() => {
      this.filters();
    });
  }
  
  onCampaignSelected(event: MatAutocompleteSelectedEvent): void{
    const campaignName = event.option.value;
    if (!this.camps.includes(campaignName)) {
      this.camps.push(campaignName);
      this.id_camp.push(event.option.id);
    }
    this.form.patchValue({ campaign_2: '' });
  }

  // onLineSelected(event: MatAutocompleteSelectedEvent): void {
  //   const selectedLine = event.option.value;
  //   this.form.patchValue({ line: selectedLine });
  //   this.getModels(selectedLine).then(() => {
  //     this.filters();
  //   });
  // }

  onModelSelected(event: MatAutocompleteSelectedEvent): void {
    const selectedModel = event.option.value;
    this.form.patchValue({ model: selectedModel });
    this.getVersions(selectedModel).then(() => {
      this.filters();
    });
  }

  onVersionSelected(event: MatAutocompleteSelectedEvent): void {
    const selectedVersion = event.option.value;
    this.form.patchValue({ version: selectedVersion });
    this.filters();
  }

  onBodySelected(event: MatAutocompleteSelectedEvent): void {
    const selectedBody = event.option.value;
    this.form.patchValue({ body: selectedBody });
    this.filters();
  }


  public getVehicle(): void {
    this._vehicleService.getVehicle(this.vehicle_uuid)
      .subscribe({
        next: (detailResponse: FullDetailResponse) => {
          this.vehicle = detailResponse.data;
          const brandName = this.vehicle.brand?.name ?? '';
          const modelName = this.vehicle.model?.name ?? '';

          this.getBrands();
          if (brandName) {
            this.getModels(brandName);
          }
          if (modelName) {
            this.getVersions(modelName);
          }
          this.getBodies();
          this.getCampaigns();

          const campaigns = this.vehicle.campaigns ?? [];
          campaigns.forEach((element) => {
            if (element?.name != null && element?.uuid != null) {
              this.camps.push(element.name);
              this.id_camp.push(element.uuid);
            }
          });

          setTimeout(() => {
            this.form.patchValue({
              uuid: this.vehicle.uuid,
              name: this.vehicle.name,
              description: this.vehicle.description,
              dealership_name: this.vehicle.dealership?.name ?? '',
              location: this.vehicle.dealership?.location ?? '',
              vin: this.vehicle.vin,
              year: this.vehicle.model?.year ?? '',
              purchase_date: this.vehicle.purchase_date,
              list_price: this.vehicle.list_price,
              sale_price: this.vehicle.sale_price,
              offer_price: this.vehicle.offer_price,
              type: this.vehicle.type,
              category: this.vehicle.category,
              cylinders: this.vehicle.cylinders,
              engine_displacement_cc: this.vehicle.engine_displacement_cc ?? '',
              wet_weight_kg: this.vehicle.wet_weight_kg ?? '',
              motorcycle_brakes: this.vehicle.motorcycle_brakes ?? '',
              motorcycle_starting_system: this.vehicle.motorcycle_starting_system ?? '',
              motorcycle_digital_dashboard: this.vehicle.motorcycle_digital_dashboard ?? '',
              motorcycle_engine_cycle: this.vehicle.motorcycle_engine_cycle ?? '',
              motorcycle_power_hp: this.vehicle.motorcycle_power_hp ?? '',
              motorcycle_max_speed_kmh: this.vehicle.motorcycle_max_speed_kmh ?? '',
              motorcycle_suspension: this.vehicle.motorcycle_suspension ?? '',
              interior_color: this.vehicle.interior_color,
              exterior_color: this.vehicle.exterior_color,
              page_status: this.vehicle.page_status,
              spec_sheet: this.vehicle.spec_sheet,
              transmission: this.vehicle.transmission,
              fuel_type: this.vehicle.fuel_type,
              mileage: this.vehicle.mileage,
              brand: brandName,
              model: modelName,
              version: this.vehicle.version?.name ?? '',
              body: this.vehicle.body?.name ?? '',
            
            });

            this.filters();
            this.syncImagesFromVehicle();
          }, 500);
        },
        error: (err: unknown) => {
          reload(err, this._router);
        }
      });
  }

  private syncImagesFromVehicle(): void {
    this.imagesForSlider = [];
    const imgs = this.vehicle?.images ?? [];
    for (let i = 0; i < imgs.length; i++) {
      const img = imgs[i] as unknown as Record<string, unknown>;
      const uuidVal = img['uuid'];
      const id = typeof uuidVal === 'string' ? uuidVal : String(uuidVal ?? '');
      this.imagesForSlider.push({
        id,
        sort_id: String(img['sort_id'] ?? i + 1),
        path: String(img['service_image_url'] ?? img['path'] ?? ''),
        path_public: String(img['service_public_id'] ?? ''),
        external_website: (img['external_website'] as string) ?? 'no',
        selected: false
      });
    }
  }

  refreshImagesFromApi(): void {
    this._vehicleService.getVehicle(this.vehicle_uuid).subscribe({
      next: (res: FullDetailResponse) => {
        this.vehicle.images = res.data.images;
        this.syncImagesFromVehicle();
      }
    });
  }

  assignImageFiles(event: Event): void {
    const el = event.currentTarget as HTMLInputElement;
    this.applySelectedImageFiles(el.files, 'replace');
    el.value = '';
  }

  uploadNewImages(): void {
    if (!this.imageFiles.length) {
      return;
    }
    void this.runUploadNewImages();
  }

  private async runUploadNewImages(): Promise<void> {
    this.imageUploadLoading = true;
    this.imageUploadDisabled = true;
    this.imageUploadPhase = 'idle';

    let filesToUpload = [...this.imageFiles];

    if (this.processImagesWithAi) {
      if (!this._geminiVehicleImage.isConfigured()) {
        Swal.fire({
          icon: 'warning',
          title: 'IA no disponible',
          text: 'Configura geminiApiKey en environment.ts. En desarrollo activa geminiUseDevProxy y proxy.conf.json.',
          confirmButtonColor: '#EEB838',
        });
        this.imageUploadLoading = false;
        this.imageUploadDisabled = this.imageFiles.length === 0;
        return;
      }
      this.imageUploadPhase = 'ai';
      try {
        filesToUpload = await this._geminiVehicleImage.processFilesRecorteEmbellecer(
          this.imageFiles,
        );
      } catch (e) {
        this.imageUploadPhase = 'idle';
        this.imageUploadLoading = false;
        this.imageUploadDisabled = this.imageFiles.length === 0;
        Swal.fire({
          icon: 'error',
          title: 'Error al procesar con IA',
          text:
            e instanceof Error
              ? e.message
              : 'Intenta de nuevo o desactiva el interruptor y sube los originales.',
          confirmButtonColor: '#EEB838',
        });
        return;
      }
    }

    this.imageUploadPhase = 'upload';
    this._imagesService
      .setImage(this.vehicle_uuid, filesToUpload)
      .pipe(timeout(240000))
      .subscribe({
      next: () => {
        this.imageUploadLoading = false;
        this.imageUploadPhase = 'idle';
        this.applySelectedImageFiles(null);
        this.imagesDirty = true;
        Swal.fire({
          icon: 'success',
          title: 'Imágenes subidas',
          showConfirmButton: false,
          timer: 2000,
        });
        this.refreshImagesFromApi();
      },
      error: (err: unknown) => {
        this.imageUploadLoading = false;
        this.imageUploadPhase = 'idle';
        this.imageUploadDisabled = this.imageFiles.length === 0;
        if (err instanceof TimeoutError) {
          Swal.fire({
            icon: 'error',
            title: 'Tiempo agotado',
            text: 'El servidor no respondió (240 s). Comprueba Laravel en 127.0.0.1:8000 y tu red.',
            confirmButtonColor: '#EEB838',
          });
          return;
        }
        reload(err, this._router);
      },
    });
  }

  drop(event: CdkDragDrop<ImageRow[]>): void {
    const selectedImages = this.imagesForSlider.filter((image) => image.selected);
    if (selectedImages.length > 0) {
      const remaining = this.imagesForSlider.filter((image) => !image.selected);
      const insertIndex = event.currentIndex;
      this.imagesForSlider = [
        ...remaining.slice(0, insertIndex),
        ...selectedImages,
        ...remaining.slice(insertIndex)
      ];
    } else {
      moveItemInArray(this.imagesForSlider, event.previousIndex, event.currentIndex);
    }
  }

  saveImageOrder(): void {
    if (this.imagesForSlider.length === 0) {
      return;
    }
    this.imagesOrderSaving = true;
    this._imagesService.changeOrder(this.imagesForSlider).subscribe({
      next: (resp) => {
        this.imagesOrderSaving = false;
        this.imagesDirty = true;
        Swal.fire({
          icon: 'success',
          title: resp.message,
          showConfirmButton: false,
          timer: 2000
        });
        this.refreshImagesFromApi();
      },
      error: (err: unknown) => {
        this.imagesOrderSaving = false;
        reload(err, this._router);
      }
    });
  }

  get canPushIntelimotorPhotos(): boolean {
    return !!this.vehicle?.intelimotor_unit_id
      && this.vehicle.page_status !== 'sale'
      && this.imagesForSlider.length > 0;
  }

  pushPhotosToIntelimotor(): void {
    if (!this.canPushIntelimotorPhotos || this.pushingIntelimotorPhotos) {
      return;
    }

    void Swal.fire({
      title: '¿Actualizar fotos en Intelimotor?',
      html: 'Se enviará la galería actual de ABCars a la unidad vinculada en Intelimotor (<strong>pictureUrls</strong>).',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Actualizar en Intelimotor',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#059669',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.pushingIntelimotorPhotos = true;
      this._intelimotorService.pushVehiclePhotos(this.vehicle_uuid).subscribe({
        next: (resp) => {
          this.pushingIntelimotorPhotos = false;
          void Swal.fire('Fotos actualizadas', resp.message, 'success');
        },
        error: (err: unknown) => {
          this.pushingIntelimotorPhotos = false;
          const body = (err as { error?: { message?: string } })?.error;
          const message = body?.message || 'No se pudieron subir las fotos a Intelimotor';
          void Swal.fire(
            'Error',
            message.replace(/^Hubo un problema con su solicitud:\s*/i, ''),
            'error'
          );
        },
      });
    });
  }

  /**
   * Reemplaza una imagen de la galería tras pasarla por Gemini (recorte estudio + embellecimiento).
   */
  processGalleryImageWithAi(image: ImageOrder, index: number): void {
    if (this.galleryReplacing) return;
    if (!this._geminiVehicleImage.isConfigured()) {
      void Swal.fire({
        icon: 'warning',
        title: 'IA no disponible',
        text: 'Configura geminiApiKey en environment.ts (y en desarrollo geminiUseDevProxy + proxy.conf.json).',
        confirmButtonColor: '#EEB838',
      });
      return;
    }
    void Swal.fire({
      title: '¿Procesar con IA?',
      html: 'Se enviará esta foto a Gemini (recorte tipo estudio y embellecimiento) y <strong>sustituirá</strong> la imagen actual en el mismo lugar de la galería.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Procesar y reemplazar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ca8a04',
    }).then((r) => {
      if (!r.isConfirmed) return;
      void this.runProcessGalleryImageWithAi(image, index);
    });
  }

  private async runProcessGalleryImageWithAi(image: ImageOrder, index: number): Promise<void> {
    this.galleryReplacing = true;
    this.galleryReplacingIndex = index;
    try {
      const source = await fetchImageAsFile(image.path, `source_${image.id}.jpg`);
      const processed = await this._geminiVehicleImage.processFilesRecorteEmbellecer([source]);
      const outFile = processed[0];
      if (!outFile) {
        throw new Error('La IA no devolvió imagen.');
      }
      const idsSnapshot = new Set(this.imagesForSlider.map((x) => x.id));
      this._vehicleGalleryReplace
        .replaceAtIndex(this.vehicle_uuid, image.id, index, outFile, idsSnapshot)
        .pipe(
          finalize(() => {
            this.galleryReplacing = false;
            this.galleryReplacingIndex = null;
          }),
        )
        .subscribe({
          next: (vehRes) => {
            this.vehicle.images = vehRes.data.images;
            this.syncImagesFromVehicle();
            this.imagesDirty = true;
            void Swal.fire({
              icon: 'success',
              title: 'Imagen procesada y actualizada',
              showConfirmButton: false,
              timer: 2200,
            });
          },
          error: (err: unknown) => reload(err, this._router),
        });
    } catch (e) {
      this.galleryReplacing = false;
      this.galleryReplacingIndex = null;
      const msg =
        e instanceof Error
          ? e.message
          : 'No se pudo procesar. Si la imagen viene de otro dominio, revisa CORS o descárgala y súbela de nuevo.';
      void Swal.fire({
        icon: 'error',
        title: 'Error al procesar',
        text: msg,
        confirmButtonColor: '#EEB838',
      });
    }
  }

  deleteImageAt(vehicleImageUuid: string, index: number): void {
    Swal.fire({
      title: '¿Eliminar esta imagen?',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      confirmButtonColor: '#b91c1c'
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }
      this._imagesService.deleteImage(vehicleImageUuid).subscribe({
        next: (resp) => {
          this.imagesForSlider.splice(index, 1);
          this.imagesDirty = true;
          Swal.fire(resp.message, '', 'success');
        },
        error: (err: unknown) => {
          reload(err, this._router);
        }
      });
    });
  }

  public getBrands(): void {
    this._vehicleService.getBrands()
      .subscribe({
        next: (brandsResponse: BrandsResponse) => {
          this.brands = brandsResponse.data.vehicle_brands;
          this.filters();
        }
      });
  }

  public getCampaigns(): void{
    this._campaignService.getCampaing()
    .subscribe({
     next: (campaignResponse: GetcampaingResponse) => {
      this.campaigns = campaignResponse.data.campaigns;
      this.filters();
     }
    })
  }

  // public getLines(brand: string): Promise<void> {
  //   return new Promise<void>((resolve, reject) => {
  //     this._vehicleService.getLines(brand)
  //       .subscribe({
  //         next: (linesResponse: LinesResponse) => {
  //           this.lines = linesResponse.data.brand_lines;
  //           resolve();
  //         },
  //         error: (error) => reject(error)
  //       });
  //   });
  // }

  public getModels(brand: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._vehicleService.getModels(brand)
        .subscribe({
          next: (modelsResponse: ModelsResponse) => {
            this.models = modelsResponse.data.line_models;
            resolve();
          },
          error: (error) => reject(error)
        });
    });
  }

  public getVersions(model: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._vehicleService.getVersions(model)
        .subscribe({
          next: (versionsResponse: VersionsResponse) => {
            this.versions = versionsResponse.data.model_versions;
            resolve();
          },
          error: (error) => reject(error)
        });
    });
  }

  public getBodies(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._vehicleService.getBodies()
        .subscribe({
          next: (bodiesResponse: BodiesResponse) => {
            this.bodies = bodiesResponse.data.vehicle_bodies;
            resolve();
          },
          error: (error) => reject(error)
        });
    });
  }

  private formInit() {
      this.form = this._formBuilder.group({
          uuid:           ['', [Validators.required]],
          name:           ['', [Validators.required]],
          description:    ['', [Validators.required]],
          vin:            ['', [Validators.required]],
          purchase_date:  ['', [Validators.required]],
          sale_price:     ['', [Validators.required]],
          list_price:     ['', [Validators.required]],
          mileage:        ['', [Validators.required]],
          type:           ['', [Validators.required]],
          category:       ['', [Validators.required]],
          cylinders:      ['', [Validators.required]],
          engine_displacement_cc: [''],
          wet_weight_kg:  [''],
          motorcycle_brakes: [''],
          motorcycle_starting_system: [''],
          motorcycle_digital_dashboard: [''],
          motorcycle_engine_cycle: [''],
          motorcycle_power_hp: [''],
          motorcycle_max_speed_kmh: [''],
          motorcycle_suspension: [''],
          interior_color: ['', [Validators.required]],
          exterior_color: ['', [Validators.required]],
          transmission:   ['', [Validators.required]],
          fuel_type:      ['', [Validators.required]],
          page_status:    ['', [Validators.required]],
          spec_sheet:     [''],
          brand:          ['', [Validators.required]],
          year:           ['', [Validators.required]],
          model:          ['', [Validators.required]],
          version:        ['', [Validators.required]],
          body:           ['', [Validators.required]],
          dealership_name:['', [Validators.required]],
          location:       ['', [Validators.required]],
          offer_price:    ['', [this.offerPriceValidator('sale_price')]],
          campaign_2:       [''],
      });
  }

  onSubmit() {
    this._vehicleService.updateVehicle( this.form.value)
    
    .subscribe({
      next: ( updateVehicleResponse :VehicleUpdateResponse) => {
          Swal.fire({                    
            icon: 'success',
            title: 'Vehículo actualizado con exito',
            text: updateVehicleResponse.data.name,
            showConfirmButton: false,
            timer: 2000
          });

          this.imagesDirty = false;
          this._bottomSheetRef.dismiss(
            {reload: true}
          );
      },
      error: (error) => {
        reload(error, this._router);
      }
    });
    if(this.id_camp.length > 0){
      this._vehicleService.attachVehicle(this.id_camp, this.vehicle_uuid)
      .subscribe({
        next: ( relationVehicleResponse :GralResponse) => {
            Swal.fire({                    
              icon: 'success',
              title: 'Vehículo relacionado con campañacon exitosamente',
              text: '',
              showConfirmButton: false,
              timer: 2000
            });

            this.imagesDirty = false;
            this._bottomSheetRef.dismiss(
              {reload: true}
            );
        },
        error: (error) => {
          reload(error, this._router);
        }
      });
    }

    this.button = false;
  }

  private offerPriceValidator(salePriceControlName: string): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {

      const salePrice = control.parent?.get(salePriceControlName)?.value;
      const offerPrice = control.value;

      if (offerPrice === null || offerPrice === undefined || offerPrice === '') {
          return null;
      }

      // Verificar si el valor es un número válido
      if (isNaN(offerPrice) || !isFinite(offerPrice)) {
          return { 'notANumber': true };
      }

      // Verificar si el valor es mayor a cero
      if (offerPrice <= 0) {
          return { 'lessThanOrEqualToZero': true };
      }

      // Verificar si el valor es mayor o igual al sale_price
      if (offerPrice >= salePrice) {
          return { 'greaterThanSalePrice': true };
      }
  
      return null;
    };
  }

  get isNotVehicle() {
    if (this.vehicle === undefined || this.vehicle === null) {
      return true;
    }
    return Object.keys(this.vehicle).length === 0;
  }

  get nameInvalid() {
    const control = this.form.get('name')!;
    return control.invalid && (control.dirty || control.touched);
  }

  get descriptionInvalid() {
    const control = this.form.get('description')!;
    return control.invalid && (control.dirty || control.touched);
  }

  get locationInvalid() {
    const control = this.form.get('location')!;
    return control.invalid && (control.dirty || control.touched);
  }

  get yearModelInvalid() {
    const control = this.form.get('year')!;
    return control.invalid && (control.dirty || control.touched);
  }

  get purchaseDateInvalid() {
    const control = this.form.get('purchase_date')!;
    return control.invalid && (control.dirty || control.touched);
  }

  get listPriceInvalid() {
    const control = this.form.get('list_price')!;
    return control.invalid && (control.dirty || control.touched);
  }

  get salePriceInvalid() {
    const control = this.form.get('sale_price')!;
    return control.invalid && (control.dirty || control.touched);
  }

  get cylindersInvalid(){
    const control = this.form.get('cylinders')!;
    return control.invalid && (control.dirty || control.touched);
  }

  get colorIntInvalid(){
    const control = this.form.get('interior_color')!;
    return control.invalid && (control.dirty || control.touched);
  }

  get colorExtInvalid(){
    const control = this.form.get('exterior_color')!;
    return control.invalid && (control.dirty || control.touched);
  }

  get kmInvalid(){
    const control = this.form.get('mileage')!;
    return control.invalid && (control.dirty || control.touched);
  }

  get priceOfferInvalid(){
    const control = this.form.get('offer_price')!;
    return control.invalid && (control.dirty || control.touched);
  }

  get vinInvalid(){
    const control = this.form.get('vin')!;
    return control.invalid && (control.dirty || control.touched);
  }

  get brandInvalid(){
    const control = this.form.get('brand')!;
    return control.invalid && (control.dirty || control.touched);
  }

  // get lineInvalid(){
  //   const control = this.form.get('line')!;
  //   return control.invalid && (control.dirty || control.touched);
  // }

  get modelInvalid(){
    const control = this.form.get('model')!;
    return control.invalid && (control.dirty || control.touched);
  }

  get versionInvalid(){
    const control = this.form.get('version')!;
    return control.invalid && (control.dirty || control.touched);
  }

  get bodyInvalid(){
    const control = this.form.get('body')!;
    return control.invalid && (control.dirty || control.touched);
  }

  get dealershipInvalid(){
    const control = this.form.get('dealership_name')!;
    return control.invalid && (control.dirty || control.touched);
  }

  public close():void {
    this._bottomSheetRef.dismiss(this.imagesDirty ? { reload: true } : undefined);
  }

  

}
