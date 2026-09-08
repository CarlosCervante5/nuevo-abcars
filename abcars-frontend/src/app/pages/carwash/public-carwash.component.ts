import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HomeNavComponent } from '../../shared/components/home-nav/home-nav.component';
import { ModernFooterComponent } from '../../shared/components/modern-footer/modern-footer.component';
import { CarWashService } from '@services/carwash.service';

interface WashServiceRow {
  name: string;
  priceInternal: number;
  priceExVat: number;
  priceWithVat: number;
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

  readonly features = [
    { label: 'Rapidez', icon: 'speed' },
    { label: 'Confiabilidad', icon: 'shield' },
    { label: 'Eco-Friendly', icon: 'eco' },
    { label: 'Calidad', icon: 'trophy' }
  ];

  /** Lista oficial de servicios (precios MXN). */
  readonly services: WashServiceRow[] = [
    { name: 'Lavado, Aspirado y Secado', priceInternal: 172, priceExVat: 216, priceWithVat: 250 },
    { name: 'Lavado, Aspirado, Secado y Pulido', priceInternal: 276, priceExVat: 345, priceWithVat: 400 },
    {
      name: 'Lavado, aspirado, secado, pulido y encerado',
      priceInternal: 1379,
      priceExVat: 1724,
      priceWithVat: 2000
    },
    { name: 'Lavado de vestiduras', priceInternal: 586, priceExVat: 733, priceWithVat: 850 },
    {
      name: 'Lavado de vestiduras y alfombra intenso',
      priceInternal: 1241,
      priceExVat: 1552,
      priceWithVat: 1800
    },
    {
      name: 'Descontaminación de lluvia ácida parabrisas',
      priceInternal: 414,
      priceExVat: 517,
      priceWithVat: 600
    },
    {
      name: 'Descontaminación de lluvia ácida carrocería',
      priceInternal: 2069,
      priceExVat: 2586,
      priceWithVat: 3000
    },
    { name: 'Nanocerámico', priceInternal: 2759, priceExVat: 3448, priceWithVat: 4000 },
    { name: 'Películas de protección solar', priceInternal: 2552, priceExVat: 3190, priceWithVat: 3700 },
    { name: 'Filos de PPF', priceInternal: 241, priceExVat: 302, priceWithVat: 350 },
    { name: 'Películas y filos de PPF', priceInternal: 2690, priceExVat: 3362, priceWithVat: 3900 },
    { name: 'PPF Pieza', priceInternal: 2414, priceExVat: 3017, priceWithVat: 3500 },
    { name: 'PPF Completo', priceInternal: 44828, priceExVat: 56034, priceWithVat: 65000 },
    { name: 'Detallado de Rines (retoques)', priceInternal: 414, priceExVat: 517, priceWithVat: 600 },
    {
      name: 'Detallado completo de ruedas (incluye rotores)',
      priceInternal: 517,
      priceExVat: 647,
      priceWithVat: 750
    },
    { name: 'Venta de nitrógeno (inflado llantas)', priceInternal: 414, priceExVat: 517, priceWithVat: 600 },
    { name: 'Rehidratación de plásticos', priceInternal: 483, priceExVat: 603, priceWithVat: 700 },
    {
      name: 'Pintura de fascia sin reparación (express)',
      priceInternal: 1241,
      priceExVat: 1552,
      priceWithVat: 1800
    }
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

  scrollToPackages(): void {
    document.getElementById('paquetes')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  whatsappFor(service: WashServiceRow): string {
    return this.buildWhatsAppUrl(`Hola AB CarWash, me interesa: ${service.name}`);
  }

  private buildWhatsAppUrl(text: string): string {
    return `https://wa.me/${this.phoneDigits}?text=${encodeURIComponent(text)}`;
  }
}
