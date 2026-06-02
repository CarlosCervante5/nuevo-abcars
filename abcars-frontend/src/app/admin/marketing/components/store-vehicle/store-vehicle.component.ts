import { Campaign, Dealership, DealerShipResponse, GetcampaingResponse } from '@interfaces/admin.interfaces';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { AbstractControl, FormControl, FormGroup, UntypedFormBuilder, ValidatorFn, Validators } from '@angular/forms';
import { VehicleService } from '@services/vehicle.service';
import Swal from "sweetalert2";
import { MatChipInputEvent } from '@angular/material/chips';
import { Observable, of, Subject, combineLatest, BehaviorSubject } from 'rxjs';
import { map, startWith, finalize, takeUntil } from 'rxjs/operators';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

import {UpdateVehicle, BrandsResponse, Brand, Line, Model, Body, ModelsResponse, VersionsResponse, Version, BodiesResponse, GralResponse, VehicleStoreResponse, FullDetailResponse, ImageOrder} from '@interfaces/vehicle_data.interface';
import { AdminService } from '@services/admin.service';
import { sortDealershipsForPublic } from 'src/app/shared/utils/public-dealerships';

import { suggestBrandsByName } from '@helpers/brand-suggest.helper';
import {reload} from '@helpers/session.helper';
import { Router } from '@angular/router';
import { ImagesService } from '@services/images.service';
import { GeminiVehicleImageService } from '@services/gemini-vehicle-image.service';
import { VehicleGalleryReplaceService } from '@services/vehicle-gallery-replace.service';
import {
  VehicleImageAiQueueService,
  VehicleImageBatchJob,
} from '@services/vehicle-image-ai-queue.service';
import { fetchImageAsFile } from '../../../../shared/utils/fetch-image-as-file';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

type ImageRow = ImageOrder & { selected?: boolean };

@Component({
    selector: 'app-store-vehicle',
    templateUrl: './store-vehicle.component.html',
    styleUrls: ['./store-vehicle.component.css'],
    standalone: false
})
export class StoreVehicleComponent implements OnInit, OnDestroy {
  
  
  public vehicle_uuid: string = '';
  /** Detalle tras crear (para galería). */
  public vehicle?: UpdateVehicle;
  public form!: FormGroup;

  public button: boolean = false;

  selectedTabIndex = 0;
  /** null hasta que el API devuelva el vehículo creado. */
  createdUuid: string | null = null;

  imageFiles: File[] = [];
  imageUploadDisabled = true;
  /** Si true y hay clave Gemini, recorte estudio + embellecimiento antes de subir. */
  processImagesWithAi = false;
  geminiAiConfigured = false;
  imagesForSlider: ImageRow[] = [];
  imagesOrderSaving = false;
  /** Índices de fila con IA en curso (Gemini + reemplazo); no bloquea el resto del formulario. */
  private readonly galleryAiBusyIndices = new Set<number>();

  filteredBatchJobs$!: Observable<VehicleImageBatchJob[]>;
  private readonly queueVehicleIdentity$ = new BehaviorSubject<string | null>(
    null,
  );
  private readonly destroy$ = new Subject<void>();

  /** Zona de soltar archivos (HTML5); el <label> solo dispara click, no recibe drops. */
  imageDropZoneActive = false;
  /** Miniaturas locales de los archivos elegidos (revocar al cambiar o destruir). */
  pendingPreviewUrls: string[] = [];

  public camps: string[] = [];
  public id_camp: string[] = [];
  public responseCamp: Campaign[] = [];

  brandControl = new FormControl();
  public brands:Brand[] = [];
  filteredBrands: Observable<Brand[]> = of([]);

  campaignControl = new FormControl();
  public campaigns: Campaign[] = [];
  filteredCampaigns: Observable<Campaign[]> = of([]);

  lineControl = new FormControl();
  public lines:Line[] = [];
  filteredLines: Observable<Line[]> = of([]);

  modelControl = new FormControl();
  public models:Model[] = [];
  filteredModels: Observable<Model[]> = of([]);

  versionControl = new FormControl();
  public versions:Version[] = [];
  filteredVersions: Observable<Version[]> = of([]);

  bodyControl = new FormControl();
  public bodies:Body[] = [];
  filteredBodies: Observable<Body[]> = of([]);

