import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { LoadImagesPromoComponent } from '../../components/load-images-promo/load-images-promo.component';
import { environment } from '@environments/environment';
import { CreateCampaingComponent } from '../../components/create-campaing/create-campaing.component';
import { CampaingService } from '../../services/campaing.service';
import { UpdateImagesComponent } from '../../components/update-images/update-images.component';
import {GetcampaingResponse, Campaign, Overview} from '@interfaces/admin.interfaces';
import { CampaignPlacement } from '../../../../shared/constants/fallback-media';
import Swal from 'sweetalert2';
import {reload} from '@helpers/session.helper';
import { Router } from '@angular/router';

interface Brand{
  brand: string;
  path: string | null;
}

@Component({
    selector: 'app-promotions',
    templateUrl: './promotions.component.html',
    styleUrls: ['./promotions.component.css'],
    standalone: false
})
export class PromotionsComponent implements OnInit {
  /** Dentro de AdminShell (/admin/administrator/promotions). */
  embedInShell = false;

  placement: CampaignPlacement = 'showroom';
  pageTitle = 'Administrar Campañas';
  breadcrumbLabel = 'Campañas';
  moduleTitle = 'Promociones';

  public baseUrl: string = environment.baseUrl;
  @Output() reload = new EventEmitter<Boolean>();
  public img_campaign_path!:string;

  public itemOverview: Overview;

  constructor(
    private _bottomSheet: MatBottomSheet,
    private _campaingService: CampaingService,
    private _router: Router,
    private _route: ActivatedRoute
  ) {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      this.itemOverview = {
        user: {
          name: user.name || user.nickname || 'Usuario',
          surname: user.surname || '',
          role: 'Gestor de marketing',
          email: user.email || '',
          picturepath: ''
        },
        pages: [
          {
            title: 'Promociones',
            icon: 'fi fi-rr-car',
            permalink: '/admin/gestor/promotions'
          }
        ]
      };
    } catch (error) {
      this.itemOverview = {
        user: {
          name: 'Usuario',
          surname: '',
          role: 'Gestor de marketing',
          email: '',
          picturepath: ''
        },
        pages: [
          {
            title: 'Promociones',
            icon: 'fi fi-rr-car',
            permalink: '/admin/gestor/promotions'
          }
        ]
      };
    }

    // La carga se hace en ngOnInit cuando placement ya viene de la ruta.
  }

  ngOnInit(): void {
    this.embedInShell = this._route.snapshot.data['embedInShell'] === true;
    const routePlacement = this._route.snapshot.data['placement'];
    if (routePlacement === 'inventory' || routePlacement === 'showroom') {
      this.placement = routePlacement;
    }

    if (this.placement === 'inventory') {
      this.pageTitle = 'Administrar Campañas de Inventario';
      this.breadcrumbLabel = 'Promociones Inventario';
      this.moduleTitle = 'Promociones Inventario';
    }

    if (this.itemOverview?.pages?.[0]) {
      this.itemOverview.pages[0].title = this.moduleTitle;
      this.itemOverview.pages[0].permalink = this.embedInShell
        ? `/admin/administrator/${this.placement === 'inventory' ? 'inventory-promotions' : 'promotions'}`
        : `/admin/gestor/${this.placement === 'inventory' ? 'inventory-promotions' : 'promotions'}`;
    }

    this.showcampaing();
  }

  public campaigns: Campaign[] = [];
  public length: number = 0;

  public openBottomSheet(campaign: string): void{
    const openLoadImages = this._bottomSheet.open(LoadImagesPromoComponent , {
      data: {
        campaign
      }
    });
    openLoadImages.afterDismissed().subscribe((dataFromChild) => {      
      if(dataFromChild != undefined && dataFromChild.reload === true ){        
        this.reload.emit(true);
      }     
    });
  }

  openUpdateOrder( campaign_id:string, promotions:any[] ): void {
    const bottomSheetRef2 = this._bottomSheet.open(UpdateImagesComponent, {
      data: {
        campaign_id,
        images: promotions
      }
    });  
    bottomSheetRef2.afterDismissed().subscribe((dataFromChild) => {                  
      if( dataFromChild != undefined && dataFromChild.first_image === true) {
        this.reload.emit(true);                                
      }
      this.showcampaing();   
    }); 
  }

  newCampaing(): void {
    const bottomSheetRef = this._bottomSheet.open(CreateCampaingComponent, {
      data: { placement: this.placement }
    });
    bottomSheetRef.afterDismissed().subscribe((dataFromChild) => {      
      if(dataFromChild != undefined && dataFromChild.reload === true ){        
        this.reload.emit(true);
        this.showcampaing();
      }      
    });
  }

  public showcampaing () {
    this._campaingService.getCampaing(this.placement)
    .subscribe({
      next: (response: GetcampaingResponse) => {
     this.campaigns = response.data.campaigns;
     let x = this.campaigns;
     x.forEach(element => {
      let d = element.begin_date;
      let d2 = element.end_date;
      let td = this.formatDate(d);
      let td2 = this.formatDate(d2);
      element.begin_date = td;
      element.end_date = td2;
      if((element.promotions).length > 0){
        element.promo_Path = element.promotions[0].image_path;
      }else{
        element.promo_Path = "";
      }
     });
     this.campaigns = x;
     
    },
    error: (error:any) => {
      reload(error, this._router);
    }
    })
  }
    public formatDate(dateString: any): string {
    const date = new Date(dateString  + 'T00:00:00Z');
    const day = (String(date.getUTCDate()).padStart(2, '0'));
    const month = String(date.getUTCMonth()+1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}-${month}-${year}`;
}

  public deleteCampaign ( uuid : string){
    Swal.fire({
      title: 'Estas segur@ que quieres eliminar esta campaña?',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      confirmButtonColor: '#008bcc',
    }).then((result) => {
      if (result.isConfirmed) {
        this._campaingService.deleteCampaign( uuid )
            .subscribe({
              next: (resp) => {
                Swal.fire(resp.message, '', 'success');
              },
              error:(error:any)=>{
                reload(error, this._router);
              }
            })
                this.reload.emit(true);
                this.showcampaing();
      }
    })
  }

  public campai( primera_imagen:any ){      
 
    return primera_imagen || 'assets/images/demo_image.png';      
      
  }

}
