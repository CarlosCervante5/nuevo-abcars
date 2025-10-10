import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

// Services
import { VendeTuAutoService } from '@services/vende-tu-auto.service'; 

// Pipes
import { DatePipe } from '@angular/common';

// Animations
import Swal from 'sweetalert2';
import { Title } from '@angular/platform-browser';

import { Brand, BrandsResponse, DetailResponse, Model, ModelsResponse, VehicleBrands} from '@interfaces/vehicle_data.interface';
import { VehicleService } from '@services/vehicle.service';
import { DetailService } from '@services/detail.service';
import { Vehicle } from '../../../comprar-autos/interfaces/detail/vehicle_data.interface';
import { firstValueFrom } from 'rxjs';
import { StregaService } from '@services/strega.service';
import { RegisterResponse } from '@interfaces/auth.interface';

@Component({
    selector: 'app-financing-form',
    templateUrl: './financing-form.component.html',
    styleUrls: ['./financing-form.component.css'],
    providers: [
        DatePipe,
        {
            provide: STEPPER_GLOBAL_OPTIONS,
            useValue: {
                showError: true
            }
        }
    ],
    standalone: false
})

export class FinancingFormComponent implements OnInit{
    // References of Help
    public spinner: boolean = false;
    public maxDate?: Date; 

    // References forms
    public form!: UntypedFormGroup;  

    private financing!: UntypedFormGroup;
    
    public priceMax = 3000000;
    public priceMin = 0;  
    public priceValue = this.priceMin;  

    // References "Hitch"  
    public hitchMax = 2400000;
    public hitchMin = 0;  
    public hitchValue: number = this.hitchMin;  

    // References arrays
    public years: number[] = [];
    public models: Model[] = [];
    public brands: Brand[] = [];

    public userAgent: string = '';
    public selected = '60';
    public vin!:string;
    public userId!:string;
    public vehicle!: Vehicle;

    // Card Financings
    @ViewChild('financingm12') financingm12!: ElementRef<HTMLInputElement>;
    @ViewChild('financingm24') financingm24!: ElementRef<HTMLInputElement>;
    @ViewChild('financingm48') financingm48!: ElementRef<HTMLInputElement>;
    @ViewChild('financingm60') financingm60!: ElementRef<HTMLInputElement>;

    constructor(
        private _router: Router,
        private _formBuilder: UntypedFormBuilder, 
        private _activatedRoute: ActivatedRoute,
        private titleService: Title,
        private _vehicleService: VehicleService,
        private _detailService: DetailService,
        private _stregaService: StregaService,


    ) { 
        // Set Title View
        this.titleService.setTitle('Precalificar para financiamiento | Proceso'); 

        let year = new Date().getFullYear();
        this.years = Array.from({ length: 9 }, (_, index) => year - index);

        this.createform();

        this.getBrands();

        this._activatedRoute.params
        .subscribe({
            next: (params) => {
                this.scrollTop();
                this.vin = params['vin'];
            }
        });

    }

    ngOnInit(): void {
        this.userAgent = window.navigator.userAgent;

        this.scrollTop();

        if(this.vin != undefined){

            this.getVehicle(this.vin);
        }
    }

    scrollTop() {
        var scrollElem = document.querySelector('#moveTop');
        scrollElem!.scrollIntoView();  
    }

    /**
     * Getters Inputs Check
     */
    public fieldInvalid( field: string) {
        return this.form.get(field)!.invalid && (this.form.get(field)!.dirty || this.form.get(field)!.touched);
    }

    get ineFrontInvalid() {
        return this.form.get('ine_front')?.value === null;
    }

    get ineBackInvalid() {
        return this.form.get('ine_back')?.value === null;
    }

    get addressProofInvalid() {
        return this.form.get('address_proof')?.value === null;
    }

