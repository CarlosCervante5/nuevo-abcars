import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { FormControl } from '@angular/forms';

import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatAccordion } from '@angular/material/expansion';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

// Services
import { CompraTuAutoService } from '@services/compra-tu-auto.service';

// Interfaces
import { ActivatedRoute, Router } from '@angular/router';
import { FiltersResponse, SearchResponse, Vehicle } from '@interfaces/vehicle_data.interface'

@Component({
    selector: 'app-compra-tu-auto',
    templateUrl: './compra-tu-auto.component.html',
    styleUrls: ['./compra-tu-auto.component.css'],
    standalone: false
})

export class CompraTuAutoComponent implements OnInit {
  // References Input
  public selectable = true;
  public removable = true;
  public separatorKeysCodes: number[] = [ENTER, COMMA];

  // References "Brands"
  public allBrands: string[] = [];
  public filteredBrands: Observable<string[]>;
  public brandCtrl = new FormControl('');
  public brands: string[] = [];

  // References "versions"
  public allVersions: string[] = [];
  public filteredVersions: Observable<string[]>
  public versionCtrl = new FormControl('');
  public versions: string[] = [];

  // References "bodies"
  public allBodies: string[] = [];
  public filteredBodies: Observable<string[]>
  public bodyCtrl = new FormControl('');
  public bodies: string[] = [];

  // References "types"
  public allTypes: string[] = [];
  public filteredTypes: Observable<string[]>;
  public typeCtrl = new FormControl('');
  public types: string[] = [];

  // References "Models"
  public allModels: string[] = [];  
  public filteredModels: Observable<string[]>;
  public modelCtrl = new FormControl('');
  public models: string[] = [];

  // References "Years"
  public allYears: string[] = [];  
  public filteredYears: Observable<string[]>;
  public yearCtrl = new FormControl('');
  public years: string[] = [];

  // References "States"
  public allStates: string[] = [];  
  public filteredStates: Observable<string[]>;
  public stateCtrl = new FormControl('');
  public states: string[] = [];


  // References "Transmission"
  public allTransmissions: string[] = [];  
  public filteredTransmissions: Observable<string[]>;
  public transmissionCtrl = new FormControl('');
  public transmissions: string[] = [];

  // References "Exterior Color"
  public allExtColors: string[] = [];  
  public filteredExtColors: Observable<string[]>;
  public extColorCtrl = new FormControl('');
  public extColors: string[] = [];

  // References "Interior Color"
  public allIntColors: string[] = [];  
  public filteredIntColors: Observable<string[]>;
  public intColorCtrl = new FormControl('');
  public intColors: string[] = [];

  public orden: string = 'ninguno'; /** Antes era vacio */

  // Vehiculos
  public spinner = true;
  public vehicles: Vehicle[] = [];
  public filters: string[] = [];
  public palabra_busqueda: string = '';
  public highEndChange = 1000000;

  private timer: any;
  
  @ViewChild('brandInput') brandInput!: ElementRef<HTMLInputElement>;
  @ViewChild('lineInput') lineInput!: ElementRef<HTMLInputElement>;
  @ViewChild('versionInput') versionInput!: ElementRef<HTMLInputElement>;
  @ViewChild('bodyInput') bodyInput!: ElementRef<HTMLInputElement>;
  @ViewChild('modelInput') modelInput!: ElementRef<HTMLInputElement>;
  @ViewChild('yearInput') yearInput!: ElementRef<HTMLInputElement>;
  @ViewChild('stateInput') stateInput!: ElementRef<HTMLInputElement>;
  @ViewChild('transmissionInput') transmissionInput!: ElementRef<HTMLInputElement>; 
  @ViewChild('typeInput') typeInput!: ElementRef<HTMLInputElement>; 
  @ViewChild('categoryInput') categoryInput!: ElementRef<HTMLInputElement>; 
  @ViewChild('extColorInput') extColorInput!: ElementRef<HTMLInputElement>; 
  @ViewChild('intColorInput') intColorInput!: ElementRef<HTMLInputElement>; 

  @ViewChild(MatAccordion) accordion!: MatAccordion;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  public status: boolean = true;

  // References "Enganche"
  public hitchTickInterval = 1;  
  public hitchMax = 30000000;
  public hitchMin = 10000;
  public hitchStep = 100;
  public thumbLabel = true;
  public disabled = false;
  public showTicks = false;

