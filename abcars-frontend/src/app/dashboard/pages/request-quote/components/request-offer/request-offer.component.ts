import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DetailService } from '@services/detail.service';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { DetailResponse, ImageCarousel, Vehicle } from '@interfaces/vehicle_data.interface';
import { register } from 'swiper/element/bundle';
import { RegisterResponse } from '@interfaces/auth.interface';
import { firstValueFrom } from 'rxjs';
import { VehicleService } from '@services/vehicle.service';
import { StregaService } from '@services/strega.service';
import Swal from 'sweetalert2';

register();

@Component({
    selector: 'app-request-offer',
    templateUrl: './request-offer.component.html',
    styleUrls: ['./request-offer.component.css'],
    standalone: false
})
export class RequestOfferComponent implements OnInit { 
    // References
    public vin: string = '';
    public vehicle!: Vehicle;
    public form!: UntypedFormGroup;
    public disabled: boolean = true;
    public imagesForSlider: ImageCarousel[] = [];
    public baseUrl: string = environment.baseUrl;
    public priceOffer: boolean = false;
    public description: string = '';
    public descriptions: string[] = [];
    public spinner: boolean = false;
    execute!:string;
    private requestForm!: UntypedFormGroup;


    @ViewChild('myModal') modal!: ElementRef;
    @ViewChild('myImg') img!: ElementRef;
    @ViewChild('img01') modalImg!: ElementRef; 
    @ViewChild('caption') caption!: ElementRef;
    
    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _activatedRoute: ActivatedRoute,
        private _detailService: DetailService,
        private _router: Router,
        private _vehicleService: VehicleService,
        private _stregaService: StregaService,
    ){
        // Form Initialization
        this.createFormRequestOfferGroup();

        this._activatedRoute.params
            .subscribe({
                next: (params) => {
                    this.scrollTop();
                    this.vin = params['vin'];
                    if (this.vin != undefined) {
                        this.getVehicle(this.vin);
                    }
                }
            });
    }

    ngOnInit(): void {
        
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

    get phoneInvalid() {
        return this.form.get('phone')!.invalid && (this.form.get('phone')!.dirty || this.form.get('phone')!.touched);
    }

    get clientPriceOfferInvalid() {
        return this.form.get('clientPriceOffer')!.invalid && (this.form.get('clientPriceOffer')!.dirty || this.form.get('clientPriceOffer')!.touched);
    }

    scrollTop(){
        var scrollElem = document.querySelector('#moveTop');
        scrollElem!.scrollIntoView();
    }

    private getVehicle(vin: string){
        this._detailService.getVehicleDetail(vin)
            .subscribe({
                next: (vehicleData: DetailResponse) => {
                    this.vehicle = vehicleData.data;
                    this.imagesForSlider = [];
                    this.priceOffer = this.vehicle.offer_price != null ? true : false;
                    this.description = this.vehicle.description;

                    this.form.patchValue({
                        body: this.vehicle.body.name.toString(),
                        brand: this.vehicle.brand.name.toString(),
                        model: this.vehicle.model.name.toString(),
                    });

                    this.form.get('body')?.disable();
                    this.form.get('brand')?.disable();
                    this.form.get('model')?.disable();
                   
                    this.vehicle.images.map( imagen => {
                        this.imagesForSlider.push(
                            { path: imagen.service_image_url }
                        );
                    });
                    
                    if (this.description != null) {
                        let d = this.description.includes('\n\n') ? true : false;
                        if (d) {
                            this.descriptions = this.description.split('\n\n');
                            this.descriptions.pop();
                        }else {
                            this.descriptions = this.description.split('\n');
                            this.descriptions.pop();
                        }
                    }else {
                        this.descriptions = ["Lo sentimos, este vehículo no cuenta con alguna descripción activa."]
                    }
                }
            });
    }

    private createFormRequestOfferGroup(){
        this.form = this._formBuilder.group({
            body: ['', [Validators.required]],
            brand:['', [Validators.required]],
            model:['', [Validators.required]],
            name:['', [Validators.required, Validators.pattern("[a-zA-Z ]+")]],
            last_name: ['', [Validators.required, Validators.pattern("[a-zA-Z ]+")]],
            email: ['', [Validators.required, Validators.pattern("[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$")]],
            phone: ['', [Validators.required, Validators.pattern("[0-9]{10}"), Validators.minLength(10), Validators.maxLength(10)]],
            clientPriceOffer: [''],
            checkbox: [false, Validators.required]
        });
    }

    public maxLengthCheck(object: any) {
        if (object.value.length > object.maxLength) {
          object.value = object.value.slice(0, object.maxLength)
        }
    }

    public async onSubmit() {    
        try {

            this.spinner = true;

            const response = await this.createLead();

            if (response) {
                
                Swal.fire({
                    icon: 'success',
                    title: 'Oferta enviada exitosamente.',
                    timer: 2000
                });

                this.spinner = false;

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

    private async createLead(): Promise<RegisterResponse | null> {
        try {

            this.requestForm = this._formBuilder.group({
                name: this.form.get('name')?.value,
                last_name: this.form.get('last_name')?.value,
                email: this.form.get('email')?.value,
                phone: this.form.get('phone')?.value,
                q_model_interest: this.form.get('model')?.value + ' ' +  this.form.get('body')?.value,
                q_brand_interest: this.form.get('brand')?.value,
                q_initial_investment: this.form.get('clientPriceOffer')?.value,
                q_comments: this.form.get('comment')?.value,
                opportunity_type: 'lead',
                dealership_name: 'Chevrolet Serdán',
                campaign_name: 'Página ABCars',
                campaign_channel: 'WEB ABCars',
                campaign_source: 'Oferta por vehículo',
            });
            
            return await firstValueFrom( this._stregaService.createLead( this.requestForm.value ));

        } catch (error: any) {
            console.error('Error al crear el cliente de valuación:', error);
            throw new Error('Error en la creación del cliente.');
        }
    }

    public changeImageSelected (img: string, i: number){
        
        let nImage: ImageCarousel[] = [];
        let ind = 0;

        //se busca la imagen seleccionada, y se obtiene su posición actual
        for (let j = 0; j < this.imagesForSlider.length; j++) {
            if(img == this.imagesForSlider[j].path){
                ind = j;
            }
        }

        //se guardan las imagenes posteriores a la seleccionada
        for (let h = ind; h < this.imagesForSlider.length; h++) {
            nImage.push(this.imagesForSlider[h]);
        }

        //se guardan las imagenes anteriores a la seleccionada
        for (let j = 0; j < ind; j++) {
            nImage.push(this.imagesForSlider[j]);
        }

        this.imagesForSlider = nImage;
    }

    showModal( src: string) {   
        let imagen = src;
        let legal = "";
    
        this.modal.nativeElement.style.display = "grid";
        this.modalImg.nativeElement.src = imagen;  
        this.caption.nativeElement.innerHTML = legal ;
    }
    
    closeModal( message:string ) {    
        if( message == "no" ) {
            this.execute = 'no';

        }else if ( message == "yes" && this.execute == 'no' ){
            this.execute = 'processing';

        }else {
            this.execute = 'yes';
            
        }

        if( this.execute == 'yes' ){
            this.modal.nativeElement.style.display = "none";
        }    
    }
}