  /** Catálogo de sucursales (BD) para el select de alta. */
  dealershipsForSelect: Dealership[] = [];
  loadingDealerships = false;

  constructor(
    private _formBuilder: UntypedFormBuilder,
    private _vehicleService:VehicleService,
    private _campaignService:AdminService,
    private _imagesService: ImagesService,
    private _geminiVehicleImage: GeminiVehicleImageService,
    private _bottomSheetRef: MatBottomSheetRef<{ reload?: boolean } | undefined>,
    private _router: Router,
    private readonly _vehicleGalleryReplace: VehicleGalleryReplaceService,
    private readonly _imageAiQueue: VehicleImageAiQueueService,
  ) {
      this.filteredBatchJobs$ = combineLatest([
        this._imageAiQueue.batchJobs$,
        this.queueVehicleIdentity$,
      ]).pipe(
        map(([jobs, id]) =>
          id ? jobs.filter((j) => j.vehicleUuid === id) : [],
        ),
      );
      this.formInit();
  }

  ngOnInit(): void {
    this.InitForm();
    this.geminiAiConfigured = this._geminiVehicleImage.isConfigured();
    void this._geminiVehicleImage.refreshGenerationAvailability().then((ok) => {
      this.geminiAiConfigured = ok;
    });
    this.form.get('dealership_name')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((name) => this.syncLocationFromDealership(name));
    this.loadDealerships();
    this.queueVehicleIdentity$.next(this.createdUuid);

    this._imageAiQueue.vehicleBatchFinished$
      .pipe(takeUntil(this.destroy$))
      .subscribe((ev) => {
        if (!this.createdUuid || ev.vehicleUuid !== this.createdUuid) {
          return;
        }
        if (ev.ok) {
          void Swal.fire({
            icon: 'success',
            title: 'Imágenes subidas',
            showConfirmButton: false,
            timer: 2000,
          });
          this.refreshImagesFromApi();
          return;
        }
        void Swal.fire({
          icon: 'error',
          title: 'Error al procesar o subir',
          text: ev.message ?? 'Intenta de nuevo o desactiva IA y sube los originales.',
          confirmButtonColor: '#EEB838',
        });
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.revokePendingPreviews();
  }

  isGalleryAiBusy(index: number): boolean {
    return this.galleryAiBusyIndices.has(index);
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

  /** Archivos desde input file (reemplaza) o desde drag-and-drop (añade a la cola). */
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

    this.filteredLines = this.lineControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value, this.lines))
    );

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
    const filterValue = value.toLowerCase();
    return options.filter(option => option.name.toLowerCase().includes(filterValue));
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

  onLineSelected(event: MatAutocompleteSelectedEvent): void {
    const selectedLine = event.option.value;
    this.form.patchValue({ line: selectedLine });
    this.getModels(selectedLine).then(() => {
      this.filters();
    });
  }

