import { Routes } from '@angular/router';
import { authGuard } from './services/guardService'; // Importacion del guard

import { Login } from './components/forms/login/login';
import { Register } from './components/forms/register/register';
import { Home } from './components/dashboard/home/home';
import { UploadContent } from './components/dashboard/uploadContent/uploadContent';
import { UserContent } from './components/dashboard/userContent/userContent';
import { SearchUsers } from './components/dashboard/searchUsers/searchUsers';
import { Profile } from './components/dashboard/profile/profile';
import { Settings } from './components/dashboard/settings/settings';
import { FollowingList } from './components/dashboard/followingList/followingList';
import { Inbox } from './components/dashboard/inbox/inbox';
import { AdminPanel } from './components/dashboard/adminPanel/adminPanel';

export const routes: Routes = [
    // Redirecciones...
    { path: '', redirectTo: 'login', pathMatch: 'full'},
    { path: 'login', component: Login},
    { path: 'register', component: Register},
    { path: 'home', 
      component: Home,
      canActivate: [authGuard]},
    { path: 'upload', 
      component: UploadContent,
      canActivate: [authGuard]},
    { path: 'content', 
      component: UserContent,
      canActivate: [authGuard]},
    { path: 'search', 
      component: SearchUsers,
      canActivate: [authGuard]},
    { path: 'profile', 
      component: Profile,
      canActivate: [authGuard]},
    { path: 'settings', 
      component: Settings,
      canActivate: [authGuard]},
    { path: 'following', 
      component: FollowingList, 
      canActivate: [authGuard] },
    { path: 'inbox', 
      component: Inbox, 
      canActivate: [authGuard] },
    { path: 'admin', 
      component: AdminPanel, 
      canActivate: [authGuard] }
];
