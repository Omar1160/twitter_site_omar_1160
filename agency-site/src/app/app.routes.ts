import { Routes } from '@angular/router';
import { Home } from './home/home';
import { ThankYou } from './thank-you/thank-you';
import { ThankYouEn } from './thank-you-en/thank-you-en';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'thank-you', component: ThankYou },
  { path: 'thank-you-en', component: ThankYouEn },
  { path: '**', redirectTo: '' },
];
