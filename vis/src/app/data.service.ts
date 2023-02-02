import { environment } from '../environments/environment.prod';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  data: any;
  constructor(private http: HttpClient) {}
  getDistribution(arr: any[]): Observable<any> {
    return this.http.post<any>(environment.filesurl + 'distribution', {
      dataToCompute: arr,
    });
  }
}
