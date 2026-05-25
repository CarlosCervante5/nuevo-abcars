import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HomeNavComponent } from '../../../shared/components/home-nav/home-nav.component';
import { ModernFooterComponent } from '../../../shared/components/modern-footer/modern-footer.component';
import { VehicleCardTailwindComponent, Vehicle } from '../../../shared/components/vehicle-card-tailwind/vehicle-card-tailwind.component';
import { LeadService } from '../../../shared/services/lead.service';
import { VehicleService } from '../../../shared/services/vehicle.service';
import { Dealership, DealerShipResponse } from '../../../shared/interfaces/admin.interfaces';
import { Vehicle as ApiVehicle } from '../../../shared/interfaces/vehicle_data.interface';
import Swal from 'sweetalert2';

/** Opción del select de inventario para el simulador */
interface FinancingInventoryOption {
  uuid: string;
  label: string;
  sale_price: number;
}

@Component({
  selector: 'app-financing',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, HomeNavComponent, ModernFooterComponent, VehicleCardTailwindComponent],
  templateUrl: './financing.component.html',
  styleUrls: ['./financing.component.css']
})
export class FinancingComponent implements OnInit {
  calculatorData = {
    vehicleOfInterest: '',
    vehiclePrice: 500000,
    downPaymentPercentage: 10,
    termMonths: 60,
    interestRate: 15
  };

  financingForm: FormGroup;
  isSubmitting: boolean = false;
  dealerships: Dealership[] = [];

  // Propiedades para el carrusel de vehículos
  filteredVehicles: Vehicle[] = [];
  isLoadingVehicles: boolean = false;
  showVehicleCarousel: boolean = false;
  private debounceTimer: any = null;

  /** Vehículos activos para el select "Vehículo de interés" */
  inventorySelectOptions: FinancingInventoryOption[] = [];
  loadingInventorySelect = false;
  selectedInventoryUuid = '';

  constructor(
    private fb: FormBuilder,
    private leadService: LeadService,
    private vehicleService: VehicleService
  ) {
    this.financingForm = this.fb.group({
      name: ['', Validators.required],
      last_name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      email: ['', [Validators.required, Validators.email]],
      city: ['', Validators.required],
      offer_price: ['']
    });
  }

  ngOnInit(): void {
    this.loadDealerships();
    this.loadInventoryForInterestSelect();
  }

  private loadInventoryForInterestSelect(): void {
    this.loadingInventorySelect = true;
    this.vehicleService.searchVehicles({ has_images: false }, 1, 200).subscribe({
      next: (response) => {
        this.loadingInventorySelect = false;
        if (response.status !== 200 || !response.data?.data) {
          this.inventorySelectOptions = [];
          return;
        }
        const rows = response.data.data as ApiVehicle[];
        const opts = rows.map((v) => {
          const brand = (v.brand?.name || '').trim();
          const model = (v.model?.name || '').trim();
          const year = v.model?.year;
          const price = v.sale_price || 0;
          const parts = [brand, model, year].filter((p) => p !== '' && p != null);
          const base = parts.join(' ');
          const label = `${base} · $${price.toLocaleString('es-MX')}`;
          return { uuid: v.uuid || '', label, sale_price: price };
        }).filter((o) => o.uuid);
        opts.sort((a, b) =>
          a.label.localeCompare(b.label, 'es', { sensitivity: 'base', numeric: true })
        );
        this.inventorySelectOptions = opts;
      },
      error: () => {
        this.loadingInventorySelect = false;
        this.inventorySelectOptions = [];
      }
    });
  }

  onInventoryVehicleSelect(uuid: string): void {
    this.selectedInventoryUuid = uuid || '';
    if (!uuid) {
      return;
    }
    const opt = this.inventorySelectOptions.find((o) => o.uuid === uuid);
    if (!opt) {
      return;
    }
    this.calculatorData.vehicleOfInterest = opt.label;
    if (opt.sale_price > 0) {
      this.calculatorData.vehiclePrice = opt.sale_price;
    }
    this.updateCalculations();
  }

  /** Si el usuario edita el texto manualmente, se desvincula la opción del inventario */
  onVehicleInterestTextInput(): void {
    const opt = this.inventorySelectOptions.find((o) => o.uuid === this.selectedInventoryUuid);
    const expected = (opt?.label || '').trim();
    const current = (this.calculatorData.vehicleOfInterest || '').trim();
    if (expected && current === expected) {
      return;
    }
    if (this.selectedInventoryUuid) {
      this.selectedInventoryUuid = '';
    }
  }

