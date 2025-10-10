import { Component, Inject, type OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-video-modal',
  // imports: [],
  templateUrl: './video-modal.component.html',
  styleUrl: './video-modal.component.css',
  standalone: false
})
export class VideoModalComponent implements OnInit {

  constructor(@Inject(MAT_DIALOG_DATA) public data: { videoUrl: string }) {}

  ngOnInit(): void { }

}
