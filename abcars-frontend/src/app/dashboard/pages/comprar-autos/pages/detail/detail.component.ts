
import { Component, OnInit, ViewChild, Inject, ElementRef, HostListener} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '@environments/environment';
import { Location } from '@angular/common';
import { register } from 'swiper/element/bundle';
// register Swiper custom elements
register();

// Angular Material
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatSnackBar, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

// Services 
import { DetailService } from '@services/detail.service';
// Components
import { AskInformationComponent } from '../../components/ask-information/ask-information.component';
import { VideoModalComponent } from '../../components/video-modal/video-modal.component';
// Interfaces
import { DetailResponse, Vehicle, ImageCarousel, RecommendedResponse, Campaign } from '@interfaces/vehicle_data.interface';

@Component({
    selector: 'app-detail',
    templateUrl: './detail.component.html',
    styleUrls: ['./detail.component.scss'],
    standalone: false
})

export class DetailComponent implements OnInit {

  @ViewChild('myModal') modal!: ElementRef;
  @ViewChild('myImg') img!: ElementRef;
  @ViewChild('img01') modalImg!: ElementRef; 
  @ViewChild('caption') caption!: ElementRef;

  // References of Help
  public pageVehicle: string = '';
  public baseUrl: string = environment.baseUrl;

  // References of Button
  public route: boolean = false;
  public locationVeh: string = '';
  // References Vehicle
  public uuid!:string;
  public vin!:string;
  public vehicle!: Vehicle;
  public campaigns!: Campaign[];
  public promotions !: any[];
  public imagesForSlider: ImageCarousel[] = [];  
  public pathStockBrand: string = '';
  public pathStockCarmodel: string = '';
  public description: string = '';
  public descriptions!: string[];
  public priceOffer: boolean = false;
  public legalDate!: Date;
  public dia!:any;
  public mes!:any;
  public year!:any;
  public dates!:any;
  public priceBond!:any;
  execute!:string;

  public ancho!: number;
  public anchoCards!: number;
  public anchoS!: string;
  public anchoW!: number;

  // Recommended vehicles
  public recommended_vehicles: Vehicle[] = [];
  
  public textButton:string = 'AÑADIR A LISTA';

  horizontalPosition: MatSnackBarHorizontalPosition = 'end';
  verticalPosition: MatSnackBarVerticalPosition = 'bottom';
  
  constructor(
    private _bottomSheet: MatBottomSheet,
    private _router: Router,
    private _activatedRoute: ActivatedRoute,
    private _detailService: DetailService,
    private _snackBar: MatSnackBar,  
    public dialog: MatDialog,

    @Inject(DOCUMENT) private location: Location,
    @Inject(DOCUMENT) private _document: Document
  ) { 
    // Assign active route for shared button    
    this.pageVehicle = window.location.href;       
     
  }
  
  ngOnInit(): void {
    const date = new Date();
    const legalDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    const nombresMeses = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    
    const dia = legalDate.getDate();
    const mes = nombresMeses[legalDate.getMonth()];
    const year = legalDate.getFullYear();
    
     this.dates =dia + " de " + mes + " de " + year;

     this._activatedRoute.params
     .subscribe({
       next: (params) => {
         this.uuid = params['uuid'];
         this.getVehicle();
       }
     }); 
  }

  public notFound(){
    this._router.navigateByUrl('404');
  }

  /**
   * Button for Copy url active to shared button
   */
  public openSnackBarCopy() {  
    // Lauch Snackbar
    this._snackBar.open('Copiado', '', {
      horizontalPosition: 'center',
      verticalPosition: 'top',
      duration: 2000,
      panelClass: ['snackbar']
    });    
  }

