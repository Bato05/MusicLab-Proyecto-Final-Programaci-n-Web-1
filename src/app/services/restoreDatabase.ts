import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class RestoreDatabase {
  private http = inject(HttpClient);

  private apiUrl = 'http://localhost/phpMusicLab/api/restore';

  restoreDB() {
    const payload = {
        email: 'bautista.owner@gmail.com',
        password: '123456'
    };
    
    return this.http.post(this.apiUrl, payload);
  }
}