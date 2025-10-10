import { Component, Input, OnInit } from '@angular/core';

// Angular Material
import { MatBottomSheet } from '@angular/material/bottom-sheet';

// Enviroments
import { environment } from 'src/environments/environment';

// Interfaces
import { VehicleElement } from '../../interfaces/services.interface';

// Components
import { ServicesSheetCustomerComponent } from "../services-sheet-customer/services-sheet-customer.component";

@Component({
    selector: 'app-services-customer',
    templateUrl: './services-customer.component.html',
    standalone: false
})

export class ServicesCustomerComponent implements OnInit {

  // References of Vehicle
  @Input() vehicle!: VehicleElement;  
  public vehicle_image = '';

  constructor(private _bottomSheet: MatBottomSheet) { }

  ngOnInit(): void {
    let primera_imagen = this.vehicle.vehicle.vehicle_images[0];  
    
    if (primera_imagen != undefined && primera_imagen.external_website == "yes") {
      this.vehicle_image = primera_imagen.path;
    } else {
      this.vehicle_image = primera_imagen != undefined ? this.vehicle.vehicle.vehicle_images[0].path : 'vacio';
      this.vehicle_image = environment.baseUrl + '/api/image_vehicle/' + this.vehicle_image;
    }
  }

  /**
   * Open Sheet Services Customer
   */
  public openBottomSheet(quotes: any): void {
    this._bottomSheet.open(ServicesSheetCustomerComponent, {
      data: { quotes }
    });
  }

}
