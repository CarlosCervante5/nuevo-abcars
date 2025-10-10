import { CommonModule } from '@angular/common';
import { Component, type OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GetPostDetail } from '@interfaces/getPostDetail.interfaces';
import { GetRandomPosts, Post } from '@interfaces/getPosts.interfaces';

import { PostService } from '@services/post.service';

@Component({
  selector: 'app-blog-detail',
  // imports: [],
  templateUrl: './blog-detail.component.html',
  styleUrl: './blog-detail.component.css',
  standalone: false
})
export class BlogDetailComponent implements OnInit {

  public postDate!: Date;
  public title!: string;
  public contents: any[] = [];
  public random_posts: Post[] = []

  constructor(
    private _activatedRoute: ActivatedRoute,
    private _postService: PostService
  ) { }
  
  ngOnInit(): void { 

    this.getPostDetail(this._activatedRoute.snapshot.params.uuid);
    this.getRandomPosts()
  }

    public getPostDetail(url_name: string) {
        this._postService.getPostDetail(url_name)
        .subscribe({
            next: ( postDetail: GetPostDetail ) => {
                this.postDate = postDetail.data.created_at;
                this.title = postDetail.data.title
                this.contents = postDetail.data.contents;
            }
        });
    }

    public getRandomPosts() {
        this._postService.getRandomPosts()
        .subscribe({
            next: ( posts: Post[] ) => {
                this.random_posts = posts;
            }
        });
    }

}
