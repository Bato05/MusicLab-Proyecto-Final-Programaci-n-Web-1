import { Component, OnInit, inject, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FollowService } from '../../../services/followService';

@Component({
  selector: 'app-following-list',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, RouterLink],
  templateUrl: './followingList.html',
  styleUrl: '../../../app.css'
})
export class FollowingList implements OnInit {
  public followingList: any[] = [];
  public loading: boolean = true;
  public loadingAction: number | null = null; // Para el spinner del botón

  private followService = inject(FollowService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  ngOnInit(): void {
    this.cargarSeguidos();
  }

  cargarSeguidos() {
    this.loading = true;
    const sesion = JSON.parse(localStorage.getItem('user_session') || '{}');
    const myId = sesion.user?.id;

    if (myId) {
      // Usamos el endpoint que ya arreglamos: getFollowing
      this.followService.getFollowing(myId).subscribe({
        next: (res: any) => {
          // La API devuelve { following: [...] } con la lista completa de usuarios
          if (res && res.following) {
            this.followingList = res.following.map((u: any) => ({
              ...u,
              id: Number(u.id) // Convertimos ID a número por seguridad
            }));
          }
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
        }
      });
    }
  }

  // Función para dejar de seguir desde esta misma lista
  unfollow(artistId: number) {
    if(!confirm('¿Dejar de seguir a este usuario?')) return;

    this.loadingAction = artistId;
    this.followService.unfollow(artistId).subscribe({
      next: () => {
        // Quitamos al usuario de la lista visualmente
        this.followingList = this.followingList.filter(u => u.id !== artistId);
        this.loadingAction = null;
        this.cdr.detectChanges();
      },
      error: () => {
        alert("Error al dejar de seguir");
        this.loadingAction = null;
      }
    });
  }
}