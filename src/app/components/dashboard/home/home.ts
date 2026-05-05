import { Component, OnInit, inject, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { GetPosts } from '../../../services/getPosts';
import { Router, RouterLink } from '@angular/router'; 
import { SiteConfigService } from '../../../services/siteConfigService';

@Component({
  selector: 'app-home',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, 
            RouterLink], 
  templateUrl: './home.html',
  styleUrl: '../../../app.css',
})
export class Home implements OnInit {

  userRole: number = 0;

  siteName: string = 'MusicLab';

  public posts: any[] = []; 
  private getPostsService = inject(GetPosts);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private siteConfigService = inject(SiteConfigService);

  ngOnInit(): void {
    const sesion = JSON.parse(localStorage.getItem('user_session') || '{}');
    
    // 2. Extracción del rol
    // Intenta leer 'sesion.user.role'. Si no existe, usa '0' para evitar NaN.
    const rawRole = sesion.user?.role || sesion.role || 0;

    // 3. Asignación y conversión
    this.userRole = Number(rawRole);

    this.getPostsService.getPosts().subscribe({
      next: (res) => {
        // FILTRO: Solo guardamos las publicaciones cuya visibilidad sea 'public'
        this.posts = res.filter((p: any) => p.visibility === 'public');
        this.cdr.detectChanges(); // Fuerza la actualización de la vista
      },
      error: (err) => console.error("Error en la carga:", err)
    });

    // Lógica para el nombre del sitio dinámico
    this.siteConfigService.config$.subscribe(config => {
        if (config && config.site_name) {
            this.siteName = config.site_name;
        }
    });
  }

  logout(): void {
    localStorage.clear(); 
    this.router.navigate(['/login']);
  }

  ejecutarDescarga(post: any): void {
    // URL directa al archivo físico en XAMPP
    const urlBase = 'http://localhost/phpMusicLab/uploads/';
    const urlCompleta = urlBase + post.file_url;

    console.log(`Abriendo recurso: ${post.title} -> ${urlCompleta}`);

    // Usamos window.open para "navegar" al archivo. 
    // Esto hace que el navegador decida si reproducirlo o bajarlo, evitando bloqueos CORS.
    window.open(urlCompleta, '_blank');
  }
}