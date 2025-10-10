import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { BlogNewsComponent } from './pages/blog-news/blog-news.component';
import { BlogDetailComponent } from './pages/blog-detail/blog-detail.component';

const routes: Routes = [
  { path: '', component: BlogNewsComponent},
  { path: 'detail/:uuid', component: BlogDetailComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BlogNewsRoutingModule { }
