import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DeleteUsers {
  private http = inject(HttpClient);
  private url = 'http://localhost/phpMusicLab/api/index.php?accion=users';

  deleteUser(id: number | string): Observable<any> {
    const sesion = JSON.parse(localStorage.getItem('user_session') || '{}');
    const token = sesion.token;

    const headers = {
      'Authorization': `Bearer ${token}`
    };

    return this.http.delete(`${this.url}/${id}`, { headers });
  }
}