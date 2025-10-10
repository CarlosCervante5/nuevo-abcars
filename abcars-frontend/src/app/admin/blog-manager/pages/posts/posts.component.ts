import { Component } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Router } from '@angular/router';
import {reload} from '@helpers/session.helper';

// Interfaces
import { MatSnackBar } from '@angular/material/snack-bar';
import { PostService } from '@services/post.service';

import { Vehicle} from '@interfaces/vehicle_data.interface';
import { GetPosts, Post } from '@interfaces/getPosts.interfaces';
import { StorePostComponent } from '../../components/store-post/store-post.component';



@Component({
    selector: 'app-posts',
    templateUrl: './posts.component.html',
    styleUrls: ['./posts.component.css'],
    standalone: false
})
export class PostsComponent {
  // MatPaginator Inputs
  public paginator_length: number = 0;
  public pageSize: number = 12;
  public pageSizeOptions: number[] = [15, 30, 45, 60, 150];
  private debounce_timer: any;


  // MatPaginator Output
  pageEvent!: PageEvent;

  // Vehiculos
  public vehicles: Vehicle[] = [];
  // Posts
  public posts: Post[] = [];

  public palabra_busqueda:string = '';

  public relationship_names: string[] = ['brand','line','model','version','body','dealership','specification','firstImage','images'];

  files:File[] = [];
  disabled:Boolean = true;
  loading:Boolean = false;
  load_vehicle_message = 'Cargar vehículos con csv';
  errorMessage: string = '';

  public pageIndex: number = 1;

  public vehicle_uuids: string[] = [];

  constructor(
    private _postsService: PostService,
    private _bottomSheet: MatBottomSheet,
    private _snackBar: MatSnackBar,
    private _router: Router
  ) {
    this.getPosts(1);
  }    

    /**
     * Get Posts
     */
    public getPosts(page: number) {    

      this._postsService.getPosts( page , this.palabra_busqueda, this.pageSize)
      .subscribe({
          next: (response: GetPosts) => {

            this.posts = response.data.data;
            this.paginator_length = response.data.total;

          },
          error: (error:any) => {
            reload(error, this._router);
          }
      });
    }

    public searchKeyboard(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.palabra_busqueda = filterValue;      

        this.debounce(() => {
            this.getPosts(1);              
        });
    }

    private debounce(callback: () => void, delay: number = 600): void {
        clearTimeout(this.debounce_timer);
        this.debounce_timer = setTimeout(callback, delay);
    }

    /**
     *  Change pagination
     */
    public paginationChange(pageEvent: PageEvent) { 
      this.pageEvent = pageEvent;
      this.pageSize = this.pageEvent.pageSize;   
      this.pageIndex = this.pageEvent.pageIndex + 1;
      this.getPosts( this.pageIndex );  
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
        this.getPosts(this.pageIndex);
      }
    }

    openStorePostSheet(): void {
      const bottomSheetRef = this._bottomSheet.open(StorePostComponent);

      bottomSheetRef.afterDismissed().subscribe((dataFromChild) => {      
        if(dataFromChild != undefined && dataFromChild.reload === true ){        
          this.getPosts( this.pageIndex );
        }      
      });
    }
    
}


