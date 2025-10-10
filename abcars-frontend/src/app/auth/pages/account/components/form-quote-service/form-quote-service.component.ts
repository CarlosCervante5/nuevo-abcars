import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { map, startWith } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

// Animations
import Swal from 'sweetalert2';

// Angular Material
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';

// Pipes
import { DatePipe, DOCUMENT } from '@angular/common';

// Services
import { VendeTuAutoService } from '@services/vende-tu-auto.service'; 
import { ServicesService } from '../../services/services.service';
import { MyCarsService } from '../../services/my-cars.service';

// Interfaces
// import { Branch, Brands } from 'src/app/dashboard/pages/vender-autos/interfaces/vende-tu-auto.interface';
import { DataModels, Model } from 'src/app/dashboard/pages/comprar-autos/interfaces/compra-tu-auto/data_models.interface';
import { ClientServices, Services, Service, RegisterQuote, RegisterServiceQuote } from '../../interfaces/services.interface';
import { Carmodel, VehicleUser } from '../../interfaces/my-cars.interface';
interface Vehicle {
  id: number;
  name: string;
  carmodel: Carmodel;
  vin: string;
}

// Components
import { MyServicesComponent } from '../../pages/my-services/my-services.component';


@Component({
    selector: 'app-form-quote-service',
    templateUrl: './form-quote-service.component.html',
    styles: [`
    mat-form-field {
      width: 100%;
    }
  `],
    providers: [
        DatePipe
    ],
    standalone: false
})

export class FormQuoteServiceComponent implements OnInit {

  // References of Help
  public spinner: boolean = false;  
  public selectable: boolean = true;
  public removable: boolean = true; 
  public changeQuote: string = 'init';  
  private _user: any;
  private _client_id: number = 0;

  public minDate: Date = new Date();
  public maxDate: Date = new Date(new Date().setDate( new Date().getDate() + 365));  

  // References Form
  public form!: UntypedFormGroup; 

  // References Arrays
  // public brands: Branch[] = [];
  public models: Model[] = [];  
  public vehicles: Vehicle[] = [];

  // References elements DOM
  public myFilter = (d: Date | null): boolean => {
    const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    return day !== 0 && day !== 6;
  }  

  // Chips
  public allServices: Service[] = [];  
  public serviceCtrl = new UntypedFormControl();
  public services: Service[] = [];
  @ViewChild('serviceInput') serviceInput!: ElementRef<HTMLInputElement>;

  constructor(   
    private _router: Router,
    private _formBuilder: UntypedFormBuilder,
    private _servicesService: ServicesService,
    private _myCarsService: MyCarsService,    
    private _venderTuAutoService: VendeTuAutoService,
    private _bottomSheetRef: MatBottomSheetRef<MyServicesComponent>,

    @Inject(DOCUMENT) private datePipe: DatePipe,

  ) { 
    // Initialization of Form
    this.createForm(); 

    // Get id user in session storage
    this._user = JSON.parse(localStorage.getItem('user')!);
    this.getClient(this._user.id);    
  }

  ngOnInit(): void {
    // Calling the initial functions of the form
    this.getBrands();  
    this.getServices();    
  }

  /**
   * Getters Inputs Check
   */
  get brandInvalid() {
    return this.form.get('brand_id')!.invalid && (this.form.get('brand_id')!.dirty || this.form.get('brand_id')!.touched);
  }

  get modelInvalid() {
    return this.form.get('carmodel_id')!.invalid && (this.form.get('carmodel_id')!.dirty || this.form.get('carmodel_id')!.touched);
  }

  get vinInvalid() {
    return this.form.get('vin')!.invalid && (this.form.get('vin')!.dirty || this.form.get('vin')!.touched);
  }

  get serviceInvalid() {
    return this.form.get('services')!.invalid && (this.form.get('services')!.dirty || this.form.get('services')!.touched);
  }

  get dateInvalid() {
    return this.form.get('quoteDate')!.invalid && (this.form.get('quoteDate')!.dirty || this.form.get('quoteDate')!.touched);
  }

  /**
   * Form Initialization
   */
  private createForm() {
    this.form = this._formBuilder.group({
      type: ['servicio'],
      vin: ['', [Validators.required, Validators.minLength(17), Validators.maxLength(17)]],
      status: ['progress'],
      quoteDate: ['', Validators.required],
      client_id: [''],
      brand_id: ['', Validators.required],
      carmodel_id: ['', Validators.required],  
      services: ['', Validators.required]    
    });
  }

  /**
   * Get client
   */
  private getClient(user_id: number) {
    this._servicesService.getClientByUser(user_id).subscribe(
      ({ code, status, client }: ClientServices) => {
        if (code === 200 && status === 'success') {
          this.form.patchValue({
            'client_id': client.id
          });

          // Assign client id global variable
          this._client_id = client.id;

          // Load vehicles
          this._myCarsService.getVehiclesByUser(client.id).subscribe(
            ({ code, status, vehicles }: VehicleUser) => {
              if (code === 200 && status === 'success') {                  
                vehicles.map(v => 
                  this.vehicles.push({ 
                    id: v.id, 
                    name: v.name,
                    carmodel: v.carmodel,
                    vin: v.vin
                  }) 
                );                 
              } 
            }
          );
        }
      }
    );
  }

