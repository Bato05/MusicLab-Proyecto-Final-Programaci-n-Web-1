import { Component, OnInit, ViewEncapsulation, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms'; 

// Servicios de Usuarios
import { GetUsers } from '../../../services/getUsers';
import { PatchUsers } from '../../../services/patchUsers';
import { DeleteUsers } from '../../../services/deleteUsers';

// Servicios de Posts
import { GetPosts } from '../../../services/getPosts';
import { DeletePosts } from '../../../services/deletePosts';
import { PatchPost } from '../../../services/patchPosts';

// Servicios de Sistema
import { RestoreDatabase } from '../../../services/restoreDatabase';
import { SiteConfigService } from '../../../services/siteConfigService';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  templateUrl: './adminPanel.html',
  styleUrls: ['../../../app.css']
})
export class AdminPanel implements OnInit {

  siteName: string = 'MusicLab';

  userRole: number = 0;
  myId: number = 0;
  usersList: any[] = [];
  loading: boolean = false;

  // Variables para Modales
  modalEdicionAbierto: boolean = false;
  modalPostsAbierto: boolean = false;
  modalEditarPostAbierto: boolean = false;
  modalConfigAbierto: boolean = false; // <--- Nuevo Modal Config
  
  // Datos temporales
  usuarioSeleccionado: any = {};
  nuevaPassword: string = '';
  newImgBase64: string = '';
  newImgName: string = '';
  previewUrl: string | null = null;
  
  listaPostsUsuario: any[] = [];
  cargandoPosts: boolean = false;

  // Formularios
  formEditarPost: FormGroup;
  formSiteConfig: FormGroup; // <--- Nuevo Formulario Config

