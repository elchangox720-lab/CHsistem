import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface HealthResponse {
  status: string;
  uptime: number;
  database: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getHealth(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(`${this.baseUrl}/health`);
  }
}
