import { Component, OnInit, Input } from '@angular/core';

// Interfaces 
import { environment } from '@environments/environment';
import { Vehicle } from '@interfaces/vehicle_data.interface';

// Services
import { DetailService } from '../../services/detail/detail.service';

@Component({
    selector: 'c-vender-autos-vehicle',
    templateUrl: './vehicle.component.html',
    styleUrls: ['./vehicle.component.css'],
    standalone: false
})

export class VehicleComponent implements OnInit {
  
  public vehicle_image = ''; 
  public choice: boolean = false;
  public baseUrl: string = environment.baseUrl;
  
  @Input() vehicle!: Vehicle; 

  constructor(private _detailService: DetailService) { }

  ngOnInit(): void {  

    this.vehicle_image = this.vehicle.first_image?.service_image_url;
  }

}