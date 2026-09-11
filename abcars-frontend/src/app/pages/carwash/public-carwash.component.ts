import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HomeNavComponent } from '../../shared/components/home-nav/home-nav.component';
import { ModernFooterComponent } from '../../shared/components/modern-footer/modern-footer.component';
import { CarWashService } from '@services/carwash.service';

interface WashServiceRow {
  name: string;
  priceWithVat: number;
}

interface WashPackage {
  id: string;
  name: string;
  features: string[];
  priceFrom: number;
  duration: string;
  badge?: string;
}

@Component({
  selector: 'app-public-carwash',
  standalone: true,
  imports: [CommonModule, RouterModule, HomeNavComponent, ModernFooterComponent],
  templateUrl: './public-carwash.component.html',
  styleUrls: ['./public-carwash.component.css']
})
export class PublicCarwashComponent implements OnInit {
  /** Fallback si el API aún no responde (Settings → Teléfono público). */
  private phoneDigits = '5215646531805';
  private defaultPrefill = 'Hola AB CarWash, quiero agendar un lavado.';

  phoneDisplay = '+52 564 653 1805';
  phoneTel = 'tel:+525646531805';

  /** Índices de servicios agregados al carrito (permite varios). */
  cart = new Set<number>();

  readonly packages: WashPackage[] = [
    {
      id: 'basico',
      name: 'Paquete básico',
      features: [
        'Lavado premium de carrocería',
        'Descontaminación de rines',
        'Lavado, aspirado y secado de interiores'
      ],
      priceFrom: 400,
      duration: '90 minutos'
    },
    {
      id: 'premium',
      name: 'Paquete premium',
      features: [
        'Servicios del paquete básico',
        'Pulido y encerado',
        'Descontaminación de lluvia ácida en parabrisas'
      ],
      priceFrom: 2600,
      duration: '4 horas'
    },
    {
      id: 'signature',
      name: 'Paquete signature',
      features: [
        'Servicios del paquete premium',
        'Lavado de vestiduras',
        'Lavado de vestiduras y alfombra intenso',
        'Rehidratación de plásticos'
      ],
      priceFrom: 5000,
      duration: '7 horas',
      badge: 'Más comprado'
    },
    {
      id: 'elite',
      name: 'Paquete Elite',
      features: [
        'Servicios del paquete signature',
        'Rehidratación de plásticos de motor',
        'Protección nanocerámica'
      ],
      priceFrom: 9500,
      duration: '9 horas'
    }
  ];

  /** Menú individual de servicios (precios MXN con IVA / desde). */
  readonly services: WashServiceRow[] = [
    { name: 'Lavado premium de carrocería', priceWithVat: 250 },
    { name: 'Descontaminación de rines', priceWithVat: 250 },
    { name: 'Detallado de pintura en rines (retoque)', priceWithVat: 650 },
    { name: 'Pulido y encerado de carrocería', priceWithVat: 2000 },
    { name: 'Lavado de vestiduras', priceWithVat: 850 },
    { name: 'Lavado de vestiduras y alfombras', priceWithVat: 1800 },
    { name: 'Lavado a detalle e hidratación de plásticos', priceWithVat: 700 },
    { name: 'Descontaminación de parabrisas', priceWithVat: 600 },
    { name: 'Lavado exterior de motor', priceWithVat: 600 },
    { name: 'Protección nanocerámica', priceWithVat: 4000 },
    { name: 'Películas de protección solar', priceWithVat: 3700 },
    { name: 'Filos PPF (Paint Protection Film)', priceWithVat: 350 },
    { name: 'PPF Pieza', priceWithVat: 3500 },
    { name: 'PPF Completo', priceWithVat: 65000 },
    { name: 'Inflado de llantas con nitrógeno', priceWithVat: 600 },
    { name: 'Pintura de fascia sin reparación (express)', priceWithVat: 1800 }
  ];

  constructor(private carwash: CarWashService) {}

  ngOnInit(): void {
    this.carwash.getPublicContact().subscribe({
      next: (res) => {
        const d = res.data;
        if (d?.phone_digits) {
          this.phoneDigits = d.phone_digits;
          this.phoneTel =
            d.phone_tel || `tel:+${d.phone_digits.replace(/^521(\d{10})$/, '52$1')}`;
        }
        if (d?.phone_display) {
          this.phoneDisplay = d.phone_display;
        }
        if (d?.prefill) {
          this.defaultPrefill = d.prefill;
        }
      },
      error: () => {
        /* se mantiene fallback */
      }
    });
  }

  get cartIndices(): number[] {
    return [...this.cart].sort((a, b) => a - b);
  }

  get cartItems(): WashServiceRow[] {
    return this.cartIndices.map((i) => this.services[i]).filter(Boolean);
  }

  get cartCount(): number {
    return this.cart.size;
  }

  get cartTotal(): number {
    return this.cartItems.reduce((sum, s) => sum + s.priceWithVat, 0);
  }

  get whatsappUrl(): string {
    return this.buildWhatsAppUrl(this.buildCartMessage());
  }

  isSelected(index: number): boolean {
    return this.cart.has(index);
  }

  toggleService(index: number): void {
    if (this.cart.has(index)) {
      this.cart.delete(index);
    } else {
      this.cart.add(index);
    }
    // Nueva referencia para que Angular detecte el cambio del Set
    this.cart = new Set(this.cart);
  }

  removeFromCart(index: number): void {
    this.cart.delete(index);
    this.cart = new Set(this.cart);
  }

  clearCart(): void {
    this.cart = new Set();
  }

  whatsappForPackage(pkg: WashPackage): string {
    return this.buildWhatsAppUrl(
      `Hola AB CarWash, quiero agendar el ${pkg.name} (desde $${pkg.priceFrom.toLocaleString('es-MX')}).`
    );
  }

  private buildCartMessage(): string {
    const items = this.cartItems;
    if (!items.length) {
      return this.defaultPrefill;
    }

    const lines = items.map(
      (s, i) => `${i + 1}. ${s.name} — $${s.priceWithVat.toLocaleString('es-MX')}`
    );
    const total = this.cartTotal.toLocaleString('es-MX');

    return [
      'Hola AB CarWash, quiero cotizar / agendar estos servicios:',
      '',
      ...lines,
      '',
      `Total estimado: $${total} (precios desde, con IVA)`,
      '',
      '¿Me confirman disponibilidad?'
    ].join('\n');
  }

  private buildWhatsAppUrl(text: string): string {
    return `https://wa.me/${this.phoneDigits}?text=${encodeURIComponent(text)}`;
  }
}
