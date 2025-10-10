import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { BlogNewsRoutingModule } from './blog-news-routing.module';
import { BlogDetailComponent } from './pages/blog-detail/blog-detail.component';
import { QuillModule } from 'ngx-quill';
import { PublicPostComponent } from './components/public-post/public-post.component';


@NgModule({
  declarations: [
    BlogDetailComponent,
    PublicPostComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], 
  imports: [
    CommonModule,
    BlogNewsRoutingModule,
    QuillModule
  ]
})
export class BlogNewsModule { }
