import { Routes } from '@angular/router';
import { SimulationComponent } from './simulation/simulation.component';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
    {path:'simulation', component:SimulationComponent},
    {path:'', component:HomeComponent},
];
