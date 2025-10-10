import { Component, Input, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';

// Interfaces
import { Vehicles } from '../../interfaces/my-cars.interface';

@Component({
    selector: 'app-cars-customer',
    templateUrl: './cars-customer.component.html',
    standalone: false
})

export class CarsCustomerComponent implements OnInit {

  // References
  @Input() vehicle!: Vehicles;
  public vehicle_image = '';
  
  constructor() { }

  ngOnInit(): void {
    let primera_imagen = this.vehicle.vehicle_images[0];  
    
    if (primera_imagen != undefined && primera_imagen.external_website == "yes") {
      this.vehicle_image = primera_imagen.path;
    } else {
      this.vehicle_image = primera_imagen != undefined ? this.vehicle.vehicle_images[0].path : 'vacio';
      this.vehicle_image = environment.baseUrl + '/api/image_vehicle/' + this.vehicle_image;
    }
  }

}