  // References "Price"
  public max_price = 30000000;
  public min_price = 0;

  // References Main Banner
  public image_path: string = '';

  // MatPaginator Inputs
  public length = 0;
  public pageSize = 25;  
  public pageIndex: number = 1;

  // MatPaginator Output
  public pageEvent!: PageEvent;

  constructor(
    private _compraTuAutoService: CompraTuAutoService,
    private _activatedRoute: ActivatedRoute,
    private _router: Router    
  ) {        

    /**
     * Filtered Elements   
     */     

      // Brands
    this.filteredBrands = this.brandCtrl.valueChanges.pipe(startWith(null),
      map((brand: string | null) => brand ? this._filterBrands(brand) : this.allBrands.slice()));

    // Versions
    this.filteredVersions = this.versionCtrl.valueChanges.pipe(startWith(null),
      map((version: string | null) => version ? this._filterVersions(version) : this.allVersions.slice()));
    
    // Bodies
    this.filteredBodies = this.bodyCtrl.valueChanges.pipe(startWith(null),
      map((body: string | null) => body ? this._filterBodies(body) : this.allBodies.slice()));
      
    // Models
    this.filteredModels = this.modelCtrl.valueChanges.pipe(startWith(null),
      map((model: string | null) => model ? this._filterModels(model) : this.allModels.slice()));

    // Years
    this.filteredYears = this.yearCtrl.valueChanges.pipe(startWith(null),
      map((year: string | null) => year ? this._filterYears(year) : this.allYears.slice()));

    // States 
    this.filteredStates = this.stateCtrl.valueChanges.pipe(startWith(null),
      map((state: string | null) => state ? this._filterStates(state) : this.allStates.slice()));

    // Transmissions 
    this.filteredTransmissions = this.transmissionCtrl.valueChanges.pipe(startWith(null),
      map((transmission: string | null) => transmission ? this._filterTransmissions(transmission) : this.allTransmissions.slice()));
    
    // Exterior colors 
    this.filteredExtColors = this.extColorCtrl.valueChanges.pipe(startWith(null),
      map((extColor: string | null) => extColor ? this._filterExtColors(extColor) : this.allExtColors.slice()));

    // Interior color 
    this.filteredIntColors = this.intColorCtrl.valueChanges.pipe(startWith(null),
      map((intColor: string | null) => intColor ? this._filterIntColors(intColor) : this.allIntColors.slice()));
    
    // Types
    this.filteredTypes = this.typeCtrl.valueChanges.pipe(startWith(null),
      map((type: string | null) => type ? this._filterTypes(type) : this.allTypes.slice()));
      
  }