  public getVehicle() {
    
    this._detailService.getVehicleDetail(`${ this.uuid }`)
    .subscribe({
      next: ( response: DetailResponse ) => {
        
        this.vehicle =  response.data;
        this.campaigns = this.vehicle.campaigns;
        this.vin = this.vehicle.vin;
        this.getRecommended();
        this.existsInList(); 
        
        this.priceOffer = this.vehicle.offer_price != null ? true : false;
        this.description = this.vehicle.description!;
          
        this.vehicle.images.map( image => {
          this.imagesForSlider.push(
            { path: image.service_image_url }
          )
        });

        this.pathStockBrand = `/compra-tu-auto/${ this.vehicle.category == 'new' ? `Nuevo` : 'Seminuevo' }/${ this.vehicle.brand.name }/sin-lineas/sin-modelos/sin-carrocerias/sin-versiones/sin-anios/100000/5000000/sin-estados/sin-busqueda/sin-transmisiones/sin-colores/sin-colores/1`;
        this.pathStockCarmodel = `/compra-tu-auto/${ this.vehicle.category == 'new' ? `Nuevo` : 'Seminuevo' }/${ this.vehicle.brand.name }/sin-lineas/${ this.vehicle.model.name }/sin-carrocerias/sin-versiones/sin-anios/100000/5000000/sin-estados/sin-busqueda/sin-transmisiones/sin-colores/sin-colores/1`;

          
        if (this.description != null) {
          this.descriptions = this.description.split('\n');
        } else {
          this.descriptions = ["Lo sentimos, este vehículo no cuenta con alguna descripción activa."];
        }
               
        if ( this.vehicle.images.length == 0 ) {
          this.imagesForSlider.push(
            { path: this.baseUrl + '/api/image_vehicle/vacio' }
          );
        }
   
      },
      error(error){
        console.log(error);
      }
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.anchoW = window.innerWidth;
    this.anchoS = this.anchoW - 50+ 'px';
    if(this.anchoW < 500){
      this.ancho = 1;
      this.anchoCards = 1;
    }else{
      if(this.anchoW < 1000){
        this.ancho = 3;
        this.anchoCards = 2;
      }else{
        if(this.anchoW < 1200){
          this.anchoCards = 3
        }else{
          this.ancho = 4;
        this.anchoCards = 4;
        }
      }
    }
  }


  public getRecommended(){

    let priceMin = this.vehicle.list_price - 100000;
    let priceMax = this.vehicle.list_price + 100000; 

    this._detailService.getRecommendedVehicles(priceMin, priceMax)
    .subscribe({
      next: ( recommended: RecommendedResponse ) => {
        this.recommended_vehicles = recommended.data;
      }
    });
  }

  /**
   * Show Picture Selected
   * @param position Number
   */
  
  public changeImageSelected (img: string, i: number){
    let nImage: ImageCarousel[] = [];
    let ind = 0;
    //se busca la imagen seleccionada, y se obtiene su posición actual
    for (let j = 0; j < this.imagesForSlider.length; j++) {
      if(img == this.imagesForSlider[j].path){
          ind = j;
      }
    }
    //se guardan las imagenes posteriores a la seleccionada
    for (let h = ind; h < this.imagesForSlider.length; h++) {
      nImage.push(this.imagesForSlider[h]);
    }
    //se guardan las imagenes anteriores a la seleccionada
    for (let j = 0; j < ind; j++) {
      nImage.push(this.imagesForSlider[j]);
    }
    this.imagesForSlider = nImage;
  }


  /**
   * Ask Information Vehicle
   */
  public askInformation(vehicle: Vehicle) {
    this.addToList();
    this._bottomSheet.open(AskInformationComponent, {
      data: {
        vehicle_uuid: this.vehicle.uuid,
        vehicle: vehicle.name,
        brand: vehicle.brand.name,
        year: vehicle.model.year,
        dealership_name: vehicle.dealership.name
      }
    });
  }

  public saveVehicleLS(){
    localStorage.setItem("vehicle", JSON.stringify(this.vehicle));
  }
    
  public addToList(){    
    let vehicles: Vehicle[] = JSON.parse(localStorage.getItem('vehicles')!) != null ? JSON.parse(localStorage.getItem('vehicles')!) : [];
    let exists = vehicles.find( vehicle => vehicle.uuid == this.vehicle.uuid );    
  
    if( exists === undefined ){
      vehicles.push(this.vehicle);
    }    

    localStorage.setItem("vehicles", JSON.stringify(vehicles));
    this.existsInList();    
  }

  public existsInList(): void {
    let vehicles: Vehicle[] = JSON.parse(localStorage.getItem('vehicles')!) != null ? JSON.parse(localStorage.getItem('vehicles')!) : [];
    let exists = vehicles.find( vehicle => vehicle.uuid == this.vehicle.uuid );    
    if( exists !== undefined ){
      this.textButton = 'EN MI LISTA';
    }else{
      this.textButton = 'AÑADIR A MI LISTA';
    }
  }

  goBack(): void {
    this.location.back();
  }  

  showModal( src: string) {   
    let imagen = src;
    let legal = "";

    this.modal.nativeElement.style.display = "grid";
    this.modalImg.nativeElement.src = imagen;  
    this.caption.nativeElement.innerHTML = legal ;
  }
  
  closeModal( message:string ) {    
    if( message == "no" ) {
      this.execute = 'no';
    }else if ( message == "yes" && this.execute == 'no' ){
      this.execute = 'processing';
    }else {
      this.execute = 'yes';
    }
    if( this.execute == 'yes' ){
      this.modal.nativeElement.style.display = "none";
    }    
  }

  openVideo(url: string) {
    const embedUrl = this.getEmbedUrl(url);
    this.dialog.open(VideoModalComponent, {
      width: '800px',
      data: {
        videoUrl: embedUrl
      }
    });
  }

  getEmbedUrl(originalUrl: string): string {
    // Soporta URLs con "watch?v=" o "youtu.be/"
    if (originalUrl.includes('watch?v=')) {
      const videoId = originalUrl.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}?controls=0&autoplay=1&modestbranding=1&rel=0&disablekb=1`;
    } else if (originalUrl.includes('youtu.be/')) {
      const videoId = originalUrl.split('youtu.be/')[1];
      return `https://www.youtube.com/embed/${videoId}?controls=0&autoplay=1&modestbranding=1&rel=0&disablekb=1`;
    }
    return '';
  }
  
}