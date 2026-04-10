import { Campaign } from '@interfaces/admin.interfaces';
import { Component, OnInit } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { AbstractControl, FormControl, FormGroup, UntypedFormBuilder, ValidatorFn, Validators } from '@angular/forms';
import { VehicleService } from '@services/vehicle.service';
import Swal from "sweetalert2";
import { MatChipInputEvent } from '@angular/material/chips';
import { Observable, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

import {UpdateVehicle, BrandsResponse, Brand, Line, Model, Body, ModelsResponse, VersionsResponse, Version, BodiesResponse, GralResponse, VehicleStoreResponse, FullDetailResponse, ImageOrder} from '@interfaces/vehicle_data.interface';
import { GetcampaingResponse } from '@interfaces/admin.interfaces';
import { AdminService } from '@services/admin.service';

import {reload} from '@helpers/session.helper';
import { Router } from '@angular/router';
import { ImagesService } from '@services/images.service';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

type ImageRow = ImageOrder & { selected?: boolean };

@Component({
    selector: 'app-store-vehicle',
    templateUrl: './store-vehicle.component.html',
    styleUrls: ['./store-vehicle.component.css'],
    standalone: false
})
export class StoreVehicleComponent  implements OnInit{
  
  
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
  imageUploadLoading = false;
  imagesForSlider: ImageRow[] = [];
  imagesOrderSaving = false;

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

  constructor(
    private _formBuilder: UntypedFormBuilder,
    private _vehicleService:VehicleService,
    private _campaignService:AdminService,
    private _imagesService: ImagesService,
    private _bottomSheetRef: MatBottomSheetRef<{ reload?: boolean } | undefined>,
    private _router: Router
  ) {
      this.formInit();
  }

  ngOnInit(): void {
    this.InitForm();
  }

  private filters(): void {

    this.filteredCampaigns = this.campaignControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value, this.campaigns)),
    )

    this.filteredBrands = this.brandControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value, this.brands))
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
    const list = el.files;
    if (list?.length) {
      this.imageFiles = Array.from(list);
      this.imageUploadDisabled = false;
    } else {
      this.imageFiles = [];
      this.imageUploadDisabled = true;
    }
  }

  uploadNewImages(): void {
    if (!this.createdUuid || !this.imageFiles.length) {
      return;
    }
    this.imageUploadLoading = true;
    this.imageUploadDisabled = true;
    this._imagesService.setImage(this.createdUuid, this.imageFiles).subscribe({
      next: () => {
        this.imageUploadLoading = false;
        this.imageFiles = [];
        this.imageUploadDisabled = true;
        Swal.fire({
          icon: 'success',
          title: 'Imágenes subidas',
          showConfirmButton: false,
          timer: 2000
        });
        this.refreshImagesFromApi();
      },
      error: (err: unknown) => {
        this.imageUploadLoading = false;
        this.imageUploadDisabled = this.imageFiles.length === 0;
        reload(err, this._router);
      }
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
