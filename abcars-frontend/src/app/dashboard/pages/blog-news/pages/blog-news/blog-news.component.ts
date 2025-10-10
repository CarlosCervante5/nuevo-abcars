import { Component, type OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { reload } from '@helpers/session.helper';

import { PostService } from '@services/post.service';

import { GetPosts, Post } from '@interfaces/getPosts.interfaces';
import { PageEvent } from '@angular/material/paginator';


@Component({
    selector: 'app-blog-news',
    // standalone: true,
    // imports: [],
    templateUrl: './blog-news.component.html',
    styleUrls: ['./blog-news.component.css'],
    standalone: false
})
export class BlogNewsComponent implements OnInit {

  public paginator_length: number = 0;
  public pageSize: number = 12;
  public pageSizeOptions: number[] = [15, 30, 45, 60, 150];
  public pageIndex: number = 1;

  public pageEvent!: PageEvent;

  public posts: Post[] = [];

  public palabra_busqueda: string = '';

  constructor(
    private _postService: PostService,
    private _router: Router
  ) {
    this.getPosts(1);
  }

  ngOnInit(): void { }

  public getPosts(page: number) {
    this._postService.getPublicPosts( page, this.palabra_busqueda, this.pageSize )
      .subscribe({
        next: (response: GetPosts) => {
          console.log(response.data.data);
          
          this.posts = response.data.data;
          this.paginator_length = response.data.total;
        },
        error: (error:any) => {
          reload(error, this._router);
        }
      });
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

  procesaPropagar( action:any ){
    console.log(action);
    
    if( action === true ){
      this.getPosts(this.pageIndex);
    }
  }

}