  private vehicleOfInterestForSubmit(): string | undefined {
    if (this.selectedInventoryUuid) {
      const o = this.inventorySelectOptions.find((x) => x.uuid === this.selectedInventoryUuid);
      if (o?.label) {
        return o.label;
      }
    }
    const t = this.calculatorData.vehicleOfInterest?.trim();
    return t || undefined;
  }

  private loadDealerships(): void {
    this.vehicleService.searchDealershipsForServiceTypes('venta').subscribe({
      next: (res: DealerShipResponse) => {
        if (res.status === 200 && Array.isArray(res.data)) {
          this.dealerships = res.data;
        }
      },
      error: () => {
        this.dealerships = [];
      }
    });
  }

  updateCalculations() {
    // Los cálculos se actualizan automáticamente con los getters
    
    // Buscar vehículos con debounce para evitar múltiples llamadas mientras el usuario escribe
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(() => {
      this.loadVehiclesByPrice(this.calculatorData.vehiclePrice);
    }, 500);
  }

  loadVehiclesByPrice(price: number): void {
    // Validar que el precio sea válido
    if (!price || price <= 0) {
      this.showVehicleCarousel = false;
      this.filteredVehicles = [];
      return;
    }

    this.isLoadingVehicles = true;
    this.showVehicleCarousel = false;

    // Buscar vehículos en un rango de ±100,000 alrededor del precio ingresado
    // El backend no está aplicando el filtro price_to correctamente, así que
    // cargamos todos los vehículos y filtramos localmente
    const filters: any = {};

    // Calcular el rango de precios: ±100,000 del precio ingresado
    const priceRange = {
      min: Math.max(0, price - 100000), // No permitir precios negativos
      max: price + 100000
    };

    // Cargar más vehículos para tener una mejor muestra (el backend no filtra por precio)
    this.vehicleService.searchVehicles(filters, 1, 50).subscribe({
      next: (response) => {
        this.isLoadingVehicles = false;
        
        if (response.status === 200 && response.data && response.data.data) {
          const apiVehicles = response.data.data;
          
          // Filtrar localmente por rango de precio (el backend no está aplicando el filtro price_to)
          const filteredByPrice = apiVehicles.filter(v => {
            const vehiclePrice = v.sale_price || 0;
            return vehiclePrice >= priceRange.min && vehiclePrice <= priceRange.max;
          });
          
          // Mapear vehículos de la API al formato que espera VehicleCardTailwindComponent
          this.filteredVehicles = filteredByPrice.map(v => ({
            uuid: v.uuid,
            name: v.name,
            sale_price: v.sale_price,
            mileage: v.mileage || 0,
            exterior_color: v.exterior_color || '',
            year: v.model?.year || new Date().getFullYear(),
            category: v.category,
            brand: v.brand ? { name: v.brand.name } : undefined,
            model: v.model ? { name: v.model.name, year: v.model.year || new Date().getFullYear() } : undefined,
            dealership: v.dealership ? { name: v.dealership.name, location: v.dealership.location } : undefined,
            first_image: v.first_image ? { service_image_url: v.first_image.service_image_url } : undefined
          }));

          // Mostrar el carrusel solo si hay vehículos que cumplen con el precio
          this.showVehicleCarousel = this.filteredVehicles.length > 0;
        } else {
          this.filteredVehicles = [];
          this.showVehicleCarousel = false;
        }
      },
      error: (error) => {
        this.isLoadingVehicles = false;
        this.filteredVehicles = [];
        this.showVehicleCarousel = false;
      }
    });
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

  getFormattedDownPayment(): string {
    return this.getDownPayment().toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  getFormattedMonthlyPayment(): string {
    return this.getMonthlyPayment().toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  getFormattedTotalAmount(): string {
    return this.getTotalAmount().toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
    const comments = `El enganche: $${downPayment.toLocaleString()} MXN Mensualidad: $${monthlyPayment.toLocaleString()} MXN Total a pagar: $${totalAmount.toLocaleString()} MXN`;

    const formData = {
      name: this.financingForm.value.name,
      last_name: this.financingForm.value.last_name || '',
      phone: this.financingForm.value.phone,
      email: this.financingForm.value.email,
      city: this.financingForm.value.city || '',
      comments,
      vehicle_of_interest: this.vehicleOfInterestForSubmit(),
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
          this.selectedInventoryUuid = '';
          this.calculatorData.vehicleOfInterest = '';
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