  idPostAEditar: number | null = null;
  postFileBase64: string = '';
  postFileName: string = '';

  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);
  
  // Inyecciones
  private getUsersService = inject(GetUsers);
  private patchUsersService = inject(PatchUsers);
  private deleteUsersService = inject(DeleteUsers);
  private getPostsService = inject(GetPosts);
  private deletePostsService = inject(DeletePosts);
  private patchPostService = inject(PatchPost);
  private restoreService = inject(RestoreDatabase);
  private siteConfigService = inject(SiteConfigService);

  constructor() {
    // Formulario para editar Posts
    this.formEditarPost = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', Validators.maxLength(200)],
      file_type: ['audio', Validators.required],
      visibility: ['public', Validators.required],
      destination_id: [null]
    });

    // Formulario para Configuración del Sitio (Solo Owner)
    this.formSiteConfig = this.fb.group({
        site_name: ['', Validators.required],
        welcome_text: ['', Validators.required],
        maintenance_mode: [false] // Se maneja como boolean en el form
    });
  }

  ngOnInit(): void {
    const sesion = JSON.parse(localStorage.getItem('user_session') || '{}');
    const rawRole = sesion.user?.role || sesion.role || 0;
    this.userRole = Number(rawRole);
    this.myId = Number(sesion.user?.id || sesion.id || 0);

    this.cargarUsuarios();

    // Si es Owner, precargamos la configuración del sitio
    if (this.userRole === 2) {
        this.siteConfigService.getSiteconfig().subscribe();
    }

    // Lógica para el nombre del sitio dinámico
    this.siteConfigService.config$.subscribe(config => {
        if (config && config.site_name) {
            this.siteName = config.site_name;
        }
    });
  }

  // CARGA DE USUARIOS
  cargarUsuarios() {
    this.loading = true;
    this.getUsersService.getUsers().subscribe({
      next: (res: any) => {
        if (this.userRole === 1) {
            // Admin ve solo usuarios comunes
            this.usersList = res.filter((u: any) => Number(u.role) === 0);
        } else if (this.userRole === 2) {
            // Owner ve usuarios y admins (menos a sí mismo)
            this.usersList = res.filter((u: any) => Number(u.role) < 2 && Number(u.id) !== this.myId);
        } else {
            this.usersList = [];
        }
        this.loading = false;
        this.cdr.detectChanges(); 
      },
      error: (err: any) => {
        console.error("Error cargando usuarios:", err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  handleImageError(event: any) {
    event.target.src = 'http://localhost/phpMusicLab/assets/default_profile.png';
  }

  // LÓGICA: CAMBIO DE ROL (SOLO OWNER)
  toggleAdminRole(user: any) {
    if (this.userRole !== 2) return;

    const esAdmin = Number(user.role) === 1;
    const nuevoRol = esAdmin ? 0 : 1;
    const accion = esAdmin ? "DEGRADAR" : "ASCENDER";
    const titulo = esAdmin ? "Usuario Común" : "ADMINISTRADOR";
    
    if (confirm(`¿Estás seguro de que deseas ${accion} a ${user.first_name}?\n\nNuevo Rol: ${titulo}`)) {
        this.patchUsersService.patchUsers(user.id, { role: nuevoRol }).subscribe({
            next: () => {
                alert(`¡Permisos actualizados para ${user.first_name}!`);
                this.cargarUsuarios(); 
            },
            error: () => alert("Error al cambiar permisos.")
        });
    }
  }

  // LÓGICA: RESTAURAR BD (SOLO OWNER)
  restaurarSistema() {
    if (this.userRole !== 2) return; 
    if (!confirm("⚠️ ¿Estás seguro de que quieres RESTAURAR la base de datos?\n\nSe borrarán todos los cambios recientes.")) return;
    if (!confirm("Confirmación final:\n\nEsta acción es irreversible.\nPulsa Aceptar para reiniciar el sistema.")) return;

    this.loading = true;
    this.cdr.detectChanges();

    this.restoreService.restoreDB().subscribe({
        next: (res: any) => {
            alert("✅ Sistema restaurado con éxito.\nSe cerrará la sesión.");
            this.logout(); 
        },
        error: (err: any) => {
            console.error(err);
            alert("❌ Error al restaurar la base de datos.");
            this.loading = false;
            this.cdr.detectChanges();
        }
    });
  }


  // LÓGICA: CONFIGURACIÓN DEL SITIO
  abrirModalConfig() {
    // Nos suscribimos al estado actual del servicio para llenar el formulario
    // Usamos 'take(1)' o una suscripción directa simple porque config$ es un BehaviorSubject
    const currentConfig = (this.siteConfigService as any).configSubject.value; // Acceso directo al valor actual
    
    this.formSiteConfig.patchValue({
        site_name: currentConfig.site_name,
        welcome_text: currentConfig.welcome_text,
        // Convertimos el 1/0 de la BD a true/false para el checkbox
        maintenance_mode: Number(currentConfig.maintenance_mode) === 1
    });
    
    this.modalConfigAbierto = true;
  }

  guardarConfiguracion() {
    if (this.formSiteConfig.invalid) {
        alert("Por favor, completa los campos obligatorios.");
        return;
    }

    if (!confirm("¿Aplicar cambios a la configuración global?")) return;

    const formValue = this.formSiteConfig.value;
    
    // Preparar payload: Convertir true/false a 1/0
    const payload = {
        site_name: formValue.site_name,
        welcome_text: formValue.welcome_text,
        maintenance_mode: formValue.maintenance_mode ? 1 : 0
    };

    this.siteConfigService.patchSiteconfig(payload).subscribe({
        next: (res: any) => {
            alert("✅ Configuración actualizada correctamente.");
            this.cerrarModales();
        },
        error: (err: any) => {
            console.error(err);
            alert("Error al guardar la configuración.");
        }
    });
  }

  abrirModalEdicion(user: any) {
    this.usuarioSeleccionado = { ...user };
    this.nuevaPassword = '';
    this.newImgBase64 = '';
    this.newImgName = '';
    this.previewUrl = null;
    this.modalEdicionAbierto = true;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Solo se permiten archivos de imagen');
        return;
      }
      this.newImgName = file.name;
      const reader = new FileReader();
      reader.onload = () => {
        this.newImgBase64 = reader.result as string;
        this.previewUrl = this.newImgBase64;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  guardarCambiosUsuario() {
    if (!confirm(`¿Confirmar cambios para ${this.usuarioSeleccionado.first_name}?`)) return;
    const datosActualizar: any = {
        first_name: this.usuarioSeleccionado.first_name,
        last_name: this.usuarioSeleccionado.last_name,
        email: this.usuarioSeleccionado.email,
        bio: this.usuarioSeleccionado.bio,
        artist_type: this.usuarioSeleccionado.artist_type
    };
    if (this.nuevaPassword && this.nuevaPassword.trim() !== '') {
        datosActualizar.password = this.nuevaPassword;
    }
    if (this.newImgBase64) {
        datosActualizar.profile_img_data = this.newImgBase64;
        datosActualizar.profile_img_name = this.newImgName;
    }
    this.patchUsersService.patchUsers(this.usuarioSeleccionado.id, datosActualizar).subscribe({
        next: (res) => {
            alert('Usuario actualizado correctamente.');
            this.cerrarModales();
            this.cargarUsuarios();
        },
        error: (err) => alert('Error al actualizar usuario.')
    });
  }

  abrirModalPosts(user: any) {
    this.usuarioSeleccionado = user;
    this.modalPostsAbierto = true;
    this.cargandoPosts = true;
    this.listaPostsUsuario = [];
    this.getPostsService.getUserPosts(user.id).subscribe({
        next: (res: any) => {
            this.listaPostsUsuario = Array.isArray(res) ? res : []; 
            this.cargandoPosts = false;
            this.cdr.detectChanges();
        },
        error: (err) => {
            console.error(err);
            this.cargandoPosts = false;
            this.cdr.detectChanges();
        }
    });
  }

  eliminarPost(post: any) {
    if(confirm(`¿Eliminar la publicación "${post.title}"?`)) {
        this.deletePostsService.deletePost(post.id).subscribe({
            next: () => {
                this.listaPostsUsuario = this.listaPostsUsuario.filter(p => p.id !== post.id);
                this.cdr.detectChanges();
            },
            error: () => alert('Error al eliminar publicación.')
        });
    }
  }

  abrirModalEditarPost(post: any) {
    this.modalPostsAbierto = false; 
    this.modalEditarPostAbierto = true;
    this.idPostAEditar = post.id;
    this.postFileName = ''; 
    this.postFileBase64 = '';
    this.formEditarPost.patchValue({
        title: post.title,
        description: post.description,
        file_type: post.file_type,
        visibility: post.visibility || 'public',
        destination_id: post.destination_id
    });
  }

  cancelarEdicionPost() {
    this.cerrarModalEditarPost();
  }

  cerrarModalEditarPost() {
    this.modalEditarPostAbierto = false;
    this.abrirModalPosts(this.usuarioSeleccionado); 
  }

  onPostFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.postFileName = file.name;
      const reader = new FileReader();
      reader.onload = () => {
        this.postFileBase64 = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  guardarPostEditado() {
    if (this.formEditarPost.invalid) {
        alert("Revisa los campos obligatorios.");
        return;
    }
    if (!this.idPostAEditar) return;
    const formVal = this.formEditarPost.value;
    let idDestinoLimpio = formVal.destination_id;
    if (formVal.visibility !== 'followers' || !idDestinoLimpio || idDestinoLimpio === 0) {
        idDestinoLimpio = null;
    }
    const payload: any = { 
        title: formVal.title,
        description: formVal.description,
        file_type: formVal.file_type,
        visibility: formVal.visibility,
        destination_id: idDestinoLimpio
    };
    if (this.postFileBase64) {
        payload.file_name = this.postFileName;
        payload.file_data = this.postFileBase64.split(',')[1];
    }
    this.patchPostService.patchPosts(this.idPostAEditar, payload).subscribe({
        next: (res: any) => {
            alert("¡Publicación actualizada!");
            this.cerrarModalEditarPost();
        },
        error: (err) => alert("Error al actualizar post.")
    });
  }

  acceptedExtensions(): string {   
    const type = this.formEditarPost.get('file_type')?.value;
    switch (type) {
      case 'audio': return '.mp3';
      case 'score': return '.pdf';
      case 'lyrics': return '.txt';
      default: return '*';
    }
  }

  cerrarModales() {
    this.modalEdicionAbierto = false;
    this.modalPostsAbierto = false;
    this.modalEditarPostAbierto = false;
    this.modalConfigAbierto = false; 
    this.usuarioSeleccionado = {};
    this.newImgBase64 = '';
    this.previewUrl = null;
  }

  toggleBlockUser(user: any) {
    const nuevoStatus = user.status == 1 ? 0 : 1;
    const accionTexto = nuevoStatus == 0 ? "bloquear" : "activar";
    if (confirm(`¿Estás seguro de que deseas ${accionTexto} a ${user.first_name}?`)) {
        this.patchUsersService.patchUsers(user.id, { status: nuevoStatus }).subscribe({
            next: () => this.cargarUsuarios(),
            error: () => alert("Error al actualizar estado.")
        });
    }
  }

  deleteUser(user: any) {
      if (confirm(`PELIGRO: ¿Eliminar definitivamente a ${user.first_name}?`)) {
          this.deleteUsersService.deleteUser(user.id).subscribe({
              next: () => this.cargarUsuarios(),
              error: () => alert("Error al eliminar usuario.")
          });
      }
  }

  logout(): void {
    localStorage.clear(); 
    this.router.navigate(['/login']);
  }
}