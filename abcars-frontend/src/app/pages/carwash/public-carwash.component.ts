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
  private phoneDigits = '525646531805';

  whatsappUrl = this.buildWhatsAppUrl('Hola AB CarWash, quiero agendar un lavado.');
  phoneDisplay = '+52 564 653 1805';
  phoneTel = 'tel:+525646531805';

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

  /** Menú individual de servicios (precios MXN con IVA). */
  readonly services: WashServiceRow[] = [
    { name: 'Lavado premium de carrocería', priceWithVat: 250 },
    { name: 'Descontaminación de rines', priceWithVat: 250 },
    { name: 'Lavado, aspirado y secado', priceWithVat: 250 },
    { name: 'Lavado, aspirado, secado y pulido', priceWithVat: 400 },
    { name: 'Pulido y encerado', priceWithVat: 2000 },
    { name: 'Lavado de vestiduras', priceWithVat: 850 },
    { name: 'Lavado de vestiduras y alfombra intenso', priceWithVat: 1800 },
    { name: 'Descontaminación de lluvia ácida parabrisas', priceWithVat: 600 },
    { name: 'Descontaminación de lluvia ácida carrocería', priceWithVat: 3000 },
    { name: 'Protección nanocerámica', priceWithVat: 4000 },
    { name: 'Películas de protección solar', priceWithVat: 3700 },
    { name: 'Filos de PPF', priceWithVat: 350 },
    { name: 'Películas y filos de PPF', priceWithVat: 3900 },
    { name: 'PPF Pieza', priceWithVat: 3500 },
    { name: 'PPF Completo', priceWithVat: 65000 },
    { name: 'Detallado de rines (retoques)', priceWithVat: 600 },
    { name: 'Detallado completo de ruedas', priceWithVat: 750 },
    { name: 'Venta de nitrógeno (inflado llantas)', priceWithVat: 600 },
    { name: 'Rehidratación de plásticos', priceWithVat: 700 },
    { name: 'Pintura de fascia sin reparación (express)', priceWithVat: 1800 }
  ];

  constructor(private carwash: CarWashService) {}

  ngOnInit(): void {
    this.carwash.getPublicContact().subscribe({
      next: (res) => {
        const d = res.data;
        if (d?.phone_digits) {
          this.phoneDigits = d.phone_digits;
          this.phoneTel = `tel:+${d.phone_digits}`;
          this.whatsappUrl =
            d.whatsapp_url ||
            this.buildWhatsAppUrl(d.prefill || 'Hola AB CarWash, quiero agendar un lavado.');
        }
        if (d?.phone_display) {
          this.phoneDisplay = d.phone_display;
        }
      },
      error: () => {
        /* se mantiene fallback */
      }
    });
  }

  whatsappFor(service: WashServiceRow): string {
    return this.buildWhatsAppUrl(`Hola AB CarWash, me interesa: ${service.name}`);
  }

  whatsappForPackage(pkg: WashPackage): string {
    return this.buildWhatsAppUrl(
      `Hola AB CarWash, quiero agendar el ${pkg.name} (desde $${pkg.priceFrom.toLocaleString('es-MX')}).`
    );
  }

  private buildWhatsAppUrl(text: string): string {
    return `https://wa.me/${this.phoneDigits}?text=${encodeURIComponent(text)}`;
  }
}
