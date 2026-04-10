import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
@Component({
  selector: 'app-api-info',
  templateUrl: './api-info.component.html',
  styleUrls: ['./api-info.component.css'],
  standalone: false
})
export class ApiInfoComponent implements OnInit {
  apiInfo: Record<string, unknown> | null = null;
  loading = true;
  error: string | null = null;
  baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<Record<string, unknown>>(`${this.baseUrl}/api`).subscribe({
      next: (data) => {
        this.apiInfo = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudo conectar con la API';
        this.loading = false;
      }
    });
  }
}