    /**
     * Form Initialization
     */
    private createform() {
        this.form = this._formBuilder.group({
            
            sale_price: [0, [Validators.required, Validators.min(1)]],
            offer_price: [0, [Validators.required, Validators.min(1)]],
            model_year: [new Date().getFullYear().toString(), [Validators.required]],
            vehicle_brand: ['', [Validators.required]],
            vehicle_model: ['', [Validators.required]],
            monthly_fees: ['', [Validators.required]],
            
            name: ['', [Validators.required, Validators.pattern("[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ ]+")]],
            last_name: ['', [Validators.pattern("[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ ]+")]],
            gender: ['', [Validators.required]],
            email: ['', [Validators.required, Validators.pattern("[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$")]],
            rfc: ['', [Validators.required]],
            phone: ['', [Validators.required, Validators.pattern("[0-9]{10}"), Validators.minLength(10), Validators.maxLength(10)]],
            marital_status: ['', [Validators.required]],
            educational_level: ['', [Validators.required]],
            address: ['', [Validators.required]],
            address_number: ['', [Validators.required, Validators.pattern("[0-9]{1,10}"), Validators.minLength(1), Validators.maxLength(10)]],
            neighborhood: ['', [Validators.required]],
            zip_code: ['', [Validators.required, Validators.pattern("[0-9]{1,10}"), Validators.minLength(1), Validators.maxLength(10)]],
            state: ['', [Validators.required]],
            district: ['', [Validators.required, Validators.pattern("[a-zA-Z ]+")]],
            salary: ['', [Validators.required, Validators.pattern("[0-9]{1,10}"), Validators.minLength(1), Validators.maxLength(10)]],
            role: ['', [Validators.required, Validators.pattern("[a-zA-Z ]+")]],
    
            employment_status: ['', [Validators.required]],
            work_name: ['', [Validators.minLength(1)]],
            work_phone: [''],
            work_address: ['',],
            work_address_number: ['',],
            work_neighborhood: [''],
            work_state: [''],
            work_district: [''],
            work_zip_code: ['', [Validators.pattern("[0-9]{1,10}"), Validators.minLength(1), Validators.maxLength(10)]],

            ine_front: [null, [Validators.required]],
            ine_back: [null, [Validators.required]],
            address_proof: [null],
            
            checkbox: [false, Validators.required]
        });
    }

