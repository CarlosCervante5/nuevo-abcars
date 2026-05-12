import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, FormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { DataDetailUser, Dealership, DealerShipResponse, DetailResponsive, roles, RolesResponse } from '@interfaces/admin.interfaces';
import { GralResponse } from '@interfaces/vehicle_data.interface';
import { AdminService } from '@services/admin.service';
import { dealershipServiceTypesSummary } from 'src/app/shared/utils/public-dealerships';
import { displayAdminRoleNameEs } from 'src/app/shared/utils/admin-role-labels';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-update-user',
    templateUrl: './update-user.component.html',
    styleUrls: ['./update-user.component.css'],
    standalone: false
})
export class UpdateUserComponent implements OnInit {
    public uuid_user!: string;
    public form!: FormGroup;
    public files!: File[];
    public users !: DataDetailUser;
    public spinner = true;
    public foto!: string;
    public roles: roles[] = [];
    /** Opciones ordenadas para el select de rol */
    public rolesSorted: roles[] = [];
    public dealership: Dealership[] = [];
    /** Sucursales del catálogo + valor actual si ya no está en la lista */
    public dealershipsForSelect: Dealership[] = [];

    constructor(
        @Inject(MAT_BOTTOM_SHEET_DATA) public data: any,
        private _formBuilder: UntypedFormBuilder,
        private _bottomSheetRef: MatBottomSheetRef<any>,
        private _adminservice : AdminService,
    ){
        this.uuid_user = data.uuid;
        this.createForm();
        this.getRoles();
        this.loadUserAndDealerships();
    }

    ngOnInit(): void {
        this.form.get('dealership_id')?.valueChanges.subscribe((id: number | string | null) => {
            const nid = typeof id === 'string' ? Number(id) : id;
            const d =
                nid != null && !Number.isNaN(Number(nid))
                    ? this.dealershipsForSelect.find((x) => x.id === nid)
                    : undefined;
            this.form.patchValue({ location_shadow: d?.name ?? '' }, { emitEvent: false });
        });
    }

    private createForm() {
        this.form = this._formBuilder.group({
            name:           ['', [ Validators.pattern("[a-zA-ZÀ-ÿ ]+"), Validators.required]],
            last_name:      ['', [ Validators.pattern("[a-zA-ZÀ-ÿ ]+"), Validators.required]],
            phone_1:        ['', [this.phoneValidator.bind(this), Validators.required]],
            phone_2:        ['', [this.phoneValidator.bind(this)]],
            gender:         [''],
            email:          ['', [Validators.email]],
            dealership_id:  [null as number | string | null, Validators.required],
            location_shadow: [''],
            role_name:      ['', [Validators.required]],
            picture:        [''],
            password:       [''],
        });
    }

    private phoneValidator(control: AbstractControl) {
        const rawPhone = control.value;

        if (!rawPhone) {
            return null;
        }

        const phone = String(rawPhone).replace(/\D/g, '');
        const phonePattern = /^[0-9]+$/;
        const valid = phonePattern.test(phone) && phone.length === 10;

        if (!valid) {
        return { invalidPhone: true };
        }

        return null;
    }

    private loadUserAndDealerships(): void {
        this._adminservice.getDealerships().subscribe({
            next: (dealRes: DealerShipResponse) => {
                this.dealership = dealRes.data || [];
                this.refreshSelectLists();

                this._adminservice.detailUser(this.uuid_user).subscribe({
                    next: (response: DetailResponsive) => {
                        this.spinner = false;
                        this.users = response.data;
                        const inferredDid =
                            this.users.profile.dealership_id != null
                                ? this.users.profile.dealership_id
                                : this.dealership.find((d) => d.name === (this.users.profile.location || '').trim())
                                      ?.id ?? null;

                        this.form.patchValue({
                            name: this.users.profile.name,
                            last_name: this.users.profile.last_name,
                            gender: this.users.profile.gender || '',
                            email: this.users.user.email,
                            phone_1: this.users.profile.phone_1 ? String(this.users.profile.phone_1) : '',
                            phone_2: this.users.profile.phone_2 ? String(this.users.profile.phone_2) : '',
                            dealership_id: inferredDid,
                            location_shadow:
                                inferredDid != null && !Number.isNaN(Number(inferredDid))
                                    ? (
                                          this.dealership.find((d) => d.id === inferredDid)?.name ??
                                          this.users.profile.location ??
                                          ''
                                      )
                                    : this.users.profile.location || '',
                            role_name: this.users.role,
                        });
                        this.foto = this.users.profile.picture ? this.users.profile.picture : 'assets/img/user.jpeg';
                        this.refreshSelectLists();
                    },
                    error: () => {
                        this.spinner = false;
                    },
                });
            },
            error: () => {
                this.spinner = false;
            },
        });
    }