  onModelSelected(event: MatAutocompleteSelectedEvent): void {
    const selectedModel = event.option.value;
    this.form.patchValue({ model: selectedModel.name });
    this.form.patchValue({ year: selectedModel.year });
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

  public getModels(line: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._vehicleService.getModels(line)
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
          brand:          ['', [Validators.required]],
          // line:           ['', [Validators.required]],
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
  public InitForm() {
    this.getBrands();
    this.getBodies();
    this.getCampaigns();
  }

  private loadDealerships(): void {
    this.loadingDealerships = true;
    this._campaignService.getDealerships().subscribe({
      next: (res: DealerShipResponse) => {
        this.dealershipsForSelect = sortDealershipsForPublic(res.data ?? []);
        this.loadingDealerships = false;
      },
      error: () => {
        this.dealershipsForSelect = [];
        this.loadingDealerships = false;
      },
    });
  }

  private syncLocationFromDealership(name: string | null | undefined): void {
    const key = String(name ?? '').trim().toLowerCase();
    if (!key) {
      this.form.patchValue({ location: '' }, { emitEvent: false });
      return;
    }
    const match = this.dealershipsForSelect.find(
      (d) => (d.name ?? '').trim().toLowerCase() === key,
    );
    this.form.patchValue(
      { location: (match?.location ?? '').trim() },
      { emitEvent: false },
    );
  }

  get vehicleCreated(): boolean {
    return !!this.createdUuid;
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
    if (!this.createdUuid) {
      return;
    }
    this._vehicleService.getVehicle(this.createdUuid).subscribe({
      next: (res: FullDetailResponse) => {
        this.vehicle = res.data;
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
    if (!this.createdUuid || !this.imageFiles.length) {
      return;
    }
    this.runUploadNewImages();
  }

  private runUploadNewImages(): void {
    if (!this.createdUuid || !this.imageFiles.length) {
      return;
    }

    if (this.processImagesWithAi && !this._geminiVehicleImage.isConfigured()) {
      void Swal.fire({
        icon: 'warning',
        title: 'IA no disponible',
        text: 'Configura geminiApiKey en environment.ts. En desarrollo activa geminiUseDevProxy y el archivo proxy.conf.json.',
        confirmButtonColor: '#EEB838',
      });
      return;
    }

    const snapshot = [...this.imageFiles];
    const useAi = this.processImagesWithAi;
    const uuid = this.createdUuid;

    this.applySelectedImageFiles(null);

    this._imageAiQueue.enqueueBatchProcessAndUpload(uuid, snapshot, useAi);

    void Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'info',
      title: useAi
        ? 'Procesando imágenes en segundo plano'
        : 'Subiendo imágenes en segundo plano',
      text: 'Puedes seguir usando el formulario y la galería.',
      showConfirmButton: false,
      timer: 3200,
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

  processGalleryImageWithAi(image: ImageOrder, index: number): void {
    if (!this.createdUuid || this.galleryAiBusyIndices.has(index)) return;
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
    const uuid = this.createdUuid;
    if (!uuid) return;
    if (this.galleryAiBusyIndices.has(index)) return;

    this.galleryAiBusyIndices.add(index);
    try {
      const source = await fetchImageAsFile(image.path, `source_${image.id}.jpg`);
      const processed = await this._geminiVehicleImage.processFilesRecorteEmbellecer([source]);
      const outFile = processed[0];
      if (!outFile) {
        throw new Error('La IA no devolvió imagen.');
      }
      const idsSnapshot = new Set(this.imagesForSlider.map((x) => x.id));
      this._vehicleGalleryReplace
        .replaceAtIndex(uuid, image.id, index, outFile, idsSnapshot)
        .pipe(
          finalize(() => {
            this.galleryAiBusyIndices.delete(index);
          }),
        )
        .subscribe({
          next: (vehRes) => {
            if (this.vehicle) {
              this.vehicle.images = vehRes.data.images;
              this.syncImagesFromVehicle();
            }
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
      this.galleryAiBusyIndices.delete(index);
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
          Swal.fire(resp.message, '', 'success');
        },
        error: (err: unknown) => {
          reload(err, this._router);
        }
      });
    });
  }

  finishAndClose(): void {
    this._bottomSheetRef.dismiss({ reload: true });
  }

  onSubmit() {
    if (this.form.invalid || this.vehicleCreated) {
      return;
    }
    this.button = true;
    this._vehicleService.storeVehicle(this.form.value).subscribe({
      next: (storeVehicleResponse: VehicleStoreResponse) => {
        const uuid = storeVehicleResponse.data.uuid;
        this.vehicle_uuid = uuid;
        this.createdUuid = uuid;
        this.queueVehicleIdentity$.next(uuid);

        const afterCreate = () => {
          this.button = false;
          this.form.disable({ emitEvent: false });
          Swal.fire({
            icon: 'success',
            title: 'Vehículo creado',
            text: 'Agrega fotos en la pestaña Imágenes o finaliza.',
            showConfirmButton: false,
            timer: 2400
          });
          this.selectedTabIndex = 1;
          this.refreshImagesFromApi();
        };

        if (this.id_camp.length > 0) {
          this._vehicleService.attachVehicle(this.id_camp, uuid).subscribe({
            next: () => afterCreate(),
            error: (error) => {
              this.button = false;
              reload(error, this._router);
            }
          });
        } else {
          afterCreate();
        }
      },
      error: (error) => {
        this.button = false;
        reload(error, this._router);
      }
    });
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

  public close(): void {
    this._bottomSheetRef.dismiss(this.vehicleCreated ? { reload: true } : undefined);
  }

  

}
