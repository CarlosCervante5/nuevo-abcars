import { Component, type OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ClientPriceOfferService } from '@services/client-price-offer.service';

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

  constructor( private _clientPriceOfferService: ClientPriceOfferService ){}

  ngOnInit(): void { 
    this.getPriceOfferClient();
  }

  private getPriceOfferClient(page?: number){
    this._clientPriceOfferService.getClientPriceOffer(page)
    .subscribe({
      next: (resp) => {
        console.log(resp.data.data);
        this.dataSource = new MatTableDataSource(resp.data.data);
      }
    });
  }

}
