import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { Router } from '@angular/router';

// Services
import { AuthService } from 'src/app/auth/services/auth.service';
import { DetailService } from '../../services/detail/detail.service';
import { VendeTuAutoService } from '@services/vende-tu-auto.service';

// Interfaces
import { Client, Register } from 'src/app/auth/interfaces/register.interface';
// import { Notification } from '../../interfaces/detail/vehicle_data.interface';
// import { UserEmailData } from '../../../vender-autos/interfaces/user-email-data.interface';

interface ReservedVehicle {
  vin: string;
  brand: string;
}

@Component({
    selector: 'app-notification-reserved',
    templateUrl: './notification-reserved.component.html',
    standalone: false
})

export class NotificationReservedComponent implements OnInit {

  // Referencies of Help
  public vehicle!: ReservedVehicle;
  public spinner: boolean = false;  

  // References Form
  public form!: UntypedFormGroup;
  public auth!: UntypedFormGroup;
  private formClient!: UntypedFormGroup;
  private notification!: UntypedFormGroup;

  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: any,
    private _router: Router,
    private _formBuilder: UntypedFormBuilder,
    private _authService: AuthService,
    private _detailService: DetailService,
    private _bottomSheetRef: MatBottomSheetRef<NotificationReservedComponent>,
    private _venderTuAutoService: VendeTuAutoService,
  ) {
    // Initialization of Form
    this.createFormInit();
  }

  ngOnInit(): void {
    this.vehicle = this.data;
  }

  /**
   * Getters Inputs Check
   */
  get nameInvalid() {
    return this.form.get('name')!.invalid && (this.form.get('name')!.dirty || this.form.get('name')!.touched);
  }

  get surnameInvalid() {
    return this.form.get('surname')!.invalid && (this.form.get('surname')!.dirty || this.form.get('surname')!.touched);
  }

  get emailInvalid() {
    return this.form.get('email')!.invalid && (this.form.get('email')!.dirty || this.form.get('email')!.touched);
  }

  get phoneInvalid() {
    return this.form.get('phone')!.invalid && (this.form.get('phone')!.dirty || this.form.get('phone')!.touched);
  }

  /**
   * Form Initialization
   */
  private createFormInit() {
    this.form = this._formBuilder.group({
      name: ['', [Validators.required, Validators.pattern("[a-zA-Z ]+")]],
      surname: ['', [Validators.required, Validators.pattern("[a-zA-Z ]+")]],
      email: ['', [Validators.required, Validators.pattern("[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$")]],
      gender: [''],
      phone: ['', [Validators.required, Validators.pattern("[0-9]+"), Validators.minLength(10), Validators.maxLength(10)]],
      checkbox: [false, Validators.required]
    });
  }

  /**
   * Form Information
   */
  public onSubmit() {   
    // Change spinner
    this.spinner = true;    
    
    // Checking user by email
    // this._venderTuAutoService.getUserByEmail(this.form.get('email')?.value)
    // .subscribe({
    //   next: ({ user }: UserEmailData) => {
    //     if (user !== null) {
    //       this.notification = this._formBuilder.group({
    //         status: ['active'],
    //         client_id: [user.clients[0].id],
    //         vehicle_id: this.data.id
    //       });

    //       // Launch api for register notification vehicle reserved
    //       // this._detailService.notificationReserved(this.notification.value)
    //       // .subscribe({
    //       //   next: ({ status, code }: Notification) => {
    //       //     if (code === '200' && status === 'success') {
    //       //       // Change spinner
    //       //       this.spinner = false; 

    //       //       // Close sheet
    //       //       this._bottomSheetRef.dismiss();

    //       //       // Redirect.
    //       //       this._router.navigateByUrl('/saved-process');      
    //       //     }
    //       //   }
    //       // });
    //     } else {
    //       // Launch request
    //       // this._authService.register(this.form.value)
    //       // .subscribe({
    //       //   next: ({ code, user, status }: Register) => {
    //       //     if (code === '200' && status === 'success') {
    //       //       if (user) {
    //       //         // Generate Form Group Client
    //       //         this.formClient = this._formBuilder.group({
    //       //           phone1: [this.form.controls.phone.value],
    //       //           phone2: [this.form.controls.phone.value],
    //       //           curp: ['XXXXXXXXXXXXXXXX0'],
    //       //           points: [0],
    //       //           user_id: [user.id],
    //       //           source_id: [1]
    //       //         });

    //       //         // Lauch request Client
    //       //         // this._authService.registerClient(this.formClient.value)
    //       //         // .subscribe({
    //       //         //   next: ({ code, status, client }: Client) => {
    //       //         //     if (code === '200' && status === 'success') {   
    //       //         //       // Change spinner
    //       //         //       this.spinner = false;
                        
    //       //         //       this.notification = this._formBuilder.group({
    //       //         //         status: ['active'],
    //       //         //         client_id: [client.id],
    //       //         //         vehicle_id: this.data.id
    //       //         //       });
                              
    //       //         //       // Launch api for register notification vehicle reserved
    //       //         //       this._detailService.notificationReserved(this.notification.value)
    //       //         //       .subscribe({
    //       //         //         next: ({ status, code }: Notification) => {
    //       //         //           if (code === '200' && status === 'success') {
    //       //         //             // Change spinner
    //       //         //             this.spinner = false; 
    
    //       //         //             // Close sheet
    //       //         //             this._bottomSheetRef.dismiss();
    
    //       //         //             // Redirect.
    //       //         //             this._router.navigateByUrl('/saved-process');      
    //       //         //           }
    //       //         //         }
    //       //         //       });      
    //       //         //     } else {
    //       //         //       // Change spinner
    //       //         //       this.spinner = false;  
      
    //       //         //       // Close sheet
    //       //         //       this._bottomSheetRef.dismiss();
      
    //       //         //       // Redirect.
    //       //         //       this._router.navigateByUrl('/error-process');
    //       //         //     }
    //       //         //   }
    //       //         // });
               
    //       //       } else {
    //       //         // Change spinner
    //       //         this.spinner = false; 
      
    //       //         // Close sheet
    //       //         this._bottomSheetRef.dismiss();
      
    //       //         // Redirect.
    //       //         this._router.navigateByUrl('/error-process');
    //       //       }
    //       //     } else {
    //       //       // Change spinner
    //       //       this.spinner = false; 
      
    //       //       // Close sheet
    //       //       this._bottomSheetRef.dismiss();
      
    //       //       // Redirect.
    //       //       this._router.navigateByUrl('/error-process');
    //       //     }
    //       //   }, 
    //       //   error: (error) => {
    //       //     // Change spinner
    //       //     this.spinner = false;
      
    //       //     // Close sheet
    //       //     this._bottomSheetRef.dismiss();

    //       //     // Redirect.
    //       //     this._router.navigateByUrl('/error-process');
    //       //   }
    //       // });
    //     }
    //   }
    // });
  }

  /**
   * Help function, close and open when clicked
   */
  public openLink(): void {
    this._bottomSheetRef.dismiss();
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

}
