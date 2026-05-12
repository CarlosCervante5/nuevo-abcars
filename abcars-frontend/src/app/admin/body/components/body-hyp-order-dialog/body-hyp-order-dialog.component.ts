import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BodyHypOrderService } from '@services/body-hyp-order.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-body-hyp-order-dialog',
  templateUrl: './body-hyp-order-dialog.component.html',
  styleUrls: ['./body-hyp-order-dialog.component.css'],
  standalone: false,
})
export class BodyHypOrderDialogComponent implements OnInit {
  form!: FormGroup;
  saving = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<BodyHypOrderDialogComponent, boolean>,
    private readonly bodyHypOrderService: BodyHypOrderService,
    @Inject(MAT_DIALOG_DATA) public readonly data: unknown,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      title: [''],
      description: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(8000)]],
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  submit(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const v = this.form.getRawValue();
    this.bodyHypOrderService
      .create({
        title: v.title?.trim() ? v.title.trim() : null,
        description: v.description.trim(),
      })
      .subscribe({
        next: (res) => {
          this.saving = false;
          void Swal.fire({
            icon: 'success',
            title: 'Orden creada',
            text: res.message,
            timer: 2200,
            showConfirmButton: false,
          });
          this.dialogRef.close(true);
        },
        error: () => {
          this.saving = false;
          void Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo crear la orden. Intenta de nuevo.',
            confirmButtonColor: '#EEB838',
          });
        },
      });
  }
}
