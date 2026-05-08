import { Component } from '@angular/core';
import { AbstractControl, FormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { DealerShipResponse, roles, RolesResponse , Dealership} from '@interfaces/admin.interfaces';
import { GralResponse } from '@interfaces/vehicle_data.interface';
import { AdminService } from '@services/admin.service';
import { dealershipServiceTypeLabel } from 'src/app/shared/utils/public-dealerships';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-add-user',
    templateUrl: './add-user.component.html',
    styleUrls: ['./add-user.component.css'],
    standalone: false
})
export class AddUserComponent {

    public form !: FormGroup;
    public spinner = false;
    public files: File[] = [];
    public roles: roles[] = [];
    public rolesSorted: roles[] = [];
    public dealership: Dealership[] = [];
    public dealershipsForSelect: Dealership[] = [];

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _bottomSheetRef: MatBottomSheetRef<any>,
        private _adminservice : AdminService,
    ){
        this.createForm();
        this.getRoles();
        this.getDealership();
    }

    private createForm() {
        this.form = this._formBuilder.group({
            name:           ['', [Validators.required, Validators.pattern("[a-zA-ZÀ-ÿ ]+")]],
            last_name:      ['', [Validators.required, Validators.pattern("[a-zA-ZÀ-ÿ ]+")]],
            phone_1:        ['', [this.phoneValidator.bind(this), Validators.required]],
            phone_2:        ['', [this.phoneValidator.bind(this)]],
            gender:         ['', [Validators.required]],
            email:          ['', [Validators.required, Validators.pattern("[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$")]],
            location:       ['', [Validators.required]],
            role_name:      ['', [Validators.required]],
            picture:        [''],
            password:       ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-zñ])(?=.*[A-ZÑ])(?=.*\d)(?=.*[@$!%*?&])[A-Za-zÑñ\d@$!%*?&]+$/u)]],
        });
    }

    private phoneValidator(control: AbstractControl) {
        const phone = control.value;

        if (!phone) {
            return null;
        }

        const phonePattern = /^[0-9]+$/;
        const valid = phonePattern.test(phone) && phone.length === 10;

        if (!valid) {
        return { invalidPhone: true };
        }

        return null;
    }

    public close():void {
        this._bottomSheetRef.dismiss();
    }

    get nameInvalid() {
        return this.form.get('name')!.invalid && (this.form.get('name')!.dirty || this.form.get('name')?.touched);
    }
    get last_nameInvalid() {
        return this.form.get('last_name')!.invalid && (this.form.get('last_name')!.dirty || this.form.get('last_name')?.touched);
    }
    public get phoneOneInvalid() {
        return this.form.get('phone_1')?.invalid && (this.form.get('phone_1')?.dirty || this.form.get('phone_1')?.touched);
    }
    public get phoneTwoInvalid() {
        return this.form.get('phone_2')?.invalid && (this.form.get('phone_2')?.dirty || this.form.get('phone_2')?.touched);
    }
    get genderInvalid() {
        return this.form.get('gender')!.invalid && (this.form.get('gender')!.dirty || this.form.get('gender')?.touched);
    }
    get emailInvalid() {
        return this.form.get('email')!.invalid && (this.form.get('email')!.dirty || this.form.get('email')?.touched);
    }
    get locationInvalid() {
        return this.form.get('location')!.invalid && (this.form.get('location')!.dirty || this.form.get('location')?.touched);
    }
    get role_nameInvalid() {
        return this.form.get('role_name')!.invalid && (this.form.get('role_name')!.dirty || this.form.get('role_name')?.touched);
    }
    get passwordInvalid() {
        return this.form.get('password')!.invalid && (this.form.get('password')!.dirty || this.form.get('password')?.touched);
    }

    public onSubmit(){
        this._adminservice.addUser(this.form.get('name')!.value, this.form.get('last_name')!.value, this.form.get('phone_1')!.value, this.form.get('phone_2')!.value,
        this.form.get('gender')!.value, this.form.get('email')!.value, this.form.get('location')!.value, this.form.get('role_name')!.value, this.files,
        this.form.get('password')!.value,)
        .subscribe({
            next: (response : GralResponse) =>{
                Swal.fire({
                    icon: 'success',
                    title: 'Usuario creado con éxito',
                    text: response.message,
                    showConfirmButton: false,
                    timer: 2000
                    });
                    this._bottomSheetRef.dismiss(
                    {reload: true}
                    );
            },
            error: (err) => {
                const msg = err?.error?.message;
                const errors = err?.error?.errors;
                const text = msg || (errors ? Object.values(errors).flat().join(' ') : 'Error al crear el usuario.');
                Swal.fire({ icon: 'error', title: 'Error', text });
            }
        })
    }

    assignImagePromo( event: Event){
        const element = event.currentTarget as HTMLInputElement;
        let fileList: FileList | null = element.files;
        if (fileList) {
            this.files = Array.from(fileList);
        }
    }


    public getRoles(){
        this._adminservice.getRoles()
        .subscribe({
            next: (response: RolesResponse[]) =>{
                const datosR = response.map((rol) => ({
                    'id':       rol.id,
                    'name':     rol.name
                }));
                this.roles = datosR;
                this.refreshSelectLists();
            }
        })
    }

    public getDealership(){
        this._adminservice.getDealerships()
        .subscribe({
            next: (response : DealerShipResponse) =>{
                this.dealership = response.data || [];
                this.refreshSelectLists();
            }
        })
    }

    branchTypeLabel(t: Dealership['service_type']): string {
        return dealershipServiceTypeLabel(t);
    }

    private refreshSelectLists(): void {
        if (this.roles?.length) {
            this.rolesSorted = [...this.roles].sort((a, b) =>
                a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
        }
        const raw = this.dealership ?? [];
        this.dealershipsForSelect = [...raw].sort((a, b) =>
            a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
    }
}
