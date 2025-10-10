import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';

// Animaciones
import Swal from 'sweetalert2';

// Services
import { DetailService } from '../../services/detail/detail.service';

@Component({
    selector: 'app-ask-information',
    templateUrl: './ask-information.component.html',
    standalone: false
})

export class AskInformationComponent implements OnInit {

  // References
  public spinner: boolean = false;
  public form!: UntypedFormGroup;
  public vehicle!: any;

  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: any,
    private _formBuilder: UntypedFormBuilder,
    private _detailService: DetailService,
    private _bottomSheetRef: MatBottomSheetRef<AskInformationComponent>
  ) { 
    // Create form
    this.createForm();
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
  private createForm() {
    this.form = this._formBuilder.group({
      name: ['', [Validators.required, Validators.pattern("[a-zA-Z ]+")]],
      surname: ['', [Validators.required, Validators.pattern("[a-zA-Z ]+")]],
      email: ['', [Validators.required, Validators.pattern("[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$")]],      
      phone: ['', [Validators.required, Validators.pattern("[0-9]+"), Validators.minLength(10), Validators.maxLength(10)]],
      vehicle_id: [''],
      branch_name: [''],
      auto: [''],
      datetime: [''],
      checkbox: [false, Validators.required]
    });
  }

  /**
   * Form Information
   */
  public onSubmit() {  
    const date = new Date();
    const [month, day, year] = [date.getMonth(), date.getDate(), date.getFullYear()];
    const [hour, minutes, seconds] = [date.getHours(), date.getMinutes(), date.getSeconds()];

    // Change spinner
    this.spinner = true;    
    
    // Set vehicle with year
    this.form.patchValue({
      auto: `${ this.data.vehicle } ${ this.data.year }`,
      vehicle_id: this.data.vehicle_id,
      branch_name: this.data.branch_name,
      datetime: `${ year }-${ month + 1 }-${ day } ${ hour }:${ minutes }:${ seconds }`,
    });

    // Launch request
    this._detailService.sendAskInformationLead(this.form.value)
    .subscribe({
      next: (response: any) => {
        if (response['status'] === 'success') {
          Swal.fire({
            icon: 'success',
            title: 'Envio correctamente',
            text: `Solicitud de información enviada correctamente, nos podremos en contacto con usted lo antes posible.`,
            showConfirmButton: true,
            confirmButtonColor: '#EEB838',
            timer: 3500
          });

          this.spinner = false;
          this.openLink();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Ooopppps!',
            text: `Al parecer ocurrio un error al intentar enviar la solicitud de información, intenta más tarde.`,
            showConfirmButton: true,
            confirmButtonColor: '#EEB838',
            timer: 3500
          });

          this.spinner = false;
          this.openLink();
        }
      }
    });
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