    public getUser(){
        this.loadUserAndDealerships();
    }

    public close():void {
        this._bottomSheetRef.dismiss();
    }

    assignImagePromo( event: Event){
        const element = event.currentTarget as HTMLInputElement;
        let fileList: FileList | null = element.files;
        if (fileList) {
            this.files = Array.from(fileList);
        }
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
    get dealershipInvalid() {
        const c = this.form.get('dealership_id');
        return !!c?.invalid && (c?.dirty || c?.touched);
    }
    get role_nameInvalid() {
        return this.form.get('role_name')!.invalid && (this.form.get('role_name')!.dirty || this.form.get('role_name')?.touched);
    }
    get passwordInvalid() {
        return this.form.get('password')!.invalid && (this.form.get('password')!.dirty || this.form.get('password')?.touched);
    }


    public onSubmit(){
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        const did = this.form.get('dealership_id')!.value;
        const locDisplay = String(this.form.get('location_shadow')?.value ?? '');
        this._adminservice.updateUser(this.uuid_user, this.form.get('name')!.value, this.form.get('last_name')!.value, this.form.get('phone_1')!.value, this.form.get('phone_2')!.value,
        this.form.get('gender')!.value, this.form.get('email')!.value, locDisplay, this.form.get('role_name')!.value, this.files,
        this.form.get('password')!.value,
        did,
        )
        .subscribe({
            next: (response: GralResponse) =>{
                Swal.fire({
                    icon: 'success',
                    title: 'Usuario actualizado con éxito',
                    text: response.message,
                    showConfirmButton: false,
                    timer: 2000
                  });
                  this._bottomSheetRef.dismiss(
                    {reload: true}
                  );
            },
            error: (error) => {
                const msg = error?.error?.message;
                const errors = error?.error?.errors;
                const text = msg || (errors ? Object.values(errors).flat().join(' ') : 'Error al actualizar el usuario.');
                Swal.fire({ icon: 'error', title: 'Error', text });
            }
        })
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

    public onImageError(): void {
        this.foto = 'assets/img/user.jpeg';
    }

    branchTypesSummary(d: Dealership): string {
        return dealershipServiceTypesSummary(d);
    }

    roleLabel(technical: string): string {
        return displayAdminRoleNameEs(technical);
    }

    private refreshSelectLists(): void {
        if (this.roles?.length) {
            this.rolesSorted = [...this.roles].sort((a, b) =>
                displayAdminRoleNameEs(a.name).localeCompare(displayAdminRoleNameEs(b.name), 'es', {
                    sensitivity: 'base'
                }));
        }
        const raw = this.dealership ?? [];
        let list = [...raw].sort((a, b) =>
            a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));

        const did = this.form?.get('dealership_id')?.value;
        const nid = typeof did === 'string' ? Number(did) : did;
        const locLbl = String(
            this.form?.get('location_shadow')?.value ?? this.users?.profile?.location ?? ''
        ).trim();
        if (nid != null && !Number.isNaN(Number(nid)) && !list.some((d) => d.id === nid)) {
            list = [{ id: nid as number, name: locLbl || 'Sucursal', location: '' } as Dealership, ...list];
        }

        const locLegacy = locLbl && !nid ? locLbl : '';
        if (locLegacy && !list.some((d) => d.name === locLegacy)) {
            list = [{ name: locLegacy, location: '' } as Dealership, ...list];
        }
        this.dealershipsForSelect = list;
    }

}