  ngOnInit(): void {  

    this._compraTuAutoService.loadMainBanner('Imagen banner principal')
    .subscribe({
      next: ( resp ) => {
        this.image_path = resp.data.image_path;
      }
    });
    
    if (window.innerWidth <= 768) { // Puedes ajustar el valor 768 según tus necesidades
      this.status = false; // Cerrado en dispositivos móviles
    } else {
      this.status = true; // Abierto en otros dispositivos
    }

    this._compraTuAutoService.minMax()
      .subscribe({
        next: ( resp ) => {
          this.max_price = resp.data.max_price;
          this.min_price = resp.data.min_price;
        }
      });

    // this.scrollTop();
    this._activatedRoute.params
      .subscribe({
        next: (params) => {
          this.brands = [];
          if (params['marca'] != undefined && params['marca'] != 'sin-marcas') {
            let brands = params['marca'].split('-');
            brands.forEach((brand:string) => {
              this.brands.push( this.capitalizeFirstLetter(brand)  );
            });
          }

          this.models = [];
          if( params['modelo'] != undefined && params['modelo'] != 'sin-modelos'){
            let models = params['modelo'].split('-');
            models.forEach((model:string) => {
              this.models.push( this.capitalizeFirstLetter(model) );
            });
          }

          this.versions = [];
          if ( params['version'] != undefined && params['version'] != 'sin-versiones') {
            let versions = params['version'].split('-');
            versions.forEach((version:string) => {
              this.versions.push( this.capitalizeFirstLetter(version) );
            });
          }

          this.bodies = [];
          if ( params['carroceria'] != undefined && params['carroceria'] != 'sin-carrocerias') {
            let bodies = params['carroceria'].split('-');
            bodies.forEach((body:string) => {
              this.bodies.push( this.capitalizeFirstLetter(body) );
            });
          }

          this.years = [];
          if( params['anio'] != undefined && params['anio'] != 'sin-anios'){
            let years = params['anio'].split('-');
            years.forEach((year:string) => {
              this.years.push( this.capitalizeFirstLetter(year) );
            });
          }

          if( params['minprecio'] != undefined ){
            this.hitchMin = (+params['minprecio']);                  
          }
          
          if( params['maxprecio'] != undefined ){
            this.hitchMax = (+params['maxprecio']);                  
          }

          this.states = [];
          if( params['estado'] != undefined && params['estado'] != 'sin-estados'){
            this.states.push( params['estado'].split('-') );
          }
          
          if( params['busqueda'] != undefined && params['busqueda'] != 'sin-busqueda' ){
            this.palabra_busqueda = params['busqueda'];
          }

          this.transmissions = [];
          if( params['transmision'] != undefined && params['transmision'] != 'sin-transmisiones'){
            let transmissions = params['transmision'].split('-');
            transmissions.forEach((transmission:string) => {
              this.transmissions.push( this.capitalizeFirstLetter(transmission) );
            });
          }

          this.extColors = [];
          if( params['exterior_color'] != undefined && params['exterior_color'] != 'sin-colores'){
            let extColors = params['exterior_color'].split('-');
            extColors.forEach((extColor:string) => {
              this.extColors.push( this.capitalizeFirstLetter(extColor) );
            });
          }

          this.intColors = [];
          if( params['interior_color'] != undefined && params['interior_color'] != 'sin-colores'){
            let intColors = params['interior_color'].split('-');
            intColors.forEach((intColor:string) => {
              this.intColors.push( this.capitalizeFirstLetter(intColor) );
            });
          }

          if( params['pagina'] != undefined ){
            this.pageIndex = +params['pagina'];  
          }
        }
      });
      
        this.executeSearch( this.pageIndex );
  }

