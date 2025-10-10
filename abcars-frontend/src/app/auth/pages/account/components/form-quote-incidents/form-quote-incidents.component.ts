import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';

// Components
import { IncidentsComponent } from '../../pages/incidents/incidents.component';

// Services
import { IncidentsService } from '../../services/incidents.service';
import { ServicesService } from '../../services/services.service';

// Interfaces 
import { Service, Services } from '../../interfaces/services.interface';
import { ClientData } from '../../interfaces/client.interface';
import { VehiclesPurchased, Vehicle } from '../../interfaces/vehicles-purchased.interface';
import { ServiceIncident } from './../../interfaces/service-incident.interface';
import { VehicleIncident } from './../../interfaces/vehicle-incident.interface';

@Component({
    selector: 'app-form-quote-incidents',
    templateUrl: './form-quote-incidents.component.html',
    styles: [`
    mat-form-field {
      width: 100%;
    }
  `],
    standalone: false
})

export class FormQuoteIncidentsComponent implements OnInit {
  public user_id!: number;
  public client_id!: number;

  // References of Help
  public spinner: boolean = false;  
  public changeInput: boolean = true;

  // References Form
  public form!: UntypedFormGroup;
  public services: Service[] = [];
  public vehicles: Vehicle[] = [];
  constructor(
    private _formBuilder: UntypedFormBuilder,
    private _servicesService: ServicesService,
    private _incidentsService: IncidentsService,
    private _router: Router,
    private _bottomSheetRef: MatBottomSheetRef<IncidentsComponent>
  ) { 
    // Get id user in session storage
    const user = JSON.parse(localStorage.getItem('user')!);
    
    // Launch get vehicles
    this.user_id = user.id;
    // Initialization of Form
    this.createForm(); 
  }

  ngOnInit(): void {
    // Calling the initial functions of the form    
    this.getServices();
    this._incidentsService.getClient( this.user_id )
        .subscribe(
          ( clientData: ClientData ) => {
            this.client_id = clientData.client.id;
            this.getVehiclesPurchased(); 
          }
        );
    
  }

  /**
   * Getters Inputs Check
   */
  get complainInvalid() {
    return this.form.get('complain')!.invalid && (this.form.get('complain')!.dirty || this.form.get('complain')!.touched);
  }

  get nameInvalid() {
    return this.form.get('name')!.invalid && (this.form.get('name')!.dirty || this.form.get('name')!.touched);
  }

  get vehicleInvalid() {
    return this.form.get('vehicle')!.invalid && (this.form.get('vehicle')!.dirty || this.form.get('vehicle')!.touched);
  }

  get serviceInvalid() {
    return this.form.get('service')!.invalid && (this.form.get('service')!.dirty || this.form.get('service')!.touched);
  }

  get descriptionInvalid() {
    return this.form.get('description')!.invalid && (this.form.get('description')!.dirty || this.form.get('description')!.touched);
  }

  /**
   * Form Initialization
   */
  private createForm() {
    this.form = this._formBuilder.group({
      complain: ['', Validators.required],
      name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(50)]],
      vehicle: ['', Validators.required],
      service: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(500)]]
    });
  }

  /*
   * Get services by user
   */
  private getServices() {
    this._servicesService.getServices().subscribe(
      ({ code, status, services }: Services) => {         
        this.services = (code === 200 && status === 'success') ? services : [];          
      }
    );
  }

  private getVehiclesPurchased(){
    this._incidentsService.getVehiclesPurchased( this.client_id )
        .subscribe(
          ( response:VehiclesPurchased ) => {
            this.vehicles = response.vehicles;
          }
        );
  }

  public saleOrService( argumento: boolean ){
    this.changeInput = argumento;
    if( argumento ){
      this.form.controls['vehicle'].setValue('');
      this.form.controls['service'].setValue('false');
    }else{
      this.form.controls['vehicle'].setValue('false');
      this.form.controls['service'].setValue('');
    }
  }

  /**
   * Form Information
   */
  public onSubmit() { 
    if( this.form.get('service')!.value === 'false' ){
      this._incidentsService.setVehicleIncident(
        this.form.get('name')!.value,
        this.form.get('description')!.value,
        this.client_id,
        this.form.get('vehicle')!.value 
      ).subscribe(
        ( response:VehicleIncident ) => {
          // Close bottom sheet
          this._bottomSheetRef.dismiss();
          if( response.incident != undefined ){
            this._router.navigateByUrl('/saved-process');
          }else{
            this._router.navigateByUrl('/error-process');
          }
        }
      );
    }else{
      this._incidentsService.setServiceIncident(
        this.form.get('name')!.value,
        this.form.get('description')!.value,
        this.client_id,
        this.form.get('service')!.value
      ).subscribe(
        ( response:ServiceIncident ) => {
          // Close bottom sheet
          this._bottomSheetRef.dismiss();
          if( response.incident != undefined ){
            this._router.navigateByUrl('/saved-process');
          }else{
            this._router.navigateByUrl('/error-process');
          }           
        }
      );
    }
    
  }

}
