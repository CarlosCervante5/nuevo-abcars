import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from 'src/environments/environment';

// Animations
import Swal from "sweetalert2";
// Services
import { DetailService } from '../../services/detail/detail.service';
import { AuthService } from "../../../../../auth/services/auth.service";

// Interfaces
// import { Vehicle, VehicleData } from '../../interfaces/detail/vehicle_data.interface';
import { Client, Register, User } from "../../../../../auth/interfaces/register.interface";
import { Login } from 'src/app/auth/interfaces/login.interface';
import { RewardsService } from 'src/app/auth/pages/account/services/rewards.service';
import { CheckingReward } from 'src/app/auth/pages/account/interfaces/rewards.interface';

@Component({
    selector: 'app-acquisition-form',
    templateUrl: './acquisition-form.component.html',
    styleUrls: ['./acquisition-form.component.css'],
    standalone: false
})

export class AcquisitionFormComponent implements OnInit {

  // References of Help
  public spinner: boolean = false;  
  public rewards: string = '';
  public rewardsFlag: string = 'progress';

  // References Form
  public form!: UntypedFormGroup;
  public auth!: UntypedFormGroup;
  public formClient!: UntypedFormGroup;

  // References Vehicle
  // public vehicle!: Vehicle;
  public imagen: string = '';  
  private baseUrl: string = environment.baseUrl;
  
  // References Users
  public user!: User;

  constructor(
    private _router: Router,
    private _routerActivated: ActivatedRoute,
    private _formBuilder: UntypedFormBuilder,
    private _detailService: DetailService,
    private _authService: AuthService,
    private _rewardService: RewardsService
  ) { 
    // Initialization of Form
    this._createForm(); 

    if(localStorage.getItem('user')){
      this.user = JSON.parse(localStorage.getItem('user')!);      
      this.form.clearValidators();
        this.form.patchValue ({
          name: [this.user.name],
          surname: [this.user.surname],
          email: [this.user.email],
          curp: ['******************']
        });
        
        for(const key in this.form.controls){
          this.form.get(key)!.clearValidators();
          this.form.get(key)!.updateValueAndValidity();
          this.form.controls['name'].disable();
          this.form.controls['surname'].disable();
          this.form.controls['phoneOne'].disable();
          this.form.controls['phoneTwo'].disable();
          this.form.controls['email'].disable();
          this.form.controls['gender'].disable();
          this.form.controls['curp'].disable();
        }
    }
  }

  ngOnInit(): void {
    /**
     * Check the active id to see the information of vehicle
     */
    this._vehicleGetInformation(this._routerActivated.snapshot.params.vin);
    this.scrollTop();
  }

