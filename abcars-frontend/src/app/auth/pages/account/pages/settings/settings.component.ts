import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import Swal from 'sweetalert2';
import { AccountService } from '../../services/account.service';
import { AuthService } from 'src/app/auth/services/auth.service';
import { AppComponent } from 'src/app/app.component';
import { environment } from '@environments/environment';

//import { ShowProfileResponse } from 'src/app/auth/interfaces/login.interface';
import { ShowProfileResponse } from '@interfaces/auth.interface';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss'],
    standalone: false
})

export class SettingsComponent implements OnInit {

    public hide: boolean = true;
    public spinner: boolean = false;  
    public form!: FormGroup;
    public url_dashboard: string = '/auth/mi-cuenta';
    public user_id!: number;
    public image_path: string = ""; 
    private url: string = environment.baseUrl;
    public activeC = true;

    constructor (
        private _router: Router,
        private _formBuilder: FormBuilder,
        private _accountService: AccountService,
        private _authService: AuthService,
        private _appComponent: AppComponent,
        private titleService: Title
    ) { 
        this.titleService.setTitle('Vecsa Hidalgo | Perfil');
        this.getUser();
        this.createForm();
        this.url_dashboard = this._appComponent.get_url_dashboard();
    }

    ngOnInit(): void {
        this.scrollTop();
    }

    scrollTop() {
        window.scrollTo(0, 0);
    }

    public get nicknameInvalid() {
        return this.form.get('nickname')?.invalid && (this.form.get('nickname')?.dirty || this.form.get('nickname')?.touched);
    }

    public get nameInvalid() {
        return this.form.get('name')?.invalid && (this.form.get('name')?.dirty || this.form.get('name')?.touched);
    }

    public get lastnameInvalid() {
        return this.form.get('last_name')?.invalid && (this.form.get('last_name')?.dirty || this.form.get('last_name')?.touched);
    }

    public get phoneOneInvalid() {
        return this.form.get('phone_1')?.invalid && (this.form.get('phone_1')?.dirty || this.form.get('phone_1')?.touched);
    }

    public get phoneTwoInvalid() {
        return this.form.get('phone_2')?.invalid && (this.form.get('phone_2')?.dirty || this.form.get('phone_2')?.touched);
    }

    public get genderInvalid() {
        return this.form.get('gender')?.invalid && (this.form.get('gender')?.dirty || this.form.get('gender')?.touched);
    }

    public get emailOneInvalid() {
        return this.form.get('email_1')?.invalid && (this.form.get('email_1')?.dirty || this.form.get('email_1')?.touched);
    }

    public get emailTwoInvalid() {
        return this.form.get('email_2')?.invalid && (this.form.get('email_2')?.dirty || this.form.get('email_2')?.touched);
    }
  
    /**
     * Form Initialization
     */
    private createForm() {
        this.form = this._formBuilder.group({
            nickname: ['', [Validators.required, Validators.maxLength(25), Validators.pattern(/^[a-zA-ZÀ-ÿ0-9_ .]+$/)]], //se agrego el punto en los caracteres aceptados
            name: ['', [Validators.required, Validators.pattern("[a-zA-ZÀ-ÿ ]+")]],
            last_name: ['', [Validators.required, Validators.pattern("[a-zA-ZÀ-ÿ ]+")]],
            phone_1: ['', [this.phoneValidator.bind(this)]],
            phone_2: ['', [this.phoneValidator.bind(this)]],
            gender: ['',],
            email_1: [{ value: '', disabled: true }, [Validators.required, Validators.pattern("[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$")]],
            email_2: ['', [Validators.pattern("[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$")]],
            uuid: ['', [Validators.required]],
        });
    }
  
    private phoneValidator(control: AbstractControl) {
        const phone = control.value;

        if (!phone) {
            return null; // If the field is empty, it's valid
        }

        // If a phone number is provided, validate the format
        const phonePattern = /^[0-9]+$/;
        const valid = phonePattern.test(phone) && phone.length === 10;

        if (!valid) {
        return { invalidPhone: true };
        }

        return null; // Valid phone number
    }

    private getUser() {
        const user = JSON.parse(localStorage.getItem('user')!);
    
        this._accountService.getProfile(user.uuid)
        .subscribe({
            next: ({ data }: ShowProfileResponse) => {
                
                if (data.profile) {
                    localStorage.setItem('profile', JSON.stringify( data.profile ));
                }

                this.form.patchValue({
                    nickname: data.user.nickname,
                    name: data.profile?.name || '',
                    last_name: data.profile?.last_name || '',
                    phone_1: data.profile?.phone_1 || '',
                    phone_2: data.profile?.phone_2 || '',
                    gender: data.profile?.gender || '',
                    email_1: data.profile?.email_1 || data.user.email || '',
                    email_2: data.profile?.email_2 || '',
                    uuid: data.user.uuid,
                });

                if (data.profile?.phone_1) {
                    this.form.get('phone_1')?.disable();
                }

                this.image_path = data.profile?.picture || `./assets/icons/profile.svg`;
                this.activeC = false;
            },
            error: (error) => {
                Swal.fire({
                    icon: 'error',
                    title: 'Oupps..',
                    text: 'Ocurrió un error al obtener su información, vuelva a intentarlo más tarde. ' + error.error.message,
                    showConfirmButton: true,
                    confirmButtonColor: '#EEB838',
                    timer: 3500
                });
            }
        });
    }

    public onSubmit() { 
        this.spinner = true;
        
        this._accountService.updateProfile(this.form.value)
        .subscribe({
            next: () => {
                this.spinner = false;
                Swal.fire({
                    icon: 'success',
                    title: 'Actualización',
                    text: 'Actualización exitosa.',
                    showConfirmButton: true,
                    confirmButtonColor: '#EEB838',
                    timer: 3500
                });

                this.getUser();
            },
            error: (error) => {
                this.spinner = false;
                Swal.fire({
                    icon: 'error',
                    title: 'Oupps..',
                    text: 'Ocurrió un error al actualizar su información: ' + error.error.message,
                    showConfirmButton: true,
                    confirmButtonColor: '#EEB838',
                    timer: 3500         
                });
            }
        });
    }

    public convertMayus(event: Event): string {
        const target = event.target as HTMLInputElement;
        return target.value = target.value.toUpperCase();
    }

    public updateImage(fileEvent: Event) {
        
        const target = fileEvent.target as HTMLInputElement;
        const file = target.files?.[0];
        
        if (!file) return;

        const user = JSON.parse(localStorage.getItem('user')!);

        this._accountService.updateImageProfile(user.uuid, file)
        .subscribe({
            
            next: () => {

                Swal.fire({
                    icon: 'success',
                    title: 'Actualización',
                    text: 'Actualización exitosa.',
                    showConfirmButton: true,
                    confirmButtonColor: '#EEB838',
                    timer: 3500
                });

                this.getUser();
            
            },
            error: () => {
                Swal.fire({
                    icon: 'error',
                    title: 'Oupps..',
                    text: 'Ocurrió un error al actualizar su imagen de perfil',
                    showConfirmButton: true,
                    confirmButtonColor: '#EEB838',
                    timer: 3500         
                });
            }
        });
    }
}
