import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GetUsers {
  private http = inject(HttpClient);
  private url = 'http://localhost/phpMusicLab/api/index.php?accion=users';

  constructor() { }

  // Obtener todos
  getUsers(): Observable<any> {
    return this.http.get(this.url);
  }

  // Obtener uno solo por ID (Este es el que usa el Profile)
  getUserById(id: number | string): Observable<any> {
    return this.http.get(`${this.url}/${id}`);
  }
}