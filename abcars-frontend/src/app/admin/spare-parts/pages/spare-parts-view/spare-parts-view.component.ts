import { Component, type OnInit } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatTableDataSource } from '@angular/material/table';
import { SparePartsEditComponent } from '../../components/spare-parts-edit/spare-parts-edit.component';
import { ActivatedRoute } from '@angular/router';
import { SparePartsService } from '@services/spare-parts.service';
import { GetVehicleDetailParts, Vehicle } from '@interfaces/getVehicleDetailParts.interface';
import { Overview } from '@interfaces/admin.interfaces';

@Component({
    selector: 'app-spare-parts-view',
    templateUrl: './spare-parts-view.component.html',
    styleUrls: ['./spare-parts-view.component.css'],
    standalone: false
})
export class SparePartsViewComponent implements OnInit {

    public displayedColumns: string[] = ['id', 'name', 'amount', 'hours', 'fill', 'carVin', 'actions']; /** 'status', 'idSell',*/
    public dataSource!: MatTableDataSource<any>;
    public dataVehicle!: Vehicle

    // References Overview para el encabezado
    public itemOverview: Overview;

    constructor(
        private _bottomSheet: MatBottomSheet,
        private _router: ActivatedRoute,
        private _spareParsService: SparePartsService
    ) {
        // Inicializar itemOverview
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            this.itemOverview = {
                user: {
                    name: user.name || user.nickname || 'Usuario',
                    surname: user.surname || '',
                    role: 'Spare Parts',
                    email: user.email || '',
                    picturepath: ''
                },
                pages: [
                    {
                        title: 'Refacciones Vehículos',
                        icon: 'fi fi-rr-car',
                        permalink: '/admin/spare_parts/administration'
                    }
                ]
            };
        } catch (error) {
            // Fallback si hay error al parsear
            this.itemOverview = {
                user: {
                    name: 'Usuario',
                    surname: '',
                    role: 'Spare Parts',
                    email: '',
                    picturepath: ''
                },
                pages: [
                    {
                        title: 'Refacciones Vehículos',
                        icon: 'fi fi-rr-car',
                        permalink: '/admin/spare_parts/administration'
                    }
                ]
            };
        }
    }

    ngOnInit(): void { 
        const valuation_uuid = this._router.snapshot.params.uuid;
        this.getVehicleDetailParts(valuation_uuid);
    }

    public openSparePartsEdit(part_uuid: string) {
        this._bottomSheet.open(SparePartsEditComponent, {
            data: {
                partUuid: part_uuid
            }
        });
    }

    public getVehicleDetailParts(valuation_uuid: string) {
        console.log(valuation_uuid);
        this._spareParsService.getVehicleDetailParts(valuation_uuid)
            .subscribe({
                next: ( response: GetVehicleDetailParts) => {
                    console.log(response.data);
                    this.dataSource = new MatTableDataSource(response.data.parts.data);
                    this.dataVehicle = response.data.vehicle;
                }
            });
    }

}
