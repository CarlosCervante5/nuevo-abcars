import { Component, Output, EventEmitter, HostListener, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { AdminService } from '@services/admin.service';
import { Datum, UsersResponse, userTable } from '@interfaces/admin.interfaces';
import { AddUserComponent } from '../../components/add-user/add-user.component';
import Swal from 'sweetalert2';
import { UpdateUserComponent } from '../../components/update-user/update-user.component';
import { Dealership } from '../../../../shared/interfaces/admin.interfaces';
import { displayAdminRoleNameEs } from 'src/app/shared/utils/admin-role-labels';

@Component({
    selector: 'app-admin-users',
    templateUrl: './admin-users.component.html',
    styleUrls: ['./admin-users.component.css'],
    standalone: false
})
export class AdminUsersComponent implements OnDestroy {
    public users !: Datum[];
    public uuids: userTable[] = [];
    //variables para la paginación
    public paginate = 15;
    public page: number = 1;
    public pageIndex: number = 1;
    public length: number  = 0;
    //variables para mla parte responsiva
    public anchoW !: number;
    public datosM = '';
    public mostrarId!: string;
    public mostrar= false;
    public valuator = 'valuator';

    /** Texto de búsqueda (rol, nombre, apellido, correo, teléfono) */
    public searchKeyword = '';
    private searchDebounceHandle: ReturnType<typeof setTimeout> | null = null;

    roleLabel(technical: string): string {
        return displayAdminRoleNameEs(technical);
    }

    dataSource = new MatTableDataSource(this.uuids);
    displayedColumns: string[] = [
        'n',
        'Rol',
        'Nombre',
        'sucursal',
        'email',
        'fecha',
        'opciones'
    ];

    @Output() reload = new EventEmitter<Boolean>();

    constructor(
        private _adminservice : AdminService,
        private _bottomSheet: MatBottomSheet
    ){
        this.loadUsers();
        if(window.innerWidth < 360){
            this.datosM = 'movil';
            this.displayedColumns = [
                'n',
                'Rol',
            ];
        }else{
            if(window.innerWidth  > 361 && window.innerWidth  < 900){
                this.datosM = 'movil2';
                this.displayedColumns = [
                        'n',
                        'Rol',
                        'Nombre',
                        'sucursal',
                ];
            }else{
                if(window.innerWidth > 901 && window.innerWidth < 1020){
                    this.datosM = 'tablet';
                    this.displayedColumns = [
                        'n',
                        'Rol',
                        'Nombre',
                        'sucursal',
                        'email',
                        'fecha',
                    ];
                }else{
                    this.displayedColumns = [
                        'n',
                        'Rol',
                        'Nombre',
                        'sucursal',
                        'email',
                        'fecha',
                        'opciones'
                    ];
                }
            }
        }
    }
    
    public loadUsers(): void {
        this._adminservice.getUsers(this.page, this.searchKeyword)
        .subscribe({
            next: (response : UsersResponse) =>{
                this.users = response.data.data;
                this.length = response.data.total;
                this.pageIndex = response.data.current_page;
                const datosR = this.users.map((user, index) => ({
                    fecha:      user.created_at,
                    email:      user.email,
                    nickname:   user.nickname,
                    index:      ((this.pageIndex-1) * this.paginate)+(index+1),
                    uuid:       user.uuid,
                    name:       user.profile?.name,
                    last_name:  user.profile?.last_name,
                    rol:        user.role,
                    location:   user.profile?.location,
                    picture:    user.profile?.picture,
                }));
                this.uuids = datosR;
                this.dataSource.data = this.uuids;
            }
        });
    }

    /** Debounce: al escribir se consulta el API (rol, nombre, correo, etc.) */
    public onSearchKeywordChange(): void {
        if (this.searchDebounceHandle) {
            clearTimeout(this.searchDebounceHandle);
        }
        this.searchDebounceHandle = setTimeout(() => {
            this.searchDebounceHandle = null;
            this.page = 1;
            this.loadUsers();
        }, 400);
    }

    ngOnDestroy(): void {
        if (this.searchDebounceHandle) {
            clearTimeout(this.searchDebounceHandle);
        }
    }
    
    public paginationChange(event: PageEvent) {
        this.page = event.pageIndex + 1;
        this.loadUsers();
    }

    public addUser(){
        const bottomSheetRef = this._bottomSheet.open(AddUserComponent, {
          panelClass: 'bottom-sheet-crud-wide'
        });
        bottomSheetRef.afterDismissed().subscribe((dataFromChild) => {      
            if(dataFromChild != undefined && dataFromChild.reload === true ){        
                this.reload.emit(true);
                this.loadUsers();
            }
        });
    }
    
    public deleteUser ( uuid : string){
        Swal.fire({
            title: 'Estas segur@ que quieres eliminar este Usuario?',
            showCancelButton: true,
            confirmButtonText: 'Eliminar',
            confirmButtonColor: '#008bcc',
        }).then((result) => {

            if (result.isConfirmed) {
                this._adminservice.deleteUser( uuid )
                .subscribe(
                (resp) => {
                    Swal.fire(resp.message, '', 'success');
                    this.reload.emit(true);
                    this.loadUsers();
                })
            }
        })
    }

    public updateUser(uuid:string){
        const bottomSheetRef = this._bottomSheet.open(UpdateUserComponent, {
            data: { uuid },
            panelClass: 'bottom-sheet-crud-wide'
        });
        bottomSheetRef.afterDismissed().subscribe((dataFromChild) => {      
            if(dataFromChild != undefined && dataFromChild.reload === true ){        
                this.reload.emit(true);
                this.loadUsers();
            }
        });
    }

    //función que detecta el cambio de pantalla y muestra la tabla
    @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.anchoW = window.innerWidth;

    if(this.anchoW > 300 && this.anchoW < 360){
        this.datosM = 'movil';
        this.displayedColumns = [
            'n',
            'Rol',
        ];
    }else{
        if(this.anchoW > 361 && this.anchoW < 900){
            this.datosM = 'movil2';
            this.displayedColumns = [
                'n',
                'Rol',
                'Nombre',
                'sucursal',
            ];
        }else{
            if(this.anchoW > 901 && this.anchoW < 1320){
                this.datosM = 'tablet';
                this.displayedColumns = [
                    'n',
                    'Rol',
                    'Nombre',
                    'sucursal',
                    'email',
                    'fecha',
                ];
            }else{
                this.displayedColumns = [
                    'n',
                    'Rol',
                    'Nombre',
                    'sucursal',
                    'email',
                    'fecha',
                    'opciones'
                ];
            }
        }
    }
  }

  details(uuid: string){
    this.mostrar= !this.mostrar;
    this.mostrarId = uuid;
    }

}
