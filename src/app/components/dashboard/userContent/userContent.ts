import { Component, OnInit, inject, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router'; 
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { GetPosts } from '../../../services/getPosts';
import { DeletePosts } from '../../../services/deletePosts';
import { PatchPost } from '../../../services/patchPosts';
import { FollowService } from '../../../services/followService';
import { SiteConfigService } from '../../../services/siteConfigService';

@Component({
  selector: 'app-user-content',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './userContent.html',
  styleUrl: '../../../app.css',
})
export class UserContent implements OnInit {
  
  userRole: number = 0;

  siteName: string = 'MusicLab';

  public posts: any[] = [];
  public followedUsers: any[] = [];
  public datosListos: boolean = false;
  
  public editandoId: number | null = null;
  public formEdicion: FormGroup;
  
  public fileName: string = ''; 
  public selectedFile: File | null = null;
  public loading: boolean = false;

  private fb = inject(FormBuilder);
  private postsService = inject(GetPosts);
  private patchService = inject(PatchPost);
  private deleteService = inject(DeletePosts);
  private followService = inject(FollowService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private siteConfigService = inject(SiteConfigService);

  constructor() {
    this.formEdicion = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      file_type: ['audio', Validators.required],
      visibility: ['public', Validators.required],
      destination_id: [null],
      description: ['', [Validators.maxLength(200)]]
    });
  }

  ngOnInit(): void {
    this.cargarMisPublicaciones();
    this.cargarMisSeguidos();
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

  acceptedExtensions(): string {   
    const type = this.formEdicion.get('file_type')?.value;
    switch (type) {
      case 'audio': return '.mp3';
      case 'score': return '.pdf';
      case 'lyrics': return '.txt';
      default: return '*';
    }
  }

  cargarMisPublicaciones() {
    this.datosListos = false;
    const sesion = JSON.parse(localStorage.getItem('user_session') || '{}');
    const userId = sesion.user?.id || sesion.id;

    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }

    this.postsService.getUserPosts(userId).subscribe({
      next: (res: any) => {
        this.posts = Array.isArray(res) ? res : [];
        this.datosListos = true;
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al cargar posts", err)
    });
  }

  cargarMisSeguidos() {
    const sesion = JSON.parse(localStorage.getItem('user_session') || '{}');
    const miId = sesion.user?.id || sesion.id;
    if (miId) {
      this.followService.getFollowing(miId).subscribe({
        next: (res: any) => this.followedUsers = res.following || []
      });
    }
  }

  abrirEdicion(post: any) {
    this.editandoId = post.id;
    this.selectedFile = null;
    this.fileName = ''; 
    
    // Aseguramos tipos correctos al cargar
    this.formEdicion.patchValue({
      title: post.title,
      description: post.description,
      file_type: post.file_type,
      visibility: post.visibility || 'public',
      destination_id: post.destination_id
    });
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelarEdicion() {
    this.editandoId = null;
    this.selectedFile = null;
    this.fileName = '';
    this.formEdicion.reset({ visibility: 'public', file_type: 'audio' });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.fileName = file.name;
    }
  }

  guardarCambios() {
    // 1. Validaciones previas
    if (this.formEdicion.invalid) {
      if (this.formEdicion.get('title')?.invalid) {
        alert("El título es obligatorio y debe tener al menos 5 caracteres.");
      } else if (this.formEdicion.get('description')?.invalid) {
        alert("La descripción es demasiado larga (máx 200).");
      } else {
        alert("Por favor revisa que todos los campos obligatorios estén completos.");
      }
      return;
    }

    if (!this.editandoId) return;
    
    this.loading = true; 

    const formVal = this.formEdicion.value;

    let idDestinoLimpio = formVal.destination_id;
    if (formVal.visibility !== 'followers' || !idDestinoLimpio || idDestinoLimpio === 0) {
        idDestinoLimpio = null;
    }

    const payload: any = { 
      title: formVal.title,
      description: formVal.description,
      file_type: formVal.file_type,
      visibility: formVal.visibility,
      destination_id: idDestinoLimpio // <--- Usamos el valor limpio
    };

    // 3. Procesamiento de archivo (si existe)
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.readAsDataURL(this.selectedFile);
      
      reader.onload = () => {
        payload.file_name = this.selectedFile?.name;
        payload.file_data = (reader.result as string).split(',')[1]; 
        this.ejecutarPeticionPatch(payload);
      };
      
      reader.onerror = (error) => {
        console.error("Error al leer archivo", error);
        alert("Error al procesar el archivo local.");
        this.loading = false;
      };
    } else {
      this.ejecutarPeticionPatch(payload);
    }
  }

  private ejecutarPeticionPatch(payload: any) {
    this.patchService.patchPosts(this.editandoId!, payload).subscribe({
      next: (res: any) => {
        this.loading = false;

        if (res.status === 'success') {
          alert("¡Publicación actualizada correctamente!");
          this.editandoId = null; 
          this.cargarMisPublicaciones(); 
        } else {
          alert("Atención: " + (res.message || "No se pudo actualizar."));
        }
      },
      error: (err) => {
        this.loading = false;
        console.error("Error crítico", err);
        alert("Error de conexión con el servidor.");
      }
    });
  }

  borrarPublicacion(id: number, titulo: string) {
    if (confirm(`¿Estás seguro de eliminar "${titulo}"?`)) {
      this.deleteService.deletePost(id).subscribe(() => this.cargarMisPublicaciones());
    }
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}