  capitalizeFirstLetter(string:string):string {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  eliminarDuplicados( array: string []): string[]{
    return array.filter( (ele:string,pos:number)=>array.indexOf(ele) == pos);        
  }

  scrollTop() {
    var scrollElem = document.querySelector('#moveTop');
    scrollElem!.scrollIntoView();  
  }

  titleCase(str: string) {
    return str.toLowerCase().split(' ').map(function(word) {
      return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ');
  }

  /**
   * Change status accordion
   */
  public openAccordion(accordion: boolean) {
    this.status = !accordion;    
  }

  /**
   * Add Models
   */
  public add( event: MatChipInputEvent, input: string ): void {
    const value = (event.value || '').trim();

    // Add element
    if (value) {
      switch (input) {
        case 'brands':
          this.brands.push(value);
          this.brandCtrl.setValue(null);
          event.chipInput!.clear();
          break;

        case 'versions':
          this.versions.push(value);
          this.versionCtrl.setValue(null);
          event.chipInput!.clear();
          break;

        case 'bodies':
          this.bodies.push(value);
          this.bodyCtrl.setValue(null);
          event.chipInput!.clear();
          break;

        case 'models':
          this.models.push(value);
          this.modelCtrl.setValue(null);
          event.chipInput!.clear();
          break;

        case 'years':
          this.years.push(value);
          this.yearCtrl.setValue(null);
          event.chipInput!.clear();
          break;
        
        case 'states':
          this.states.push(value);
          this.stateCtrl.setValue(null);
          event.chipInput!.clear();
          break;

        case 'transmissions':
          this.transmissions.push(value);
          this.transmissionCtrl.setValue(null);
          event.chipInput!.clear();
          break;
        case 'extColors':
          this.extColors.push(value);
          this.extColorCtrl.setValue(null);
          event.chipInput!.clear();
          break;
        case 'intColors':
          this.intColors.push(value);
          this.intColorCtrl.setValue(null);
          event.chipInput!.clear();
          break;
      }
    }

    let marcas = this.brands.length > 0 ? this.brands.join('-') : 'sin-marcas';
    let modelos = this.models.length > 0 ? this.models.join('-') : 'sin-modelos';
    let carrocerias = this.bodies.length > 0 ? this.bodies.join('-') : 'sin-carrocerias';
    let versiones = this.versions.length > 0 ? this.versions.join('-') : 'sin-versiones';
    let anios = this.years.length > 0 ? this.years.join('-') : 'sin-anios';
    let busqueda = this.palabra_busqueda.length > 0 ? this.palabra_busqueda : 'sin-busqueda';    
    let estados = this.states.length > 0 ? this.states.join('-') : 'sin-estados';
    let transmisiones = this.transmissions.length > 0 ? this.transmissions.join('-') : 'sin-transmisiones';
    let extColors = this.extColors.length > 0 ? this.extColors.join('-') : 'sin-colores';    
    let intColors = this.intColors.length > 0 ? this.intColors.join('-') : 'sin-colores';
    
    this._router.navigate(['compra-tu-auto', marcas, modelos, carrocerias, versiones, anios, this.hitchMin, this.hitchMax, estados, busqueda, transmisiones, extColors, intColors, 1 ]);
  }
  
  /**
   * Remove element
   */
  public remove( model: string, input: string ): void {
    let index;

    switch (input) {
      case 'brands':
        index = this.brands.indexOf(model);

        if (index >= 0) {
          this.brands.splice(index, 1);
        }
        break;
      
      case 'versions':
        index = this.versions.indexOf(model);

        if (index >= 0) {
          this.versions.splice(index, 1);
        }
        break;

      case 'bodies':
        index = this.bodies.indexOf(model);

        if (index >= 0) {
          this.bodies.splice(index, 1);
        }
        break;

      case 'models':
        index = this.models.indexOf(model);

        if (index >= 0) {
          this.models.splice(index, 1);
        }
        break;

      case 'years':
        index = this.years.indexOf(model);

        if (index >= 0) {
          this.years.splice(index, 1);
        }        
        break;

      case 'states':
        index = this.states.indexOf(model);

        if (index >= 0) {
          this.states.splice(index, 1);
        }        
        break;
      
      case 'transmissions':
        index = this.transmissions.indexOf(model);

        if (index >= 0) {
          this.transmissions.splice(index, 1);
        }        
        break;

      case 'extColors':
        index = this.extColors.indexOf(model);

        if (index >= 0) {
          this.extColors.splice(index, 1);
        }        
        break;
      case 'intColors':
        index = this.intColors.indexOf(model);

        if (index >= 0) {
          this.intColors.splice(index, 1);
        }        
        break;
    }

    let marcas = this.brands.length > 0 ? this.brands.join('-') : 'sin-marcas';
    let modelos = this.models.length > 0 ? this.models.join('-') : 'sin-modelos';
    let carrocerias = this.bodies.length > 0 ? this.bodies.join('-') : 'sin-carrocerias';
    let versiones = this.versions.length > 0 ? this.versions.join('-') : 'sin-versiones';
    let anios = this.years.length > 0 ? this.years.join('-') : 'sin-anios';
    let busqueda = this.palabra_busqueda.length > 0 ? this.palabra_busqueda : 'sin-busqueda';    
    let estados = this.states.length > 0 ? this.states.join('-') : 'sin-estados';
    let transmisiones = this.transmissions.length > 0 ? this.transmissions.join('-') : 'sin-transmisiones';
    let extColors = this.extColors.length > 0 ? this.extColors.join('-') : 'sin-colores';    
    let intColors = this.intColors.length > 0 ? this.intColors.join('-') : 'sin-colores';

    this._router.navigate(['compra-tu-auto', marcas, modelos, carrocerias, versiones, anios, this.hitchMin, this.hitchMax, estados, busqueda, transmisiones, extColors, intColors, 1 ]);
  }

  /**
   * Select element    
   */
  public selected( event: MatAutocompleteSelectedEvent, input: string ): void {    
    this.palabra_busqueda = ''; 
    switch (input) {
      case 'brands':        
        if(!this.existsInArray( this.brands, event.option.viewValue)){
          this.brands.push(event.option.viewValue);
        }          
        this.brandInput.nativeElement.value = '';
        this.brandCtrl.setValue(null);
        break;

      case 'versions':
        if (!this.existsInArray( this.versions, event.option.viewValue)) {
          this.versions.push(event.option.viewValue);
        }
        this.versionInput.nativeElement.value = '';
        this.versionCtrl.setValue(null);
        break;

      case 'bodies':
        if (!this.existsInArray( this.bodies, event.option.viewValue)) {
          this.bodies.push(event.option.viewValue);
        }
        this.bodyInput.nativeElement.value = '';
        this.bodyCtrl.setValue(null);
        break;

      case 'models':
        if(!this.existsInArray( this.models, event.option.viewValue)){
          this.models.push(event.option.viewValue);
        }         
        this.modelInput.nativeElement.value = '';
        this.modelCtrl.setValue(null);        
        break;  

      case 'years':
        if(!this.existsInArray( this.years, event.option.viewValue)){
          this.years.push(event.option.viewValue);
        }          
        this.yearInput.nativeElement.value = '';
        this.yearCtrl.setValue(null);
        break;
      
      case 'states':
        if(!this.existsInArray( this.states, event.option.viewValue)){
          this.states.push(event.option.viewValue);
        }          
        this.stateInput.nativeElement.value = '';
        this.stateCtrl.setValue(null);
        break;
      
      case 'transmissions':
        if(!this.existsInArray( this.transmissions, event.option.viewValue)){
          this.transmissions.push(event.option.viewValue);
        }          
        this.transmissionInput.nativeElement.value = '';
        this.transmissionCtrl.setValue(null);
        break;
      case 'types':
        if(!this.existsInArray( this.types, event.option.viewValue)){
          this.types.push(event.option.viewValue);
        }          
        this.typeInput.nativeElement.value = '';
        this.typeCtrl.setValue(null);
        break;
      case 'extColors':
        if(!this.existsInArray( this.extColors, event.option.viewValue)){
          this.extColors.push(event.option.viewValue);
        }          
        this.extColorInput.nativeElement.value = '';
        this.extColorCtrl.setValue(null);
        break;
      case 'intColors':
        if(!this.existsInArray( this.intColors, event.option.viewValue)){
          this.intColors.push(event.option.viewValue);
        }          
        this.intColorInput.nativeElement.value = '';
        this.intColorCtrl.setValue(null);
        break;
    }

    let marcas = this.brands.length > 0 ? this.brands.join('-') : 'sin-marcas';
    let modelos = this.models.length > 0 ? this.models.join('-') : 'sin-modelos';
    let carrocerias = this.bodies.length > 0 ? this.bodies.join('-') : 'sin-carrocerias';
    let versiones = this.versions.length > 0 ? this.versions.join('-') : 'sin-versiones';
    let anios = this.years.length > 0 ? this.years.join('-') : 'sin-anios';
    let busqueda = this.palabra_busqueda.length > 0 ? this.palabra_busqueda : 'sin-busqueda';    
    let estados = this.states.length > 0 ? this.states.join('-') : 'sin-estados';
    let transmisiones = this.transmissions.length > 0 ? this.transmissions.join('-') : 'sin-transmisiones';
    let extColors = this.extColors.length > 0 ? this.extColors.join('-') : 'sin-colores';    
    let intColors = this.intColors.length > 0 ? this.intColors.join('-') : 'sin-colores';
    
    this._router.navigate(['compra-tu-auto', marcas, modelos, carrocerias, versiones, anios, this.hitchMin, this.hitchMax, estados, busqueda, transmisiones, extColors, intColors, 1 ]);
  }

  /**
   * Filter models
   */

  private _filterBrands( value: string ): string[] {
    const filterValue = value.toLowerCase();    
    return this.allBrands.filter(element => element.toLowerCase().includes(filterValue));                    
  }

  private _filterVersions( value: string ): string[] {
    const filterValue = value.toLowerCase();
    return this.allVersions.filter(element => element.toLowerCase().includes(filterValue));
  }

  private _filterBodies( value: string ): string[] {
    const filterValue = value.toLowerCase();
    return this.allBodies.filter(element => element.toLowerCase().includes(filterValue));
  }

  private _filterModels( value: string ): string[] {
    const filterValue = value.toLowerCase();    
    return this.allModels.filter(element => element.toLowerCase().includes(filterValue));                    
  }

  private _filterYears( value: string ): string[] {
    const filterValue = value.toLowerCase();    
    return this.allYears.filter(element => element.toLowerCase().includes(filterValue));                    
  }

  private _filterStates( value: string ): string[] {
    const filterValue = value.toLowerCase();    
    return this.allStates.filter(element => element.toLowerCase().includes(filterValue));                    
  }

  private _filterTransmissions( value: string ): string[] {
    const filterValue = value.toLowerCase();    
    return this.allTransmissions.filter(element => element.toLowerCase().includes(filterValue));                    
  }

  private _filterExtColors( value: string ): string[] {
    const filterValue = value.toLowerCase();    
    return this.allExtColors.filter(element => element.toLowerCase().includes(filterValue));                    
  }

  private _filterIntColors( value: string ): string[] {
    const filterValue = value.toLowerCase();    
    return this.allIntColors.filter(element => element.toLowerCase().includes(filterValue));                    
  }

  private _filterTypes( value: string ): string[] {
    const filterValue = value.toLowerCase();    
    return this.allTypes.filter(element => element.toLowerCase().includes(filterValue));                    
  }

  /**
   * Number display label Hitch
   */
  formatLabelHitch( value: number ): string {   
    
    if (value >= 1) {
      return '$' + Math.round(value / 1000);
    }

    return  '$0';
  }

  public existsInArray( arreglo:any[], elemento:any ): boolean {   
      let exists = false;
      arreglo.find( element => {
        if( element == elemento ){
          exists = true;        
        }
      });   
      return exists;
  }
  

  public precio() {
    
    if (this.timer){
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      let marcas = this.brands.length > 0 ? this.brands.join('-') : 'sin-marcas';
      let modelos = this.models.length > 0 ? this.models.join('-') : 'sin-modelos';
      let carrocerias = this.bodies.length > 0 ? this.bodies.join('-') : 'sin-carrocerias';
      let versiones = this.versions.length > 0 ? this.versions.join('-') : 'sin-versiones';
      let anios = this.years.length > 0 ? this.years.join('-') : 'sin-anios';
      let busqueda = this.palabra_busqueda.length > 0 ? this.palabra_busqueda : 'sin-busqueda';    
      let estados = this.states.length > 0 ? this.states.join('-') : 'sin-estados';
      let transmisiones = this.transmissions.length > 0 ? this.transmissions.join('-') : 'sin-transmisiones';
      let extColors = this.extColors.length > 0 ? this.extColors.join('-') : 'sin-colores';    
      let intColors = this.intColors.length > 0 ? this.intColors.join('-') : 'sin-colores';
      
      this._router.navigate(['compra-tu-auto', marcas, modelos, carrocerias, versiones, anios, (this.hitchMin -500), (this.hitchMax +500), estados, busqueda, transmisiones, extColors, intColors, 1 ]);
      
    }, 300);
  }
  
  public searchByKeyword(){
    let busqueda = this.palabra_busqueda.length > 0 ? this.palabra_busqueda : '';
    
    this._compraTuAutoService.searchByKeyword(busqueda)
      .subscribe({
        next: ( response: SearchResponse ) => {
          this.vehicles = response.data.data;
          this.spinner = false;
        }
      });
  }
  
  public searchKeyboard(){    

    if (this.timer){
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      this.searchByKeyword();
    }, 630);
          
  }

  public executeSearch( page:number ){

    this.allBrands = [];
    this.allModels = [];
    this.allVersions = [];
    this.allBodies = [];
    this.allYears = [];
    this.allTransmissions = [];
    this.allExtColors = [];
    this.allIntColors = [];
    // this.allLines = [];

    this._compraTuAutoService.getVehicles( this.brands, this.models, this.bodies, this.versions, this.years,
                                                [(this.hitchMin - 500 ), (this.hitchMax + 500)], this.palabra_busqueda, page, 
                                                this.states, this.transmissions, 
                                                this.extColors, this.intColors, this.orden
                                              ).subscribe({
                                                next: ( response: SearchResponse ) => {
                                                  this.vehicles = response.data.data;
                                                  this.length = response.data.total;
                                                  this.pageIndex = response.data.current_page;
                                                  this.pageSize = response.data.per_page;
                                                }
                                              });

    this._compraTuAutoService.getFilters( this.brands, this.models, this.bodies, this.versions, this.years,
                                          [(this.hitchMin - 500 ), (this.hitchMax + 500)], this.palabra_busqueda, page, this.states, this.transmissions, this.extColors, this.intColors,
                                          true, this.orden
                                          )
    .subscribe({
      next: ( response: FiltersResponse ) => {
        
        this.spinner = false;

        response.data.brands.map( brand => { 
          if( !this.existsInArray( this.brands, this.titleCase(brand)) ){
            this.allBrands.push( brand );
          }
          this.filteredBrands = this.brandCtrl.valueChanges.pipe(startWith(null),
            map((brand: string | null) => brand ? this._filterBrands(brand) : this.allBrands.slice()));
        });   

        response.data.versions.map( version => {
          if (!this.existsInArray( this.versions, this.titleCase(version))) {
            this.allVersions.push( version );
          }
          this.filteredVersions = this.versionCtrl.valueChanges.pipe(startWith(null),
            map((version: string | null) => version ? this._filterVersions(version) : this.allVersions.slice()));
        });

        response.data.bodies.map( body => {
          if (!this.existsInArray( this.bodies, this.titleCase(body))) {
            this.allBodies.push( body );
          }
          this.filteredBodies = this.bodyCtrl.valueChanges.pipe(startWith(null),
            map((body: string | null) => body ? this._filterBodies(body) : this.allBodies.slice()));
        });

        response.data.models.map( model => {
          if( !this.existsInArray( this.models, this.titleCase(model)) ){
            this.allModels.push( model );
          }
          this.filteredModels = this.modelCtrl.valueChanges.pipe(startWith(null),
            map((model: string | null) => model ? this._filterModels(model) : this.allModels.slice()));
        });

        response.data.years.map( year => {
          if( !this.existsInArray( this.years, `${year}`) ){
            this.allYears.push(`${year}`);
          }
          this.filteredYears = this.yearCtrl.valueChanges.pipe(startWith(null),
            map((year: string | null) => year ? this._filterYears(year) : this.allYears.slice()));
        });

        response.data.transmissions.map( transmission => {
          if( !this.existsInArray( this.transmissions, this.titleCase(transmission)) ){
            this.allTransmissions.push(transmission);
          }
          this.filteredTransmissions = this.transmissionCtrl.valueChanges.pipe(startWith(null),
            map((transmission: string | null) => transmission ? this._filterTransmissions(transmission) : this.allTransmissions.slice()));
        });

        response.data.exterior_colors.map( color => {          
          if( !this.existsInArray( this.extColors, this.titleCase(color)) ){
            this.allExtColors.push(color);            
          }
          this.filteredExtColors = this.extColorCtrl.valueChanges.pipe(startWith(null),
            map((extColor: string | null) => extColor ? this._filterExtColors(extColor) : this.allExtColors.slice()));
        });

        response.data.interior_colors.map( color => {          
          if( !this.existsInArray( this.intColors, this.titleCase(color)) ){
            this.allIntColors.push(color);            
          }
          this.filteredIntColors = this.intColorCtrl.valueChanges.pipe(startWith(null),
            map((intColor: string | null) => intColor ? this._filterIntColors(intColor) : this.allIntColors.slice()));
        });

        response.data.locations.map( location => {          
          if( !this.existsInArray( this.states, this.titleCase(location)) ){
            this.allStates.push(location);            
          }
          this.filteredStates = this.stateCtrl.valueChanges.pipe(startWith(null),
            map((state: string | null) => state ? this._filterStates(state) : this.allStates.slice()));
        });
      }
    });
  }

  public paginationChange( pageEvent:PageEvent ){
    this.pageEvent = pageEvent;
    this.pageSize = this.pageEvent.pageSize;
    this.pageIndex = this.pageEvent.pageIndex + 1;
    this.scrollTop(); 
    this.executeSearch(this.pageIndex);
  }

  public cambiarOrden( orden: string ){
    this.orden = orden;
    this.executeSearch(1);
    this.paginator.firstPage();
  }

  public highEnd( page: number | null = null, highEndChange: number){
    this.hitchMin = highEndChange;
    this.hitchMax = this.max_price;
    this.executeSearch(1);
  }

  public lowEnd(){
    this.hitchMin = this.min_price;
    this.hitchMax = this.max_price;
    this.executeSearch(1);
  }

  public clean(){    
    this.brands = [];
    this.models = [];
    this.years = [];
    this.palabra_busqueda = '';    
    this.states = [];
    this.transmissions = [];
    this.types = [];
  }
}
