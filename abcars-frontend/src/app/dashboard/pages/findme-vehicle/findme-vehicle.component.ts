import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

// Providers
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { VehicleService } from '@services/vehicle.service';
import { Brand, Model, BrandsResponse, ModelsResponse } from '@interfaces/vehicle_data.interface';
import { RegisterResponse } from '@interfaces/auth.interface';
import { firstValueFrom } from 'rxjs';
import { AdminService } from '@services/admin.service';
import Swal from 'sweetalert2';
import { StregaService } from '@services/strega.service';


@Component({
    selector: 'app-findme-vehicle',
    templateUrl: './findme-vehicle.component.html',
    styleUrls: ['./findme-vehicle.component.css'],
    providers: [{
            provide: STEPPER_GLOBAL_OPTIONS, useValue: { showError: true }
        }],
    standalone: false
})

export class FindmeVehicleComponent implements OnInit {

    public spinner: boolean = false;  
    public form!: UntypedFormGroup;
    private requestForm!: UntypedFormGroup;

  // References Arrays
    public brands: Brand[] = [];
    public models: Model[] = [];
    public years: number[] = [];

    constructor(
        private _router: Router,
        private _formBuilder: UntypedFormBuilder,
        private titleService: Title,
        private metaService: Meta,
        private _vehicleService: VehicleService,
        private _stregaService: StregaService,


    ) { 
        // Set Title View
        this.titleService.setTitle('Búscame un auto');
        this.metaService.updateTag({ name: 'description', content: '¿No encuentras el auto que quieres? Nosotros lo buscamos por ti' });

        this.formInit();
    }

    ngOnInit(): void {
        this.scrollTop();
        this.getBrands(); 

        let year = new Date().getFullYear();

        for (let i = year; i > year-10; i--) {      
            this.years.push(i);      
        }

    }

    scrollTop() {
        window.scrollTo(0, 0);
    }

    get nameInvalid() {
        return this.form.get('name')!.invalid && (this.form.get('name')!.dirty || this.form.get('name')!.touched);
    }

    get lastnameInvalid() {
        return this.form.get('last_name')!.invalid && (this.form.get('last_name')!.dirty || this.form.get('last_name')!.touched);
    }

    get emailInvalid() {
        return this.form.get('email')!.invalid && (this.form.get('email')!.dirty || this.form.get('email')!.touched);
    }

    get phoneLength() {
        let phone = this.form.get('phone')!.value;
        return this.form.get('phone')!.touched && (phone.length < 10 || phone.length > 10); 
    }

    get brandInvalid() {
        return this.form.get('brand')!.invalid && (this.form.get('brand')!.dirty || this.form.get('brand')!.touched);
    }

    get modelInvalid() {
        return this.form.get('model')!.invalid && (this.form.get('model')!.dirty || this.form.get('model')!.touched);
    }

    get yearInvalid() {
        return this.form.get('year')!.invalid && (this.form.get('year')!.dirty || this.form.get('year')!.touched);
    }

    get versionInvalid() {
        return this.form.get('version')!.invalid && (this.form.get('version')!.dirty || this.form.get('version')!.touched);
    }

    get transmissionInvalid() {
        return this.form.get('transmission')!.invalid && (this.form.get('transmission')!.dirty || this.form.get('transmission')!.touched);
    }

    get mileageInvalid() {
        return this.form.get('mileage')!.invalid && (this.form.get('mileage')!.dirty || this.form.get('mileage')!.touched);
    }

    
    get commentInvalid() {
        return this.form.get('comment')!.invalid && (this.form.get('comment')!.dirty || this.form.get('comment')!.touched);
    }

    private formInit() {
        this.form = this._formBuilder.group({
            name: ['', [Validators.required, Validators.pattern("[a-zA-Z ]+")]],
            last_name: ['', [Validators.required, Validators.pattern("[a-zA-Z ]+")]],
            email: ['', [Validators.required, Validators.pattern("[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$")]],
            phone: ['', [Validators.required, Validators.pattern("[0-9]+"), Validators.minLength(10), Validators.maxLength(10)]],
            brand: ['', Validators.required],
            model: ['', Validators.required],
            year: ['', Validators.required],
            version: ['', Validators.required],
            transmission: ['', Validators.required],
            mileage: ['', [Validators.required, Validators.pattern("[0-9]{1,10}"), Validators.minLength(1), Validators.maxLength(10)]],
            comment: ['', Validators.required],
            checkbox : [false, Validators.required],   
        });
    }

    public getBrands(): void {
        this._vehicleService.getBrands()
        .subscribe({
            next: (brandResponse: BrandsResponse) => {
            this.brands = brandResponse.data.vehicle_brands;
            }
        });
    }

    public onBrandSelected(brand: string): void {
        const selectedBrand = brand;
        
        this.form.patchValue({ brand: selectedBrand });

        this._vehicleService.getModelsByBrand(selectedBrand)
        .subscribe({
            next: (modelResponse: ModelsResponse) => {
                this.models = modelResponse.data.line_models;
            }
        });
    }

    private async createLead(): Promise<RegisterResponse | null> {
        try {

            this.requestForm = this._formBuilder.group({
                name: this.form.get('name')?.value,
                last_name: this.form.get('last_name')?.value,
                email: this.form.get('email')?.value,
                phone: this.form.get('phone')?.value,
                q_model_interest: this.form.get('model')?.value + ' ' +  this.form.get('year')?.value + ' ' +  this.form.get('version')?.value + ' ' + this.form.get('transmission')?.value,
                q_brand_interest: this.form.get('brand')?.value,
                q_comments: this.form.get('comment')?.value,
                opportunity_type: 'lead',
                dealership_name: 'Chevrolet Serdán',
                campaign_name: 'Página ABCars',
                campaign_channel: 'WEB ABCars',
                campaign_source: 'Buscame-un-auto',
            });
            
            return await firstValueFrom( this._stregaService.createLead( this.requestForm.value ));

        } catch (error: any) {
            console.error('Error al crear el cliente de valuación:', error);
            throw new Error('Error en la creación del cliente.');
        }
    }

    public async onSubmit() {    
        try {

            this.spinner = true;

            const response = await this.createLead();

            if (response) {
                
                Swal.fire({
                    icon: 'success',
                    title: 'Cita creada exitosamente.',
                    timer: 2000
                });

                this.spinner = false;

                this.reloadPage();

            }
            
        } catch (error: any) {

            this.spinner = false;

            Swal.fire({
                icon: 'error',
                title: 'Lo sentimos, hubo un error',
                text: 'Hubo un problema al procesar la solicitud, inténtelo más tarde.' + error
            });
        }

    }

    /**
     * Checking length input   
     * @param object any input
     */
    public maxLengthCheck(object: any) {   
        if (object.value.length > object.maxLength) {
        object.value = object.value.slice(0, object.maxLength)
        }
    }


    reloadPage() {
        window.location.reload();
    }

}
