import { Component, OnInit, inject, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GetUsers } from '../../../services/getUsers';
import { FollowService } from '../../../services/followService';
import { SiteConfigService } from '../../../services/siteConfigService';

@Component({
  selector: 'app-search-users',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './searchUsers.html',
  styleUrl: '../../../app.css'
})
export class SearchUsers implements OnInit {

  userRole: number = 0;

  siteName: string = 'MusicLab';

  // --- Propiedades de Datos ---
  public allArtists: any[] = [];      
  public filteredArtists: any[] = []; 
  public loading: boolean = true;
  public followedIds: number[] = []; 
  public loadingFollow: number | null = null; 

  // --- Modelos para Filtros ---
  public searchText: string = '';
  public selectedCategory: string = 'All';

  public categories: string[] = [
    'All', 'Vocalist', 'Guitarist', 'Bassist', 'Drummer', 
    'Pianist', 'Violinist', 'Saxophonist', 'Trumpeter', 'DJ', 'Another'
  ];

  // --- Inyecciones ---
  private usersService = inject(GetUsers);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private followService = inject(FollowService);
  private siteConfigService = inject(SiteConfigService);

  ngOnInit(): void {
    this.cargarArtistas();
    this.cargarSeguidos(); 
    const sesion = JSON.parse(localStorage.getItem('user_session') || '{}');
    
    // 2. Extracción del rol
    // Intenta leer 'sesion.user.role'. Si no existe, usa '0' para evitar NaN.
    const rawRole = sesion.user?.role || sesion.role || 0;

    // 3. Asignación y conversión
    this.userRole = Number(rawRole);

    // Lógica para el nombre del sitio dinámico
    this.siteConfigService.config$.subscribe(config => {
        if (config && config.site_name) {
            this.siteName = config.site_name;
        }
    });
  }

  cargarArtistas(): void {
    this.loading = true;

    // 1. Obtenemos el ID del usuario logueado para saber a quién ocultar
    const sesion = JSON.parse(localStorage.getItem('user_session') || '{}');
    const miId = Number(sesion.user?.id || sesion.id);

    this.usersService.getUsers().subscribe({
      next: (res: any) => {
        // 2. Procesamos la lista:
        //    Primero: Convertimos el ID a número
        //    Segundo: Filtramos para que SOLO pasen los que NO son yo como usuario logeado.
        const usuariosLimpios = res
            .map((u: any) => ({ ...u, id: Number(u.id) })) 
            .filter((u: any) => u.id !== miId); 

        this.allArtists = usuariosLimpios;
        this.filteredArtists = usuariosLimpios;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al cargar artistas:", err);
        this.loading = false;
      }
    });
  }

  cargarSeguidos(): void {
    const sesion = JSON.parse(localStorage.getItem('user_session') || '{}');
    const miId = sesion.user?.id || sesion.id; 

    if (miId) {
      this.followService.getFollowing(miId).subscribe({
        next: (res: any) => {
          if (res && res.following) {
            // Convertimos a números para asegurar que .includes() funcione bien
            this.followedIds = res.following.map((f: any) => Number(f.id));
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error("Error al obtener seguidos:", err);
        }
      });
    }
  }

  aplicarFiltros(): void {
    const text = this.searchText.toLowerCase().trim();
    this.filteredArtists = this.allArtists.filter(artist => {
      const nombreCompleto = `${artist.first_name} ${artist.last_name}`.toLowerCase();
      const cumpleNombre = nombreCompleto.includes(text);
      const cumpleCategoria = this.selectedCategory === 'All' || 
                              (artist.artist_type && artist.artist_type.includes(this.selectedCategory));
      return cumpleNombre && cumpleCategoria;
    });
    this.cdr.detectChanges();
  }

  isFollowing(id: number): boolean {
    return this.followedIds.includes(id);
  }

  toggleFollow(artistId: number): void {
    // artistId ya viene como número gracias al map de arriba
    this.loadingFollow = artistId; 
    
    if (this.isFollowing(artistId)) {
      this.followService.unfollow(artistId).subscribe({
        next: () => {
          this.followedIds = this.followedIds.filter(id => id !== artistId);
          this.loadingFollow = null;
          this.cdr.detectChanges();
        },
        error: () => this.loadingFollow = null
      });
    } else {
      this.followService.follow(artistId).subscribe({
        next: () => {
          this.followedIds.push(artistId);
          this.loadingFollow = null;
          this.cdr.detectChanges();
        },
        error: () => this.loadingFollow = null
      });
    }
  }

  logout(): void {
    localStorage.clear(); 
    this.router.navigate(['/login']);
  }
}