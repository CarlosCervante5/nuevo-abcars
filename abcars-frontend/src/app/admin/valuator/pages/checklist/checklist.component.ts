import { Component, ElementRef, HostListener, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { concatMap } from 'rxjs';

// Angular Material
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatBottomSheet } from '@angular/material/bottom-sheet';

// Alert
import Swal from 'sweetalert2';

// Services
import { ChecklistService } from '@services/checklist.service';
import { DetailValuationService } from '@services/detail-valuation.service';

// Interfaces
import { Checklist, GetChecklist, GralResponse } from '@interfaces/getChecklist.interface';
import { GetDetailValuation } from '@interfaces/getDetailValuation.interface';
import { GetUsersByRol, UserTechnicians, Overview } from '@interfaces/admin.interfaces';


import { ExternalRevisionPictureComponent } from '../../components/external-revision-picture/external-revision-picture.component';
import { InternalRevisionPictureComponent } from '../../components/internal-revision-picture/internal-revision-picture.component';
import { MatSelectChange } from '@angular/material/select';
// import { extendChartView } from 'echarts';
import { SparePartsFormComponent } from '../../components/spare-parts-form/spare-parts-form.component';
import { BodyworkPaintValuatorFormComponent } from '../../components/bodywork-paint-valuator-form/bodywork-paint-valuator-form.component';

@Component({
    selector: 'app-checklist',
    templateUrl: './checklist.component.html',
    styleUrls: ['./checklist.component.css'],
    standalone: false,
    encapsulation: ViewEncapsulation.None
})
export class ChecklistComponent implements OnInit {
    @ViewChild('inputdate') inputdate!: ElementRef<HTMLInputElement>
    @ViewChild('dateLastMaintenance') dateLastMaintenance!: ElementRef<HTMLInputElement>
    
    public spinner: boolean = false;
    public extReviewSpinner:boolean = false;
    public intReviewSpinner:boolean = false;
    public dataExt:boolean = false;
    public save_update:boolean = false;
    public saveUpdateMechanic: boolean = false;
    public saveUpdateCert:boolean = false;
    public uuidTechnician!: number;

    // References Form
    public customerInformationForm!: UntypedFormGroup;
    public mechanicElectricForm!: UntypedFormGroup;
    public externalReviewForm!: UntypedFormGroup;
    public internalReviewForm!: UntypedFormGroup;
    public vehicleCertificationForm!: UntypedFormGroup;

    public years: number[] = [];
    public checklist: Checklist[] = [];
    public checklistMechanicElectric: Checklist[] = [];
    public checklistExternalReview: Checklist[] = [];
    public checklistInternalReview: Checklist[] = [];
    public checklistCertification: Checklist[] = [];
    public technicians: UserTechnicians[] = [];
    //edición para guardar uno por uno de los checks
    public valuation_uuid = '';
    inputFocus = false;
    public inputValor = '';
    public check_uuid ='';

    public btn_follow:boolean = false;
    public btn_save:boolean = true;

    // References Overview para el encabezado
    public itemOverview: Overview;

    private role = localStorage.getItem('role') || '';