  /**
   * Get Brands
   */
  private getBrands() {
    // this._venderTuAutoService.brands().subscribe(
    //   ({ code, brands }: Brands) => {
    //     this.brands = (code === 200) ? brands : [];
    //   }
    // );
  }

  /**
   * Get Models
   */
  public getModels(brand_id: number) {
    this._venderTuAutoService.getModels(brand_id).subscribe(
      ({ code, models }: DataModels) => {
        this.models = (code === 200) ? models : [];
      }
    );
  }

  /**
   * Get Services
   */
  private getServices() {
    this._servicesService.getServices().subscribe(
      ({ code, status, services }: Services) => {                 
        if (code === 200 && status === 'success') {
          this.services = services;
        }
      }
    );
  }

  /**
   * Set vehicle in form
   */
  public setVehicle(vehicle: Vehicle) {    
    this.form.patchValue({
      vin: vehicle.vin,
      brand_id: vehicle.carmodel.brand_id,
      carmodel_id: vehicle.carmodel.id
    });
  }

  /**
   * Form Information
   */
  public onSubmit() { 
    // Change spinner
    this.spinner = true;
    
    // Set new value in control date
    this.form.patchValue({
      quoteDate: this.datePipe.transform(this.form.get('quoteDate')!.value, "yyyy-MM-dd")
    });

    // Launch request
    this._servicesService.registerQuote(this.form.value).subscribe(
      ({ code, status, quote }: RegisterQuote) => {
        if (code === "200" && status === "success") {    
          // Check if exists ID of quote
          if (quote.id) {            
            let serviceQuoteForm!: UntypedFormGroup;
            
            // Create form
            serviceQuoteForm = this._formBuilder.group({
              quote_id: [quote.id],
              service_id: [this.form.get('services')?.value]
            });

            // Launch request for register service with the quote
            this._servicesService.registerServiceQuote(serviceQuoteForm.value).subscribe(
              ({ code, status }: RegisterServiceQuote) => {                  
                if (code === "200" && status === "success") {
                  // Animation request  
                  Swal.fire({
                    icon: 'success',
                    title: 'Registro Exitoso',
                    text: 'Cita de Servicio agendada exitosamente para el día: ' + this.datePipe.transform(this.form.get('quoteDate')!.value, "yyyy-MM-dd"),
                    showConfirmButton: true,
                    confirmButtonColor: '#EEB838',
                    timer: 3500         
                  });

                  // Change spinner
                  this.spinner = false;                                      

                  // Close bottom sheet
                  this._bottomSheetRef.dismiss();

                  // Redirect to saved process
                  this._router.navigateByUrl('/saved-process');
                } else {
                  // Change spinner
                  this.spinner = false;

                  // Animation request  
                  Swal.fire({
                    icon: 'error',
                    title: 'Oupps..',
                    text: 'Ocurrio un error al registrar los servicios requeridos en su cita, intente nuevamente.',
                    showConfirmButton: true,
                    confirmButtonColor: '#EEB838',
                    timer: 3500         
                  });

                  // Close bottom sheet
                  this._bottomSheetRef.dismiss();

                  // Redirect to error-process
                  this._router.navigateByUrl('/error-process');
                }
              }
            );
          }
        } else {
          // Change spinner
          this.spinner = false;

          // Animation request  
          Swal.fire({
            icon: 'error',
            title: 'Oupps..',
            text: 'Al parecer ocurrio un error al registrar su cita, intente nuevamente.',
            showConfirmButton: true,
            confirmButtonColor: '#EEB838',
            timer: 3500         
          });

          // Close bottom sheet
          this._bottomSheetRef.dismiss();

          // Redirect to error-process
          this._router.navigateByUrl('/error-process');
        }        
      }
    );       
  }

  /**
   * Remove service
   */
  public remove(service: Service): void {
    const index = this.services.indexOf(service);

    if (index >= 0) {
      this.services.splice(index, 1);
    }
  }

  /* 
   * Select service and clear input
   */
  public selected(event: MatAutocompleteSelectedEvent): void {        
    if (!this.existsInArray(this.services, event.option.value)) {      
      this.services.push(event.option.value);
    }

    this.serviceInput.nativeElement.value = '';
    this.serviceCtrl.setValue(null);
  }

  /**
   * Filter array services
   */
  private _filter(value: Service): Service[] {
    const filterValue = value.name.toLowerCase();
    return this.allServices.filter(service => service.name.toLowerCase().includes(filterValue));
  }

  /**
   * Function to search in arrangement    
   */
  private existsInArray(array: any[], element: any): boolean {   
    let exists = false;

    array.find(e => {
      if (e == element) {
        exists = true;        
      }
    });   

    return exists;
  } 
  
  /**
   * Helper function to convert text String to Uppercase
   * @param event keyup
   * @returns string
   */
  public convertMayus(event: any): string {
    return event.target.value = event.target.value.toUpperCase();
  }

}