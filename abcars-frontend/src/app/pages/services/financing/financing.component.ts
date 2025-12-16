import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HomeNavComponent } from '../../../shared/components/home-nav/home-nav.component';
import { ModernFooterComponent } from '../../../shared/components/modern-footer/modern-footer.component';
import { LeadService } from '../../../shared/services/lead.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-financing',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, HomeNavComponent, ModernFooterComponent],
  templateUrl: './financing.component.html',
  styleUrls: ['./financing.component.css']
})
export class FinancingComponent {
  calculatorData = {
    vehiclePrice: 500000,
    downPaymentPercentage: 10,
    termMonths: 60,
    interestRate: 15
  };

  financingForm: FormGroup;
  isSubmitting: boolean = false;

  constructor(
    private fb: FormBuilder,
    private leadService: LeadService
  ) {
    this.financingForm = this.fb.group({
      name: ['', Validators.required],
      last_name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      email: ['', [Validators.required, Validators.email]],
      offer_price: ['']
    });
  }

  updateCalculations() {
    // Los cálculos se actualizan automáticamente con los getters
  }

  getDownPayment(): number {
    return (this.calculatorData.vehiclePrice * this.calculatorData.downPaymentPercentage) / 100;
  }

  getFinancedAmount(): number {
    return this.calculatorData.vehiclePrice - this.getDownPayment();
  }

  getMonthlyInterestRate(): number {
    return this.calculatorData.interestRate / 100 / 12;
  }

  getMonthlyPayment(): number {
    const principal = this.getFinancedAmount();
    const monthlyRate = this.getMonthlyInterestRate();
    const months = this.calculatorData.termMonths;
    
    if (monthlyRate === 0) {
      return principal / months;
    }
    
    return principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  }

  getTotalAmount(): number {
    return this.getDownPayment() + (this.getMonthlyPayment() * this.calculatorData.termMonths);
  }

  onSubmitFinancing() {
    if (this.financingForm.invalid || this.isSubmitting) {
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.financingForm.controls).forEach(key => {
        this.financingForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;

    // Obtener valores de la calculadora de financiamiento
    const downPayment = this.getDownPayment();
    const monthlyPayment = this.getMonthlyPayment();
    const totalAmount = this.getTotalAmount();

    // Preparar datos para enviar
    const formData = {
      name: this.financingForm.value.name,
      last_name: this.financingForm.value.last_name || '',
      phone: this.financingForm.value.phone,
      email: this.financingForm.value.email,
      comments: `El enganche 10%: $${downPayment.toLocaleString()} MXN Mensualidad: $${monthlyPayment.toLocaleString()} MXN Total a pagar: $${totalAmount.toLocaleString()} MXN`,
      vehicle_price: this.calculatorData.vehiclePrice,
      down_payment: downPayment,
      down_payment_percentage: this.calculatorData.downPaymentPercentage,
      monthly_payment: monthlyPayment,
      term_months: this.calculatorData.termMonths,
      finance_amount: this.getFinancedAmount()
    };

    this.leadService.sendFinancingRequest(formData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        
        Swal.fire({
          icon: 'success',
          title: '¡Solicitud enviada!',
          text: 'Tu solicitud de financiamiento ha sido enviada exitosamente. Nos pondremos en contacto contigo pronto.',
          showConfirmButton: true,
          confirmButtonColor: '#3b82f6',
          timer: 5000
        }).then(() => {
          // Limpiar formulario después del éxito
          this.financingForm.reset();
        });
      },
      error: (error) => {
        this.isSubmitting = false;
        
        console.error('Error al enviar solicitud:', error);
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Hubo un problema al enviar tu solicitud. Por favor, intenta de nuevo más tarde.',
          showConfirmButton: true,
          confirmButtonColor: '#ef4444'
        });
      }
    });
  }
}