    /**
     * Get Vehicle by vin in url
     */
    private getVehicle(vin: string){
        this._detailService.getVehicleDetail(vin)
        .subscribe({
            next: (vehicleData: DetailResponse) => {
                
                this.vehicle = vehicleData.data;

                this.getModelsByBrand(this.vehicle.brand.name);

                this.form.patchValue({
                    sale_price: this.vehicle.sale_price,
                    vehicle_brand: this.vehicle.brand.name.toString(),
                    vehicle_model: this.vehicle.model.name.toString(),
                    model_year: this.vehicle.model.year.toString()
                });
            }
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

    public getModelsByBrand(brand: string): void {
    
        this.form.patchValue({ vehicle_brand: brand });

        this._vehicleService.getModelsByBrand(brand)
        .subscribe({
            next: (modelResponse: ModelsResponse) => {
                this.models = modelResponse.data.line_models;
            }
        });
    }

    private createLead() {
        try {

            this.financing = this._formBuilder.group({
                
                name: this.form.get('name')?.value,
                last_name: this.form.get('last_name')?.value,
                gender: this.form.get('gender')?.value,
                email: this.form.get('email')?.value,
                phone: this.form.get('phone')?.value,
                rfc: this.form.get('rfc')?.value,
                marital_status: this.form.get('marital_status')?.value,
                educational_level:  this.form.get('educational_level')?.value,
                address:  this.form.get('address')?.value + ' ' +  this.form.get('address_number')?.value,
                neighborhood:  this.form.get('neighborhood')?.value,
                zip_code:  this.form.get('zip_code')?.value,
                state:  this.form.get('state')?.value,
                district:  this.form.get('district')?.value,

                q_model_interest: this.form.get('vehicle_model')?.value + ' ' +  this.form.get('model_year')?.value + ' ' +  this.form.get('sale_price')?.value,
                q_brand_interest: this.form.get('vehicle_brand')?.value,
                q_initial_investment: this.form.get('offer_price')?.value,
                q_time_to_buy: this.form.get('monthly_fees')?.value, 
                q_comments: ((this.vin != undefined)) ? 'Auto de interes: http://abcars.mx/compra-tu-auto/detail/'+this.vin: '',
                
                opportunity_type: 'lead',
                dealership_name: 'Chevrolet Serdán',
                campaign_name: 'Página ABCars',
                campaign_channel: 'WEB ABCars',
                campaign_source: 'Solicitud de financiamiento',
            });


            
            this._stregaService.createLead( this.financing.value )
            .subscribe({
                next: ( response: RegisterResponse ) => {
                    
                    Swal.fire({
                        icon: 'success',
                        title: '¡FELICIDADES!',
                        text: 'Registro exitoso, estas más cerca de obtener tu financiamiento y muy pronto nos pondremos en contacto contigo.',
                        showConfirmButton: true,
                        confirmButtonColor: '#EEB838',
                        timer: 5000
                    }).then(() => {
                        window.location.reload();
                    });
    
                },
                error: () => {
                    Swal.fire({
                        icon: 'error',
                        title: 'Oupps..',
                        text: 'Al parecer ocurrio un error al registrar la precalificación para financiamiento, verifique y vuelva a intentarlo.',
                        showConfirmButton: true,
                        confirmButtonColor: '#EEB838',
                        timer: 3500
                      });

                      this.spinner = false;

                }
            });

        } catch (error: any) {
            console.error('Error al crear el cliente de valuación:', error);
            throw new Error('Error en la creación del cliente.');
        }
    }

    public onSubmit() {    
        try {

            this.spinner = true;

            this.createLead();
            
            
        } catch (error: any) {

            this.spinner = false;

            Swal.fire({
                icon: 'error',
                title: 'Oupps..',
                text: 'Al parecer ocurrio un error al registrar la precalificación para financiamiento, verifique y vuelva a intentarlo.',
                showConfirmButton: true,
                confirmButtonColor: '#EEB838',
                timer: 3500
              });
        }
    }

    /**
     * Assign image form
     */
    public onFileChange(file: any, type: string) {
        if(file.target.files.length > 0) {
        
            if (type === 'front') {
            
                this.form.get('ine_front')?.setValue(file.target.files[0], { emitModelToViewChange: false });
            }

            if (type === 'back') {
                
                this.form.get('ine_back')?.setValue(file.target.files[0]);
            }

            if (type === 'address') {
                
                this.form.get('address_proof')?.setValue(file.target.files[0]);
            }
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

    /**
     * Helper function to convert text String to Uppercase
     * @param event keyup
     * @returns string
     */
    public convertMayus(event: any): string {
        return event.target.value = event.target.value.toUpperCase();
    }

    /**
     * Calculate offer_price
     */
    public SetMinHitch() {
        
        let minprice = 0;
        const percentage = this.form.get('monthly_fees')?.value;

        switch (percentage) {
            case '60':
                minprice = this.form.get('sale_price')?.value * 0.20;
            break;

            case '48':
                minprice = this.form.get('sale_price')?.value * 0.25;
            break;

            case '24':
                minprice = this.form.get('sale_price')?.value * 0.35;
            break;

            case '12':
                minprice = this.form.get('sale_price')?.value * 0.35;
            break;
        }

        this.priceMin = minprice;

        this.priceValue = this.form.get('sale_price')?.value * .20;
    }

    /**
     * Calculate offer_price
     */
    public CalculateOffer(percentage: number) {
        
        const minOffer = this.form.get('sale_price')?.value * percentage;
        
        this.priceMin = minOffer;

        this.form.controls['offer_price'].setValue(Number(this.form.get('sale_price')?.value * percentage).toFixed());
    }
}