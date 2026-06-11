import { Component, Input, EventEmitter, Output  } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { CompraTuAutoService } from '@services/compra-tu-auto.service';
import { IntelimotorService } from '@services/intelimotor.service';
import { VehicleService } from '@services/vehicle.service';
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
  pushingIntelimotor = false;
  markingConsignment = false;

  constructor(
    private _compraTuAutoService: CompraTuAutoService,
    private _bottomSheet: MatBottomSheet,
    private _router: Router,
    private _intelimotorService: IntelimotorService,
    private _vehicleService: VehicleService,
  ) { 
    
  }

  get isConsignment(): boolean {
    return !!this.vehicle?.is_consignment || String(this.vehicle?.category ?? '').toLowerCase() === 'consignment';
  }

  get canPushIntelimotorPhotos(): boolean {
    return !!this.vehicle?.intelimotor_unit_id && this.vehicle.page_status !== 'sale';
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

  pushPhotosToIntelimotor(): void {
    if (!this.canPushIntelimotorPhotos || this.pushingIntelimotor) {
      return;
    }

    Swal.fire({
      title: '¿Subir fotos a Intelimotor?',
      text: 'Se enviarán las imágenes actuales de ABCars a la unidad vinculada en Intelimotor.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Subir fotos',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#059669'
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.pushingIntelimotor = true;
      this._intelimotorService.pushVehiclePhotos(this.vehicle.uuid).subscribe({
        next: (resp) => {
          this.pushingIntelimotor = false;
          Swal.fire('Fotos actualizadas', resp.message, 'success');
        },
        error: (err) => {
          this.pushingIntelimotor = false;
          const message = err?.error?.message || 'No se pudieron subir las fotos a Intelimotor';
          Swal.fire('Error', message.replace(/^Hubo un problema con su solicitud:\s*/i, ''), 'error');
        }
      });
    });
  }

  markAsConsignment(): void {
    if (this.markingConsignment) {
      return;
    }

    Swal.fire({
      title: '¿Marcar como consignación?',
      text: 'El vehículo quedará activo y mostrará el badge Consignación en el catálogo.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Marcar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#7c3aed',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.markingConsignment = true;
      this._vehicleService.markVehicleConsignment(this.vehicle.uuid).subscribe({
        next: (resp) => {
          this.markingConsignment = false;
          this.vehicle.is_consignment = true;
          this.vehicle.page_status = 'active';
          if (String(this.vehicle.category ?? '').toLowerCase() === 'consignment') {
            this.vehicle.category = 'pre_owned';
          }
          this.reload.emit(true);
          Swal.fire('Listo', resp.message || 'Vehículo marcado como consignación', 'success');
        },
        error: (err) => {
          this.markingConsignment = false;
          const message = err?.error?.message || 'No se pudo marcar como consignación';
          Swal.fire('Error', message.replace(/^Hubo un problema con su solicitud:\s*/i, ''), 'error');
        },
      });
    });
  }
}
