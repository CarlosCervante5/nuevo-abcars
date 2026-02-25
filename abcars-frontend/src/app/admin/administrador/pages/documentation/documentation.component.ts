import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { Overview } from '@interfaces/admin.interfaces';

@Component({
  selector: 'app-documentation',
  templateUrl: './documentation.component.html',
  styleUrls: ['./documentation.component.css'],
  standalone: false
})
export class DocumentationComponent implements OnInit {
  docs: Record<string, unknown> | null = null;
  loading = true;
  error: string | null = null;
  baseUrl = environment.baseUrl;
  private user = JSON.parse(localStorage.getItem('user')!);
  public itemOverview: Overview = {
    user: {
      name: this.user.name,
      surname: this.user.surname,
      role: localStorage.getItem('role') === 'super_admin' ? 'Super Admin' : 'Admin',
      email: this.user.email,
      picturepath: ''
    },
    pages: []
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<Record<string, unknown>>(`${this.baseUrl}/api-docs`).subscribe({
      next: (data) => {
        this.docs = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudo cargar la documentación';
        this.loading = false;
      }
    });
  }

  getEndpoints(obj: unknown): [string, string[]][] {
    if (!obj || typeof obj !== 'object') return [];
    return Object.entries(obj as Record<string, string[]>);
  }
}
