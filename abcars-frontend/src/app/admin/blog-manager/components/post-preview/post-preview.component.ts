import { Component, Inject, type OnInit } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';

import { PostService } from '@services/post.service';

import { GetPostDetail } from '@interfaces/getPostDetail.interfaces';

@Component({
  selector: 'app-post-preview',
  // imports: [],
  templateUrl: './post-preview.component.html',
  styleUrl: './post-preview.component.css',
  standalone: false
})
export class PostPreviewComponent implements OnInit {

  public postDate!: Date;
  public title: string = '';
  public contents: any[] = [];

  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: any,
    private _postService: PostService
  ) {}

  ngOnInit(): void { 
    this.getPostDetailPreview(this.data.url_name);
  }

  public getPostDetailPreview(url_name: string) {
    this._postService.getPostDetailPreview(url_name)
    .subscribe({
      next: ( postDetail: GetPostDetail ) => {
        console.log(postDetail.data.contents);
        
        this.postDate = postDetail.data.created_at;
        this.title = postDetail.data.title;
        this.contents = postDetail.data.contents;
      }
    });
  }

}
