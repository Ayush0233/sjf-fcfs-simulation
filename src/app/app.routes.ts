import { Routes } from '@angular/router';
import { SimulationComponent } from './simulation/simulation.component';
import { HomeComponent } from './home/home.component';
import { FcfsComponent } from './fcfs-component/fcfs.component';
import { SjfPreemptiveComponent } from './sjf-preemptive-component/sjf-preemptive.component';
import { SJFNonPremptiveComponent } from './sjf-nonpremptive/sjf-nonpremptive.component';

export const routes: Routes = [
    {path:'simulation', component:SimulationComponent},
    {path:'', component:HomeComponent},
    {path:'fcfs', component:FcfsComponent},
    {path:'sjf-premptive', component:SjfPreemptiveComponent},
    {path:'sjf-nonpremptive', component:SJFNonPremptiveComponent},


];
