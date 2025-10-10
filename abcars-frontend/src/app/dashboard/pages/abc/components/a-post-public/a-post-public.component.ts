import { Component, Input, type OnInit } from '@angular/core';

@Component({
    selector: 'app-a-post-public',
    // standalone: true,
    // imports: [],
    templateUrl: './a-post-public.component.html',
    styleUrls: ['./a-post-public.component.css'],
    standalone: false
})
export class APostPublicComponent implements OnInit {
  @Input() post: any;

  ngOnInit(): void { }

}
