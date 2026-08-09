import { Routes } from '@angular/router';
import { Home } from './home/home';
import { ThankYou } from './thank-you/thank-you';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'thank-you', component: ThankYou },
  { path: '**', redirectTo: '' },
];