    get baseUrl(): string {
        return this.role === 'seller' ? '/admin/seller' : '/admin/valuator';
    }

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _activatedRoute: ActivatedRoute,
        private _bottomSheet: MatBottomSheet,
        private _checklistService: ChecklistService,
        private _detailValuationService: DetailValuationService,
        private _router: Router
    ) {
        const base = this.role === 'seller' ? '/admin/seller' : '/admin/valuator';
        const roleLabel = this.role === 'seller' ? 'Vendedor' : 'Valuator';

        // Inicializar itemOverview
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            this.itemOverview = {
                user: {
                    name: user.name || user.nickname || 'Usuario',
                    surname: user.surname || '',
                    role: roleLabel,
                    email: user.email || '',
                    picturepath: ''
                },
                pages: [
                    {
                        title: 'Citas valuación',
                        icon: 'fi fi-rr-car',
                        permalink: base + '/appointment'
                    }
                ]
            };
        } catch (error) {
            // Fallback si hay error al parsear
            this.itemOverview = {
                user: {
                    name: 'Usuario',
                    surname: '',
                    role: roleLabel,
                    email: '',
                    picturepath: ''
                },
                pages: [
                    {
                        title: 'Citas valuación',
                        icon: 'fi fi-rr-car',
                        permalink: base + '/appointment'
                    }
                ]
            };
        }

        this.customerInformationFormInit();
        this.mechanicElectricForm = this._formBuilder.group({});
        this.externalReviewForm = this._formBuilder.group({});
        this.internalReviewForm = this._formBuilder.group({});
        this.vehicleCertificationForm = this._formBuilder.group({});
    }

    ngOnInit(): void {
        // Years of vehicles allowed
        let year = new Date().getFullYear()+1;
        for (let i = year; i > year-23; i--) {
            this.years.push(i);
        }
        this.getChecklist(this._activatedRoute.snapshot.params.uuid_valuation);
        this.getDetailValuation(this._activatedRoute.snapshot.params.uuid_valuation);
        this.getTechnicians();
        this.valuation_uuid = this._activatedRoute.snapshot.params.uuid_valuation;
    }

    get nameInvalid() {
        return this.customerInformationForm.get('name')!.invalid && (this.customerInformationForm.get('name')!.dirty || this.customerInformationForm.get('name')!.touched);
    }
    get lastNameInvalid() {
        return this.customerInformationForm.get('last_name')!.invalid && (this.customerInformationForm.get('last_name')!.dirty || this.customerInformationForm.get('last_name')!.touched);
    }
    get phoneLength() {
        let phone_1 = this.customerInformationForm.get('phone_1')!.value;
        return this.customerInformationForm.get('phone_1')!.touched && (phone_1.length < 10 || phone_1.length > 10);
    }
    get distributorInvalid() {
        return this.customerInformationForm.get('dealership_name')!.invalid && (this.customerInformationForm.get('dealership_name')!.dirty || this.customerInformationForm.get('dealership_name')!.touched);
    }
    get origincountryInvalid() {
        return this.customerInformationForm.get('country_of_origin')!.invalid && (this.customerInformationForm.get('country_of_origin')!.dirty || this.customerInformationForm.get('country_of_origin')!.touched);
    }
    get transmissionInvalid() {
        return this.customerInformationForm.get('transmission')!.invalid && (this.customerInformationForm.get('transmission')!.dirty || this.customerInformationForm.get('transmission')!.touched);
    }
    get enginesuctionInvalid() {
        return this.customerInformationForm.get('intake_engine')!.invalid && (this.customerInformationForm.get('intake_engine')!.dirty || this.customerInformationForm.get('intake_engine')!.touched);
    }
    get startstopInvalid() {
        return this.customerInformationForm.get('auto_start_stop')!.invalid && (this.customerInformationForm.get('auto_start_stop')!.dirty || this.customerInformationForm.get('auto_start_stop')!.touched);
    }
    get dateInvalid() {
        return this.customerInformationForm.get('scheduled_date')!.invalid && (this.customerInformationForm.get('scheduled_date')!.dirty || this.customerInformationForm.get('scheduled_date')!.touched);
    }
    get vinInvalid() {
        return this.customerInformationForm.get('vin')!.invalid && (this.customerInformationForm.get('vin')!.dirty || this.customerInformationForm.get('vin')!.touched);
    }
    get brandInvalid() {
        return this.customerInformationForm.get('brand')!.invalid && (this.customerInformationForm.get('brand')!.dirty || this.customerInformationForm.get('brand')!.touched);
    }
    get modelInvalid() {
        return this.customerInformationForm.get('model')!.invalid && (this.customerInformationForm.get('model')!.dirty || this.customerInformationForm.get('model')!.touched);
    }
    get versionInvalid() {
        return this.customerInformationForm.get('version')!.invalid && (this.customerInformationForm.get('version')!.dirty || this.customerInformationForm.get('version')!.touched);
    }
    get yearInvalid() {
        return this.customerInformationForm.get('year')!.invalid && (this.customerInformationForm.get('year')!.dirty || this.customerInformationForm.get('year')!.touched);
    }
    get mileageInvalid() {
        return this.customerInformationForm.get('mileage')!.invalid && (this.customerInformationForm.get('mileage')!.dirty || this.customerInformationForm.get('mileage')!.touched);
    }
    get colorInvalid() {
        return this.customerInformationForm.get('exterior_color')!.invalid && (this.customerInformationForm.get('exterior_color')!.dirty || this.customerInformationForm.get('exterior_color')!.touched);
    }
    get cylinderInvalid() {
        return this.customerInformationForm.get('cylinders')!.invalid && (this.customerInformationForm.get('cylinders')!.dirty || this.customerInformationForm.get('cylinders')!.touched);
    }
    get engineInvalid() {
        return this.customerInformationForm.get('engine_type')!.invalid && (this.customerInformationForm.get('engine_type')!.dirty || this.customerInformationForm.get('engine_type')!.touched);
    }
    get appraiserTechnicianInvalid() {
        return this.customerInformationForm.get('appraiserTechnician')!.invalid && (this.customerInformationForm.get('appraiserTechnician')!.dirty || this.customerInformationForm.get('appraiserTechnician')!.touched);
    }
    
    get lineInvalid() {
        return this.customerInformationForm.get('line')!.invalid && (this.customerInformationForm.get('line')!.dirty || this.customerInformationForm.get('line')!.touched);
    }
    
    get bodyInvalid() {
        return this.customerInformationForm.get('body')!.invalid && (this.customerInformationForm.get('body')!.dirty || this.customerInformationForm.get('body')!.touched);
    }

    private customerInformationFormInit() {
        this.customerInformationForm = this._formBuilder.group({
            name: ['', [Validators.required, Validators.pattern("[a-zA-Z ]+")]],
            last_name: ['', [Validators.required, Validators.pattern("[a-zA-Z ]+")]],
            phone_1: ['', [Validators.required, Validators.pattern("[0-9]+"), Validators.minLength(10), Validators.maxLength(10)]],
            dealership_name: ['', [Validators.required, Validators.pattern("[a-zA-Z ]+")]],
            country_of_origin: ['', Validators.required],
            transmission: ['', Validators.required],
            intake_engine: ['', Validators.required],
            auto_start_stop: ['', Validators.required],
            scheduled_date: ['', Validators.required],
            vin: ['', [Validators.required, Validators.pattern("[a-zA-Z0-9]+"), Validators.minLength(17), Validators.maxLength(17)]],
            brand: ['', Validators.required],
            model: ['', Validators.required],
            version: ['', Validators.required],
            year: ['', Validators.required],
            mileage: ['', [Validators.required, Validators.pattern("[0-9]{1,10}"), Validators.minLength(1), Validators.maxLength(10)]],
            exterior_color: ['', [Validators.required, Validators.pattern("[a-zA-Z ]+")]],
            plates: [''],
            cylinders: ['', [Validators.required, Validators.pattern("[a-zA-Z0-9]+"), Validators.minLength(1), Validators.maxLength(8)]],
            engine_type: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(3)]], /**Validators.pattern("[0-9\.]{1,4}"), */
            appraiserTechnician: ['', Validators.required],
            page_status: [''],
            location: [''],
            type: [''],
            // line: [''],
            body: [''],
            valuation_uuid: ['']
        });
    }

    public onCustomerInformation() {
        this.spinner = true;

        const brand = this.customerInformationForm.controls['brand'].value;
        const dealership_name = this.customerInformationForm.controls['dealership_name'].value;
        const model = this.customerInformationForm.controls['model'].value;
        const technician_uuid = this.uuidTechnician;
        const year = this.customerInformationForm.controls['year'].value;
        const mileage = this.customerInformationForm.controls['mileage'].value;

        const vehicleInfo = {
            ...this.customerInformationForm.value,
            brand: brand,
            dealership_name: dealership_name,
            model: model,
            technician_uuid: technician_uuid,
            year: year,
            mileage: mileage,
            page_status: 'valuing',
            location: this.customerInformationForm.controls['dealership_name'].value,
            type: 'car',
            valuation_uuid: this._activatedRoute.snapshot.params.uuid_valuation
        }
        this._checklistService.updateCustomerInformation(vehicleInfo)
            .pipe(
                concatMap(() => 
                    this._checklistService.updateStatus(vehicleInfo.valuation_uuid)
                )
            )
            .subscribe({
                next: () => {
                    this.spinner = false;
                    Swal.fire({
                        icon: 'success',
                        title: 'Alta/Actualización de registro',
                        text: 'Alta/Actualización de registro exitoso.',
                        showConfirmButton: true,
                        confirmButtonColor: '#EEB838',
                        timer: 3500
                    });
                    this.btn_follow = true
                    this.btn_save = false;
                },
                error: (error) => {
                    this.spinner = false;
                }
            });
    }

    public openExternalPicture() {
        const bottomSheetRef = this._bottomSheet.open(ExternalRevisionPictureComponent, {
            data: { uuid_valuation: this._activatedRoute.snapshot.params.uuid_valuation}
        });

        bottomSheetRef.instance.imagesUploaded.subscribe((areAllUploaded: boolean) => {
            if (areAllUploaded) {
                Swal.fire({
                    icon: 'success',
                    title: 'Completado',
                    text: 'Todas las imágenes requeridas han sido subidas exitosamente.',
                    confirmButtonColor: '#EEB838',
                    timer: 3500
                });
            } else {
                Swal.fire({
                    icon: 'warning',
                    title: 'Atención',
                    text: 'Aún faltan imágenes requeridas por subir.',
                    confirmButtonColor: '#EEB838',
                });
            }
        });

        bottomSheetRef.afterDismissed().subscribe((dataFromChild) => {
            if(dataFromChild?.data !== true) {
                Swal.fire({
                    icon: 'info',
                    title: 'Sin cambios',
                    text: 'No se realizaron modificaciones en las imágenes.',
                    confirmButtonColor: '#EEB838',
                    timer: 3500
                });
            }
        });
    }

    public openInternalPicture() {
        const bottomSheetRef = this._bottomSheet.open(InternalRevisionPictureComponent, {
            data: { uuid_valuation: this._activatedRoute.snapshot.params.uuid_valuation}
        });

        bottomSheetRef.instance.imagesInternalUploaded.subscribe((areAllInternalUploaded: boolean) => {
            if (areAllInternalUploaded) {
                Swal.fire({
                    icon: 'success',
                    title: 'Completado',
                    text: 'Todas las imágenes requeridas han sido subidas exitosamente.',
                    confirmButtonColor: '#EEB838',
                    timer: 3500
                });
            } else {
                Swal.fire({
                    icon: 'warning',
                    title: 'Atención',
                    text: 'Aún faltan imágenes requeridas por subir.',
                    confirmButtonColor: '#EEB838',
                });
            }
        });

        bottomSheetRef.afterDismissed().subscribe((dataFromChild) => {
            if (dataFromChild?.data !== true) {
                Swal.fire({
                    icon: 'info',
                    title: 'Sin cambios',
                    text: 'No se realizaron modificaciones en las imágenes.',
                    confirmButtonColor: '#EEB838',
                    timer: 3500
                });
            }
        });
    }

    public openBodyworkValuatorForm() {
        this._bottomSheet.open(BodyworkPaintValuatorFormComponent, {
            data: { uuid_valuation: this._activatedRoute.snapshot.params.uuid_valuation}
        });
    }

    public onMyChange(){
        this.uuidTechnician = this.customerInformationForm.controls['appraiserTechnician'].value;
    }

    public onSelectChange(event: any, uuid_check: string){
        const valorSeleccionado = event.value || (event.target as HTMLSelectElement).value;
        this.attachCheck(this.valuation_uuid, uuid_check, valorSeleccionado);
    }

    onInputBlur(uuid_check: string) {
        if (this.inputValor) {
          this.attachCheck(this.valuation_uuid, uuid_check, this.inputValor);
        }
    }

    public onInputChange(event: Event, uuid_check: string) {
        const valor = (event.target as HTMLInputElement).value;
        this.inputValor = valor;
        this.check_uuid = uuid_check;
        //this.attachCheck(this.valuation_uuid, uuid_check, valor);
    }

    public attachCheck(valuation_uuid: string, check_uuid:string, selected_value: string){
        this._checklistService.updateValuation(valuation_uuid, check_uuid, selected_value)
        .subscribe({
            next: (response : GralResponse) =>{
                const Toast = Swal.mixin({
                    toast: true,
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    didOpen: (toast) => {
                      toast.onmouseenter = Swal.stopTimer;
                      toast.onmouseleave = Swal.resumeTimer;
                    }
                  });
                  Toast.fire({
                    icon: "success",
                    title: "Guardado..."
                  });
            },
            error: (error:any) =>{
                Swal.fire({
                    icon: 'error',
                    title: 'Oupps..',
                    text: 'Al parecer ocurrio un error' + error.error.message,
                    showConfirmButton: true,
                    confirmButtonColor: '#EEB838',
                    timer: 3500
            });
            }
        })
    }

    public maxLengthCheck(object: any) {
        if (object.value.length > object.maxLength) {
          object.value = object.value.slice(0, object.maxLength)
        }
    }

    public dateChangeEmitter(event: MatDatepickerInputEvent<Date>) {
        let d = new Date(`${event.value}`);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        let year = d.getFullYear();
    
        if (month.length < 2)
          month = '0' + month;
        if (day.length < 2)
          day = '0' + day;
    
        let date = [year, month, day].join('-');
    
        // this.customerInformationForm.controls['valuation_date'].setValue(date);
        this.customerInformationForm.controls['scheduled_date'].setValue(date);
        let inputValue = date.split("-").reverse().join("-");
        this.inputdate.nativeElement.value = inputValue;
    }

    public lastMaintenanceEmmitter(event: any, check_uuid: string) {
        // HTML5 date input ya maneja el formato YYYY-MM-DD automáticamente
        const dateValue = (event.target as HTMLInputElement).value;
        
        if (dateValue) {
            // Actualizar el formulario reactivo
            this.vehicleCertificationForm.patchValue({
                [check_uuid]: dateValue
            });
            
            // Guardar en el backend
            this.attachCheck(this.valuation_uuid, check_uuid, dateValue);
        }
    }

    public convertMayus(event: any): string {
        return event.target.value = event.target.value.toUpperCase();
    }

    public getChecklist(uuid_valuation: string) {
        const token = localStorage.getItem('user_token');
        if (!token) {
            this._router.navigate(['/auth/iniciar-sesion'], { replaceUrl: true });
            return;
        }
        this._checklistService.getChecklist(uuid_valuation)
            .subscribe({
                next: ( checklists: GetChecklist ) => {
                    this.checklist = checklists.data || [];
                    
                    this.checklistMechanicElectric = this.checklist.filter(chk => chk.section_name === 'Mecánica y Eléctrica');
                    this.checklistExternalReview = this.checklist.filter(chk => chk.section_name === 'Revisión Exterior');
                    this.checklistInternalReview = this.checklist.filter(chk => chk.section_name === 'Revisión Interior');
                    this.checklistCertification = this.checklist.filter(chk => chk.section_name === 'Certificación de Vehículo');
                    
                    if (this.checklist.length === 0) {
                        Swal.fire({
                            icon: 'warning',
                            title: 'Sin datos',
                            text: 'No se encontraron checkpoints para esta valuación. Por favor, verifica que la valuación tenga checkpoints asociados.',
                            confirmButtonText: 'Aceptar'
                        });
                    }
                    
                    this.createFormControls();
                },
                error: (error: any) => {
                    console.error('Error al cargar el checklist:', error);
                    if (error.status === 401) {
                        // El interceptor ya manejará el 401
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'No se pudo cargar el checklist. Por favor, intenta nuevamente.',
                            confirmButtonText: 'Aceptar'
                        }).then(() => {
                            this._router.navigate([this.baseUrl, 'appointment']);
                        });
                    }
                }
            });
    }

    public getTechnicians(){
        this._checklistService.getTechnicians()
            .subscribe({
                next: ( technicians: GetUsersByRol ) => {
                    this.technicians = technicians.data.users;
                }
            });
    }

    public getDetailValuation(uuid_valuation: string) {
        this._detailValuationService.getDetailValuation(uuid_valuation)
            .subscribe({
                next: ( detailValuation: GetDetailValuation) => {
                    // Validar que appointment existe antes de acceder a sus propiedades
                    if (!detailValuation.data || !detailValuation.data.appointment) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'No se pudo cargar la información de la cita. Por favor, verifica que la cita existe.',
                            confirmButtonText: 'Aceptar'
                        }).then(() => {
                            this._router.navigate([this.baseUrl, 'appointment']);
                        });
                        return;
                    }
                    
                    if (detailValuation.data.vehicle === null) {
                        const customer = detailValuation.data.appointment?.customer;
                        if (!customer) {
                            Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: 'No se pudo cargar la información del cliente. Por favor, verifica los datos.',
                                confirmButtonText: 'Aceptar'
                            });
                            return;
                        }
                        this.customerInformationForm.patchValue({
                            name:      customer.name || '',
                            last_name: customer.last_name || '',
                            phone_1:     customer.phone_1 || '',
                            dealership_name: detailValuation.data.dealership?.name || '',
                            location: detailValuation.data.dealership?.location || '',
                            brand: detailValuation.data.appointment?.vehicle?.brand_name || '',
                            model: detailValuation.data.appointment?.vehicle?.model_name || '',
                            year: detailValuation.data.appointment?.vehicle?.year || '',
                            mileage: detailValuation.data.appointment?.vehicle?.mileage || 0
                        });

                        const valuationDate = detailValuation.data.appointment?.scheduled_date;
                        if (valuationDate) {
                            const valDate = valuationDate.slice(0, -6); // YYYY-MM-DD formato requerido por input type="date"
                            this.customerInformationForm.controls['scheduled_date']?.setValue(valDate);
                            // No es necesario manipular nativeElement con input type="date" - formControlName lo sincroniza automáticamente
                            // const vd = valDate.split("-").reverse().join("-");
                            // if (this.inputdate) {
                            //     this.inputdate.nativeElement.value = vd;
                            // }
                        }

                        this.btn_save = true;
                        this.btn_follow = false;

                        if (this.customerInformationForm.controls['name']) this.customerInformationForm.controls['name'].disable();
                        if (this.customerInformationForm.controls['last_name']) this.customerInformationForm.controls['last_name'].disable();
                        if (this.customerInformationForm.controls['phone_1']) this.customerInformationForm.controls['phone_1'].disable();
                        if (this.customerInformationForm.controls['dealership_name']) this.customerInformationForm.controls['dealership_name'].disable();
                        if (this.customerInformationForm.controls['scheduled_date']) this.customerInformationForm.controls['scheduled_date'].disable();
                        if (this.customerInformationForm.controls['brand']) this.customerInformationForm.controls['brand'].disable();
                        if (this.customerInformationForm.controls['model']) this.customerInformationForm.controls['model'].disable();
                        if (this.customerInformationForm.controls['year']) this.customerInformationForm.controls['year'].disable();
                        if (this.customerInformationForm.controls['mileage']) this.customerInformationForm.controls['mileage'].disable();
                        // appraiserTechnician se mantiene HABILITADO cuando vehicle === null (usuario debe seleccionar)
                    } else {
                        // Validar que appointment y vehicle existen
                        if (!detailValuation.data.appointment || !detailValuation.data.vehicle) {
                            Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: 'No se pudo cargar la información del vehículo. Por favor, verifica los datos.',
                                confirmButtonText: 'Aceptar'
                            });
                            return;
                        }
                        
                        const customer = detailValuation.data.appointment?.customer;
                        if (!customer) {
                            Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: 'No se pudo cargar la información del cliente. Por favor, verifica los datos.',
                                confirmButtonText: 'Aceptar'
                            });
                            return;
                        }
                            this.customerInformationForm.patchValue({
                                name:      customer.name || '',
                                last_name: customer.last_name || '',
                                phone_1:     customer.phone_1 || '',
                                dealership_name: detailValuation.data.dealership?.name || '',
                                location: detailValuation.data.dealership?.location || '',
                                brand: detailValuation.data.vehicle?.brand?.name || '',
                                model: detailValuation.data.vehicle?.model?.name || '',
                                country_of_origin: detailValuation.data.vehicle?.specification?.country_of_origin?.toLowerCase() || '',
                                transmission: detailValuation.data.vehicle?.transmission || '',
                                intake_engine: detailValuation.data.vehicle?.specification?.intake_engine?.toLowerCase() || '',
                                auto_start_stop: detailValuation.data.vehicle?.specification?.auto_start_stop?.toLowerCase() || '',
                                vin: detailValuation.data.vehicle?.vin || '',
                                // line: detailValuation.data.vehicle.line.name,
                                version: detailValuation.data.vehicle?.version?.name || '',
                                year: detailValuation.data.appointment?.vehicle?.year || '',
                                body: detailValuation.data.vehicle?.body?.name || '',
                                mileage: detailValuation.data.vehicle?.mileage || 0,
                                exterior_color: detailValuation.data.vehicle?.exterior_color || '',
                                plates: detailValuation.data.vehicle?.specification?.plates || '',
                                cylinders: detailValuation.data.vehicle?.cylinders?.toString() || '',
                                engine_type: detailValuation.data.vehicle?.specification?.engine_type?.toString() || '',
                                appraiserTechnician: detailValuation.data.technician?.[0]?.uuid || ''
                            });

                        const valuationDate = detailValuation.data.appointment?.scheduled_date;
                        if (valuationDate) {
                            const valDate = valuationDate.slice(0, -6); // YYYY-MM-DD formato requerido por input type="date"
                            this.customerInformationForm.controls['scheduled_date']?.setValue(valDate);
                            // No es necesario manipular nativeElement con input type="date" - formControlName lo sincroniza automáticamente
                            // const vd = valDate.split("-").reverse().join("-");
                            // if (this.inputdate) {
                            //     this.inputdate.nativeElement.value = vd;
                            // }
                        }

                        this.btn_save = false;
                        this.btn_follow = true;

                        this.customerInformationForm.controls['name'].disable();
                        this.customerInformationForm.controls['last_name'].disable();
                        this.customerInformationForm.controls['phone_1'].disable();
                        this.customerInformationForm.controls['dealership_name'].disable();
                        this.customerInformationForm.controls['scheduled_date'].disable();
                        this.customerInformationForm.controls['brand'].disable();
                        this.customerInformationForm.controls['model'].disable();
                        this.customerInformationForm.controls['country_of_origin'].disable();
                        this.customerInformationForm.controls['transmission'].disable();
                        this.customerInformationForm.controls['intake_engine'].disable();
                        this.customerInformationForm.controls['auto_start_stop'].disable();
                        this.customerInformationForm.controls['vin'].disable();
                        // this.customerInformationForm.controls['line'].disable();
                        this.customerInformationForm.controls['version'].disable();
                        this.customerInformationForm.controls['year'].disable();
                        this.customerInformationForm.controls['body'].disable();
                        this.customerInformationForm.controls['mileage'].disable();
                        this.customerInformationForm.controls['exterior_color'].disable();
                        this.customerInformationForm.controls['plates'].disable();
                        this.customerInformationForm.controls['cylinders'].disable();
                        this.customerInformationForm.controls['engine_type'].disable();
                        this.customerInformationForm.controls['appraiserTechnician'].disable();
                    }
                },
            error: (error) => {
                console.error('Error al cargar la valuación:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo cargar la información de la valuación. Por favor, intenta nuevamente.',
                    confirmButtonText: 'Aceptar'
                }).then(() => {
                    this._router.navigate([this.baseUrl, 'appointment']);
                });
            }
        });
    }

    public createFormControls() {
        this.checklist.forEach(check => {
            if (check.section_name === 'Mecánica y Eléctrica') {
                const selectedValue = check.value_type === 'textArea' && check.selected_value
                    ? check.selected_value
                    : check.selected_value || '';
                    const validators = check.value_type === 'textArea' ? [] : [Validators.required];
                    const control = this._formBuilder.control(selectedValue, validators);
                this.mechanicElectricForm.addControl(
                    check.uuid,
                    control
                );
            }
            if (check.section_name === 'Revisión Exterior') {
                // const selectedValueRevExt = check.selected_value || '';
                // this.externalReviewForm.addControl(
                //     check.uuid,
                //     this._formBuilder.control(selectedValueRevExt, Validators.required)
                // );
                const selectedValueRevExt = check.value_type === 'textArea' && check.selected_value
                    ? check.selected_value
                    : check.selected_value || '';
                    const validators = check.value_type === 'textArea' ? [] : [Validators.required];
                    const control = this._formBuilder.control(selectedValueRevExt, validators);
                this.externalReviewForm.addControl(
                    check.uuid,
                    // this._formBuilder.control(selectedValueRevExt, Validators.required)
                    control
                );
            }
            if (check.section_name === 'Revisión Interior') {
                const selectedValueRevInt = check.selected_value || '';
                this.internalReviewForm.addControl(
                    check.uuid,
                    this._formBuilder.control(selectedValueRevInt, Validators.required)
                );
            }
            if (check.section_name === 'Certificación de Vehículo') {
                // Para campos de tipo date, el backend ya devuelve el formato correcto YYYY-MM-DD
                const selectedValueCertVeh = check.selected_value || '';
                const validators = check.value_type === 'date' ? [] : [Validators.required];
                const control = this._formBuilder.control(selectedValueCertVeh, validators);

                this.vehicleCertificationForm.addControl(
                    check.uuid,
                    control
                );
            }
        });
        
        // Marcar todos los campos como "touched" para mostrar validaciones inmediatamente
        this.mechanicElectricForm.markAllAsTouched();
        this.externalReviewForm.markAllAsTouched();
        this.internalReviewForm.markAllAsTouched();
        this.vehicleCertificationForm.markAllAsTouched();
    }

    private parseDate(dateString: string): Date | null {
        if (!dateString) return null;
        const [day, month, year] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day); // Mes -1 porque los meses en JavaScript empiezan desde 0
    }

    private parseDateToHTML5(dateString: string): string {
        // Esta función ya no es necesaria porque el backend devuelve YYYY-MM-DD
        // Mantenida por compatibilidad, pero simplemente devuelve el valor original
        return dateString || '';
    }

    //función que permite detectar si todos los formularios han sido llenados y mandar un alert
    onStepChange(event: any) {
            // Aquí puedes personalizar el mensaje que quieres mostrar
        if(event.previouslySelectedIndex == 1 &&  event.selectedIndex == 2){
            if(!this.mechanicElectricForm.valid){
                Swal.fire({
                    icon: 'error',
                    title: 'Ooopppps!',
                    text: 'Existen campos sin contestar',
                    showConfirmButton: true,
                    confirmButtonColor: '#EEB838',
                    timer: 5000
                });
            }
        }
        if(event.previouslySelectedIndex == 2 &&  event.selectedIndex == 3 ){
            if( !this.externalReviewForm.valid){
                Swal.fire({
                    icon: 'error',
                    title: 'Ooopppps!',
                    text: 'Existen campos sin contestar',
                    showConfirmButton: true,
                    confirmButtonColor: '#EEB838',
                    timer: 5000
                });
            }
            }
        if(event.previouslySelectedIndex == 3 &&  event.selectedIndex == 4){
                if(!this.internalReviewForm.valid){
                    Swal.fire({
                        icon: 'error',
                        title: 'Ooopppps!',
                        text: 'Existen campos sin contestar',
                        showConfirmButton: true,
                        confirmButtonColor: '#EEB838',
                        timer: 5000
                    });
                }
            }
        if(event.previouslySelectedIndex == 4 ){
            if(!this.vehicleCertificationForm.valid){
                Swal.fire({
                    icon: 'error',
                    title: 'Ooopppps!',
                    text: 'Existen campos sin contestar',
                    showConfirmButton: true,
                    confirmButtonColor: '#EEB838',
                    timer: 5000
                });
            }
        }

    }

    //función para abrir el model de refacciones
    public openSparePartsForm(){
        const bottomSheetRef = this._bottomSheet.open(SparePartsFormComponent, {
            data: {
                uuid_valuation: this.valuation_uuid
            }
        });  
        bottomSheetRef.afterDismissed().subscribe((dataFromChild) => {      
            if(dataFromChild != undefined && dataFromChild.reload === true ){
               
            }
        });
    }

}
