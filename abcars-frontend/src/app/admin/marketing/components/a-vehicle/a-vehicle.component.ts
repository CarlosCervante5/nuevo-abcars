import { Component, Input, EventEmitter, Output  } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { CompraTuAutoService } from '@services/compra-tu-auto.service';
import Swal from 'sweetalert2';
import { UpdateVehicleComponent } from '../update-vehicle/update-vehicle.component';
import {reload} from '@helpers/session.helper';
import { Vehicle} from 'src/app/dashboard/pages/comprar-autos/interfaces/detail/vehicle_data.interface';
import { Router } from '@angular/router';


@Component({
    selector: 'app-a-vehicle',
    templateUrl: './a-vehicle.component.html',
    styleUrls: ['./a-vehicle.component.css'],
    standalone: false
})
export class AVehicleComponent {
  @Input() vehicle!: Vehicle;    

  @Output() reload = new EventEmitter<Boolean>();
  @Output() add_vehicle_uuid = new EventEmitter<string>();
  @Output() remove_vehicle_uuid = new EventEmitter<string>();

  checked = false;
  

  constructor(
    private _compraTuAutoService: CompraTuAutoService,
    private _bottomSheet: MatBottomSheet,
    private _router: Router
  ) { 
    
  }

  /**
   * Panel único: datos + imágenes.
   * @param initialTab 0 = datos, 1 = imágenes
   */
  openEditSheet(initialTab: 0 | 1 = 0): void {
    const bottomSheetRef = this._bottomSheet.open(UpdateVehicleComponent, {
      data: {
        uuid: this.vehicle.uuid,
        initialTab
      },
      panelClass: 'update-vehicle-wide-sheet'
    });
    bottomSheetRef.afterDismissed().subscribe((dataFromChild) => {      
      if (dataFromChild != undefined && dataFromChild.reload === true) {        
        this.reload.emit(true);
      }      
    });
  }

  public eliminar( vehicle_uuid:string ){
    Swal.fire({
      title: 'Estas segur@ que quieres eliminar esta unidad?',      
      showCancelButton: true,
      confirmButtonText: 'Eliminar', 
      confirmButtonColor: '#008bcc',           
    }).then((result) => {
      if (result.isConfirmed) {        
        this._compraTuAutoService.deleteVehicle( vehicle_uuid )
        .subscribe({
          next:( resp ) => {                                  
            this.reload.emit(true);             
            Swal.fire(resp.message, '', 'success');
          },
          error: (error:any) => {
            reload(error, this._router);
          }
        })
      }
    })
  }

  cardChecked(){
    if( this.checked ){
      this.add_vehicle_uuid.emit(this.vehicle.uuid);
    }else {
      this.remove_vehicle_uuid.emit(this.vehicle.uuid);
    }
  }
}
