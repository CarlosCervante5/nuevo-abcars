import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import {reload} from '@helpers/session.helper';
// Services
import { CompraTuAutoService } from '@services/compra-tu-auto.service';

// Interfaces
import { MatSnackBar } from '@angular/material/snack-bar';
import Swal from 'sweetalert2';
import { VehicleService, } from '@services/vehicle.service';

import { Vehicle, SearchResponse, LoadVehiclesResponse} from '@interfaces/vehicle_data.interface';
import { StoreVehicleComponent } from '../../components/store-vehicle/store-vehicle.component';
import { Overview } from '@interfaces/admin.interfaces';
import { IntelimotorService } from '@services/intelimotor.service';
import { forkJoin } from 'rxjs';



@Component({
    selector: 'app-vehicles',
    templateUrl: './vehicles.component.html',
    styleUrls: ['./vehicles.component.css'],
    standalone: false
})
export class VehiclesComponent implements OnInit {
  /** true cuando la vista va dentro de AdminShell (/admin/administrator/vehicles). */
  embedInShell = false;
  // MatPaginator Inputs
  public length: number = 0;
  public pageSize: number = 12;
  public pageSizeOptions: number[] = [12, 15, 30, 45, 60, 150];

  /** Filtro de estado enviado al API (listado admin). */
  public statusFilter: 'all' | 'active' | 'inactive' = 'all';

  // MatPaginator Output
  pageEvent!: PageEvent;

  // Vehiculos
  public vehicles: Vehicle[] = [];

  public palabra_busqueda:string = '';

  public relationship_names: string[] = ['brand','line','model','version','body','dealership','specification','firstImage','images'];

  files:File[] = [];
  disabled:Boolean = true;
  loading:Boolean = false;
  load_vehicle_message = 'Cargar vehículos con csv';
  errorMessage: string = '';

  public pageIndex: number = 1;

  public vehicle_uuids: string[] = [];
  public pushingIntelimotorBulk = false;

  // References Overview para el encabezado
  public itemOverview: Overview;

  // Table
  public dataSource!: MatTableDataSource<Vehicle>;
  public displayedColumns: string[] = ['image', 'status', 'nameVehicle', 'vin', 'km', 'price', 'actions'];

