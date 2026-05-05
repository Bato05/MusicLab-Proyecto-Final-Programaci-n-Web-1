import { Injectable, inject } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private http = inject(HttpClient);

  // acción 'login' para que el método POST llame a postLogin()
  private apiUrl = 'http://localhost/phpMusicLab/api/index.php?accion=login';

  postLogin(userData: any): Observable<any> {
    return this.http.post(this.apiUrl, userData);
  }
}
