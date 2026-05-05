import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class RegisterService {
  private http = inject(HttpClient); // Inyección de dependencia

// pasarle la acción 'users' para que el método POST llame a postUsers()
private apiUrl = 'http://localhost/phpMusicLab/api/index.php?accion=users';

  postUser(userData: any): Observable<any> {
    return this.http.post(this.apiUrl, userData);
  }
}