  constructor(
    private _vehicleService: VehicleService,
    private _compraTuAutoService: CompraTuAutoService,
    private _bottomSheet: MatBottomSheet,
    private _snackBar: MatSnackBar,
    private _router: Router,
    private _route: ActivatedRoute,
    private _intelimotorService: IntelimotorService
  ) {
    // Inicializar itemOverview
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      this.itemOverview = {
        user: {
          name: user.name || user.nickname || 'Usuario',
          surname: user.surname || '',
          role: 'Marketing',
          email: user.email || '',
          picturepath: ''
        },
        pages: [
          {
            title: 'Vehículos',
            icon: 'fi fi-rr-car',
            permalink: '/admin/marketing/vehicles'
          }
        ]
      };
    } catch (error) {
      // Fallback si hay error al parsear
      this.itemOverview = {
        user: {
          name: 'Usuario',
          surname: '',
          role: 'Marketing',
          email: '',
          picturepath: ''
        },
        pages: [
          {
            title: 'Vehículos',
            icon: 'fi fi-rr-car',
            permalink: '/admin/marketing/vehicles'
          }
        ]
      };
    }
    // Inicializar dataSource
    this.dataSource = new MatTableDataSource<Vehicle>([]);
    this.getVehicles(1);
  }

  ngOnInit(): void {
    this.embedInShell = this._route.snapshot.data['embedInShell'] === true;
    const permalink = this.embedInShell
      ? '/admin/administrator/vehicles'
      : '/admin/marketing/vehicles';
    if (this.itemOverview?.pages?.[0]) {
      this.itemOverview.pages[0].permalink = permalink;
    }
  }

    /**
     * Get vehicles
     */
    public getVehicles(page: number) {
        this.loading = true;
        this._vehicleService
          .getVehicles(
            page,
            this.palabra_busqueda,
            this.pageSize,
            this.relationship_names,
            this.statusFilter
          )
          .subscribe({
            next: (response: SearchResponse) => {
              this.vehicles = response.data.data;
              this.dataSource = new MatTableDataSource(this.vehicles);
              this.length = response.data.total;
              this.loading = false;
            },
            error: (error: unknown) => {
              this.loading = false;
              reload(error, this._router);
            }
          });
    }

    applyFilters(): void {
      this.pageIndex = 1;
      this.getVehicles(1);
    }

    clearFilters(): void {
      this.palabra_busqueda = '';
      this.statusFilter = 'all';
      this.pageIndex = 1;
      this.getVehicles(1);
    }

    setStatusFilter(mode: 'all' | 'active' | 'inactive'): void {
      if (this.statusFilter === mode) {
        return;
      }
      this.statusFilter = mode;
      this.pageIndex = 1;
      this.getVehicles(1);
    }

    /**
     *  Change pagination
     */
    public paginationChange(pageEvent: PageEvent) { 
      this.pageEvent = pageEvent;
      this.pageSize = this.pageEvent.pageSize;   
      this.pageIndex = this.pageEvent.pageIndex + 1;
      this.getVehicles( this.pageIndex );  
    }  

    selectCsv( event: Event ){
      const element = event.currentTarget as HTMLInputElement;
      let fileList: FileList | null = element.files;
      if (fileList) {  
        this.files = Array.from(fileList);  
        if(this.files.length > 0){
          this.disabled = false;
          this.load_vehicle_message = 'Listo para subir';        
        }else{
          this.disabled = true;
          this.load_vehicle_message = 'Cargar vehículos';        
        }
      }    
    }

    uploadCsv() {
      this._compraTuAutoService.uploadCsv(this.files[0])
        .subscribe({
          next: (LoadVehicles: LoadVehiclesResponse) => {
            const errors = LoadVehicles.data || [];
            const limitedErrors = errors.slice(0, 5);
            const remainingErrors = errors.length - limitedErrors.length;
    
            const createErrorListHtml = (errorArray: any[]) => `
              <ul>
                ${errorArray.map(err =>
                  `<li>Fila: ${err.row} | Atributo: ${err.attribute} - ${err.errors.join(', ')}</li>`
                ).join('')}
              </ul>`;
    
            const limitedErrorHtml = `
              <p>Se encontraron los siguientes errores:</p>
              ${createErrorListHtml(limitedErrors)}
              ${errors.length > 5 ? `<p>...y ${remainingErrors} errores más.</p>` : ''}
            `;
    
            Swal.fire({
              icon: errors.length > 0 ? 'warning' : 'success',
              title: LoadVehicles.message,
              html: limitedErrorHtml,
              showConfirmButton: true,
              confirmButtonColor: '#EEB838',
              width: '600px',
              timer: 30000,
              footer: errors.length > 5 ? 
                `<button id="seeAllErrors" class="see-all-errors-btn">Ver todos los errores</button>` 
                : ''
            });
    
            // Estilos del botón de "Ver todos los errores"
            const styles = `
              #seeAllErrors {
                background-color: #f5b042;
                color: white;
                border: none;
                padding: 10px 20px;
                font-size: 14px;
                border-radius: 8px;
                cursor: pointer;
                transition: background-color 0.3s ease, transform 0.1s ease;
              }
              #seeAllErrors:hover {
                background-color: #ee9b00;
              }
              #seeAllErrors:active {
                transform: scale(0.95);
              }
            `;
    
            // Inyectar los estilos en el documento
            const styleSheet = document.createElement('style');
            styleSheet.type = 'text/css';
            styleSheet.innerText = styles;
            document.head.appendChild(styleSheet);
    
            const interval = setInterval(() => {
              const button = document.getElementById('seeAllErrors');
              if (button) {
                clearInterval(interval);
                button.addEventListener('click', () => {
                  Swal.fire({
                    icon: 'warning',
                    title: 'Errores completos',
                    html: createErrorListHtml(errors),
                    width: '900px',
                    showConfirmButton: true,
                    confirmButtonColor: '#EEB838'
                  });
                });
              }
            }, 100);
    
            this.getVehicles(1); // Recargar los vehículos
          },
          error: (error) => {

            Swal.fire({
              icon: 'error',
              title: 'Error al subir el archivo',
              text: 'Hubo un problema con la solicitud. Por favor, inténtalo de nuevo.',
              showConfirmButton: true,
              confirmButtonColor: '#EEB838'
            });
          }
        });
    }
    
   
    openSnackBar(message: string, verticalPosition:any, className:string) {
      this._snackBar.open(message, "cerrar", {
        duration: 3000,
        horizontalPosition: "end",
        verticalPosition: verticalPosition,
        panelClass: [className],
      });
    }

    procesaPropagar( action:any ){
      if( action === true ){
        this.getVehicles(this.pageIndex);
      }
    }

    addVehicle_uuid( vehicle_uuid:string ) {
      this.vehicle_uuids.push( vehicle_uuid );    
    }

    removeVehicle_uuid( vehicle_uuid:string ) {
      this.vehicle_uuids.map( ( element, index ) => {
        if( element === vehicle_uuid ){
          this.vehicle_uuids.splice(index, 1);
        }      
      });    
    }

    deleteSelectedVehicles():void {
      Swal.fire({
        title: 'Estas segur@ que quieres eliminar estas unidades?',      
        showCancelButton: true,
        confirmButtonText: 'Eliminar', 
        confirmButtonColor: '#008bcc',           
      }).then((result) => {
        /* Read more about isConfirmed, isDenied below */
        if (result.isConfirmed) {        
          this._compraTuAutoService.deleteVehicles( this.vehicle_uuids )
          .subscribe({
            next: () => {
              Swal.fire('vehículos eliminados con exito', '', 'success');
              this.vehicle_uuids = [];
              this.getVehicles( this.pageIndex );
            },
            error: (error:any) => {
              reload(error, this._router);
            }
          });
        }
      })
    }

    changeStatus( status:string ): void {
      Swal.fire({
        title: 'Estas segur@ que quieres cambiar el estatus estas unidades?',      
        showCancelButton: true,
        confirmButtonText: 'Actualizar', 
        confirmButtonColor: '#008bcc',           
      }).then((result) => {
        /* Read more about isConfirmed, isDenied below */
        if (result.isConfirmed) {

          this._compraTuAutoService.changeStatusVehicles( this.vehicle_uuids, status )
          .subscribe({
            next: () => {
              Swal.fire('vehículos actualizados con exito', '', 'success');
              this.vehicle_uuids = [];
              this.getVehicles( this.pageIndex );
            },
            error: (error:any) => {
              reload(error, this._router);
            }
          });
        
        }
      })
    }

    get selectedIntelimotorVehicleUuids(): string[] {
      const selected = new Set(this.vehicle_uuids);
      return (this.dataSource?.data ?? [])
        .filter((vehicle) =>
          selected.has(vehicle.uuid) &&
          !!vehicle.intelimotor_unit_id &&
          vehicle.page_status !== 'sale'
        )
        .map((vehicle) => vehicle.uuid);
    }

    pushIntelimotorPhotosBulk(): void {
      const targets = this.selectedIntelimotorVehicleUuids;
      if (targets.length === 0 || this.pushingIntelimotorBulk) {
        return;
      }

      Swal.fire({
        title: '¿Subir fotos a Intelimotor?',
        text: `Se actualizarán ${targets.length} unidad(es) vinculada(s).`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Subir fotos',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#059669'
      }).then((result) => {
        if (!result.isConfirmed) {
          return;
        }

        this.pushingIntelimotorBulk = true;
        forkJoin(
          targets.map((uuid) => this._intelimotorService.pushVehiclePhotos(uuid))
        ).subscribe({
          next: () => {
            this.pushingIntelimotorBulk = false;
            Swal.fire('Listo', `Fotos enviadas para ${targets.length} vehículo(s).`, 'success');
          },
          error: (err) => {
            this.pushingIntelimotorBulk = false;
            const message = err?.error?.message || 'Algunas fotos no se pudieron subir a Intelimotor';
            Swal.fire('Error', message.replace(/^Hubo un problema con su solicitud:\s*/i, ''), 'error');
          }
        });
      });
    }

    openStoreVehicleSheet(): void {
      const bottomSheetRef = this._bottomSheet.open(StoreVehicleComponent, {
        panelClass: 'store-vehicle-wide-sheet'
      });

      bottomSheetRef.afterDismissed().subscribe((dataFromChild) => {      
        if(dataFromChild != undefined && dataFromChild.reload === true ){        
          this.getVehicles( this.pageIndex );
        }      
      });
    }

    /**
     * Image helper method
     */
    public image(primera_imagen: any): string {
      return primera_imagen || 'assets/images/demo_image.png';
    }
}


