import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HomeNavComponent } from '../../shared/components/home-nav/home-nav.component';
import { ModernFooterComponent } from '../../shared/components/modern-footer/modern-footer.component';

interface AccesorioCategory {
  slug: string;
  name: string;
  image: string;
  blurb: string;
}

interface AccesorioProduct {
  name: string;
  category: string;
  price: number;
  sku: string;
}

@Component({
  selector: 'app-accesorios',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HomeNavComponent, ModernFooterComponent],
  templateUrl: './accesorios.component.html',
  styleUrls: ['./accesorios.component.css']
})
export class AccesoriosComponent {
  readonly whatsappUrl =
    'https://wa.me/5212221263726?text=' +
    encodeURIComponent('Hola ABCars, me interesa un accesorio para mi vehículo.');

  query = '';
  brand = '';
  model = '';
  year = '';

  readonly brands = ['Toyota', 'Nissan', 'Chevrolet', 'Ford', 'Volkswagen', 'Honda', 'Mazda', 'Jeep'];
  readonly years = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019'];

  readonly categories: AccesorioCategory[] = [
    {
      slug: 'canastillas',
      name: 'Canastillas',
      image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=900&q=80',
      blurb: 'Portaequipaje superior para viajes y aventura.'
    },
    {
      slug: 'barras',
      name: 'Barras porta-equipaje',
      image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
      blurb: 'Barras transversales compatibles con rieles de techo.'
    },
    {
      slug: 'roll-bars',
      name: 'Roll bars',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=80',
      blurb: 'Protección y estilo para pickups y off-road.'
    },
    {
      slug: 'arrastre',
      name: 'Sistema de arrastre',
      image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=900&q=80',
      blurb: 'Enganches y accesorios de remolque certificados.'
    },
    {
      slug: 'racks',
      name: 'Racks y soportes',
      image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=900&q=80',
      blurb: 'Soportes para bicicletas, kayaks y equipo deportivo.'
    },
    {
      slug: 'interiores',
      name: 'Interiores',
      image: 'https://images.unsplash.com/photo-1502877338535-766e1452684b?auto=format&fit=crop&w=900&q=80',
      blurb: 'Tapetes, organizadores y confort para habitáculo.'
    },
    {
      slug: 'iluminacion',
      name: 'Iluminación',
      image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80',
      blurb: 'Barras LED, faros auxiliares y señalización.'
    },
    {
      slug: 'proteccion',
      name: 'Protección',
      image: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=900&q=80',
      blurb: 'Defensas, estribos y cubiertas protectoras.'
    }
  ];

  readonly products: AccesorioProduct[] = [
    { name: 'Canastilla aluminio universal', category: 'canastillas', price: 4899, sku: 'AC-CAN-ALU' },
    { name: 'Barras transversales 120 cm', category: 'barras', price: 2499, sku: 'AC-BAR-120' },
    { name: 'Roll bar cromado doble', category: 'roll-bars', price: 6799, sku: 'AC-RB-CRO' },
    { name: 'Enganche clase III', category: 'arrastre', price: 3599, sku: 'AC-HIT-C3' },
    { name: 'Rack para 2 bicicletas', category: 'racks', price: 2899, sku: 'AC-BIC-2' },
    { name: 'Juego tapetes de hule', category: 'interiores', price: 899, sku: 'AC-TAP-H' },
    { name: 'Barra LED 22"', category: 'iluminacion', price: 1699, sku: 'AC-LED-22' },
    { name: 'Estribos laterales negros', category: 'proteccion', price: 4299, sku: 'AC-EST-N' }
  ];

  selectedCategory: string | null = null;

  get filteredProducts(): AccesorioProduct[] {
    const q = this.query.trim().toLowerCase();
    return this.products.filter((p) => {
      const byCat = !this.selectedCategory || p.category === this.selectedCategory;
      const byQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q);
      return byCat && byQuery;
    });
  }

  selectCategory(slug: string): void {
    this.selectedCategory = this.selectedCategory === slug ? null : slug;
    document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  clearFilters(): void {
    this.selectedCategory = null;
    this.query = '';
    this.brand = '';
    this.model = '';
    this.year = '';
  }

  categoryLabel(slug: string): string {
    return this.categories.find((c) => c.slug === slug)?.name || slug;
  }
}
