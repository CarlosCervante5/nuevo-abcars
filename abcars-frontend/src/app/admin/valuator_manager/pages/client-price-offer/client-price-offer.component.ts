import { Component, type OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { ClientPriceOfferService } from '@services/client-price-offer.service';
import { Overview } from '@interfaces/admin.interfaces';

@Component({
  selector: 'app-client-price-offer',
  // imports: [],
  templateUrl: './client-price-offer.component.html',
  styleUrl: './client-price-offer.component.css',
  standalone: false
})
export class ClientPriceOfferComponent implements OnInit {

  public displayedColumns: string[] = ['id', 'clientName', 'clientSurname', 'clientPhone', 'vehicleModel', 'clientPriceOffer']; /** 'vehicleVin', 'vehiclePriceOriginal', */
  public dataSource!: MatTableDataSource<any>

  public length: number = 0;
  public pageIndex: number = 1;

  // References Overview para el encabezado
  public itemOverview: Overview;

  constructor( private _clientPriceOfferService: ClientPriceOfferService ){
    // Inicializar itemOverview
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      this.itemOverview = {
        user: {
          name: user.name || user.nickname || 'Usuario',
          surname: user.surname || '',
          role: 'Valuation Manager',
          email: user.email || '',
          picturepath: ''
        },
        pages: [
          {
            title: 'Reporte Ofertas de autos',
            icon: 'fi fi-rr-chart-line-up',
            permalink: '/admin/valuation_manager/client-price-offer'
          }
        ]
      };
    } catch (error) {
      // Fallback si hay error al parsear
      this.itemOverview = {
        user: {
          name: 'Usuario',
          surname: '',
          role: 'Valuation Manager',
          email: '',
          picturepath: ''
        },
        pages: [
          {
            title: 'Reporte Ofertas de autos',
            icon: 'fi fi-rr-chart-line-up',
            permalink: '/admin/valuation_manager/client-price-offer'
          }
        ]
      };
    }
  }

  ngOnInit(): void { 
    this.getPriceOfferClient();
  }

  private getPriceOfferClient(page?: number){
    this._clientPriceOfferService.getClientPriceOffer(page)
    .subscribe({
      next: (resp) => {
        console.log(resp.data.data);
        this.dataSource = new MatTableDataSource(resp.data.data);
        this.length = resp.data.total;
        if (page) {
          this.pageIndex = page;
        }
      }
    });
  }

  public paginationChange(pageEvent: PageEvent): void {
    this.pageIndex = pageEvent.pageIndex + 1;
    this.getPriceOfferClient(this.pageIndex);
  }

}