  scrollTop() {
    var scrollElem = document.querySelector('#moveTop');
    scrollElem!.scrollIntoView();  
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

  get phoneOneInvalid() {
    return this.form.get('phoneOne')!.invalid && (this.form.get('phoneOne')!.dirty || this.form.get('phoneOne')!.touched);
  }

  get phoneTwoInvalid() {
    return this.form.get('phoneTwo')!.invalid && (this.form.get('phoneTwo')!.dirty || this.form.get('phoneTwo')!.touched);
  }

  get genderInvalid() {
    return this.form.get('gender')!.invalid && (this.form.get('gender')!.dirty || this.form.get('gender')!.touched);
  }

  get curp() {
    return this.form.get('curp')!.invalid && (this.form.get('curp')!.dirty || this.form.get('curp')!.touched);
  }

  get rewardInvalid() {
    return this.form.get('rewards')?.value === this.rewards;
  }

  get rewardValid() {
    return this.form.get('rewards')?.dirty &&
    this.form.get('rewards')?.value.length === 8 &&
    (this.form.get('rewards')?.value !== this.rewards);
  }

  /**
   * Form Initialization
   */
  private _createForm() {
    this.form = this._formBuilder.group({
      name: ['', [Validators.required, Validators.pattern("[a-zA-Z ]+")]],
      surname: ['', [Validators.required, Validators.pattern("[a-zA-Z ]+")]],
      email: ['', [Validators.required, Validators.pattern("[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$")]],
      phoneOne: ['', [Validators.required, Validators.pattern("[0-9]+"), Validators.minLength(10), Validators.maxLength(10)]],
      phoneTwo: ['', [Validators.required, Validators.pattern("[0-9]+"), Validators.minLength(10), Validators.maxLength(10)]],
      gender: ['', [Validators.required]],
      curp: ['', [Validators.required, Validators.pattern("[A-Z]{1}[AEIOU]{1}[A-Z]{2}[0-9]{2}" +
        "(0[1-9]|1[0-2])(0[1-9]|1[0-9]|2[0-9]|3[0-1])" +
        "[HM]{1}" +
        "(AS|BC|BS|CC|CS|CH|CL|CM|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)" +
        "[B-DF-HJ-NP-TV-Z]{3}" +
        "[0-9A-Z]{1}[0-9]{1}$"), Validators.minLength(18), Validators.maxLength(18)]],
      checkbox: [false, Validators.required],
      password: ['Abcars.@'],
      rewards: ['', [Validators.pattern("[a-zA-Z0-9]+"), Validators.minLength(8), Validators.maxLength(8)]]
    });
  }

  /**
   * Form Client Information
   */
  public onSubmit() { 
    // Change spinner
    this.spinner = true;

    if (localStorage.getItem('user')) {
      // Redirect
      window.location.href = `${environment.baseUrl}/api/payment/${this._routerActivated.snapshot.params.vin}/${this.user.id}/${ this.rewards }`;
    } else {
      // Launch request
      // this._authService.register(this.form.value)
      // .subscribe({ 
      //   next: ({code, user, message}: Register)  => {
      //     if (code === '200') {
      //       if (user) {
      //         // Information user destructuring
      //         this.auth = this._formBuilder.group({
      //           email: [user.email],
      //           password: [this.form.controls['password'].value],
      //           gettoken: [true]
      //         });

      //         // User get token Login with email and password 
      //         this._authService.login(this.auth.value)
      //           .subscribe(({code, token}: Login) => {
      //             if(code === 200){
      //               if (token.length > 0){
      //                 // Save token user
      //                 localStorage.setItem('user_token', token);

      //                 // Generate Form Group Client
      //                 this.formClient = this._formBuilder.group({
      //                   phone1: [this.form.controls.phoneOne.value],
      //                   phone2: [this.form.controls.phoneTwo.value],
      //                   curp: [this.form.controls.curp.value],
      //                   points: [0],
      //                   user_id: [user.id],
      //                   source_id: [1]
      //                 });

      //                 // Launch request Client
      //                 // this._authService.registerClient(this.formClient.value)
      //                 // .subscribe({
      //                 //   next: ({code, status}: Client) => {
      //                 //     if (code === '200' && status === 'success') {
      //                 //       // Change spinner
      //                 //       this.spinner = false;

      //                 //       // Save information user
      //                 //       localStorage.setItem('user', JSON.stringify({
      //                 //         'id': user.id,
      //                 //         'name': user.name,
      //                 //         'surname': user.surname,
      //                 //         'email': user.email
      //                 //       }));

      //                 //       // Redirect
      //                 //       window.location.href = `${environment.baseUrl}/api/payment/${this._routerActivated.snapshot.params.vin}/${user.id}/${ this.rewards }`;

      //                 //     }else{
      //                 //       // Animation request
      //                 //       Swal.fire({
      //                 //         icon: 'error',
      //                 //         title: 'Ooopppps!',
      //                 //         text: 'Al parecer ocurrió un error al registrar su cuenta.',
      //                 //         showConfirmButton: true,
      //                 //         confirmButtonColor: '#EEB838',
      //                 //         timer: 3500
      //                 //       });

      //                 //       // Change spinner
      //                 //       this.spinner = false;
      //                 //     }
      //                 //   }
      //                 // });
      //               }
      //             }
      //           });
      //       } else {
      //         // Change spinner
      //         this.spinner = false;

      //         // Animation request
      //         Swal.fire({
      //           icon: 'error',
      //           title: 'Ooopppps!',
      //           text: 'Al parecer la información ingresada ya ha sido utilizada por otro cliente, verifique e intente nuevamente.',
      //           showConfirmButton: true,
      //           confirmButtonColor: '#EEB838',
      //           // timer: 3500
      //         });
      //       }
      //     }
      //   }, 
      //   error: (error) => {
      //     Swal.fire({
      //       icon: 'error',
      //       title: 'Ooopppps!',
      //       text: 'Al parecer ocurrió un error al registrar su cuenta, verifique y vuelva a interntarlo.',
      //       showConfirmButton: true,
      //       confirmButtonColor: '#EEB838',
      //       timer: 3500
      //     });

      //   // Change spinner
      //   this.spinner = false;
      //   }
      // });
    }
  }

  /**
   * Get information vehicle by vin param 
   */
  private _vehicleGetInformation(vin: string) {
    // this._detailService.getVehicleByVin(vin)
    // .subscribe({
    //   next: (veh: VehicleData) => {
    //     // Assign vehicle information
    //     this.vehicle = veh.vehicle;

    //     // Assign vehicle picture
    //     if(this.vehicle.vehicle_images.length == 0) {
    //       this.imagen = this.baseUrl + '/api/image_vehicle/vacio';
    //     } else {
    //       this.vehicle.vehicle_images.map((imagen, idx) => {
    //         if (idx === 0) {
    //           this.imagen = imagen.path;
    //         }
    //       });
    //     }
    //   }
    // });
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
   * Checking length input   
   * @param object any input
   */
  public maxLengthCheck(object: any) {   
    if (object.value.length > object.maxLength) {
      object.value = object.value.slice(0, object.maxLength)
    }
  }

  /**
   * Checking reference different from the one entered
   * @param input HTMLInputElement
   */
  public rewardValidate(input: HTMLInputElement) {
    if (this.form.get('email')?.value && input.value) {
      this._rewardService.checkingReward(input.value, this.form.get('email')?.value)
      .subscribe({
        next: ({ code, status }: CheckingReward) => {
          if (code === 200 && status === 'success') {
            this.rewards = input.value;
            this.rewardsFlag = 'diff';
          } else {
            this.rewards = '';
            this.form.get('rewards')?.reset();
            this.rewardsFlag = 'equals';
          }
        },
        error: (error) => {
          this.rewards = '';
          this.form.get('rewards')?.reset();
          this.rewardsFlag = 'equals';
          console.log(error);
        }
      });
    } else {
      this.rewardsFlag = 'progress'
    }
  }

}
