import { Component } from '@angular/core';
import { Router} from '@angular/router';

@Component({
  selector: 'home',
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  // imageUrl:string = "../images/sjf.png"
  constructor(private router:Router){}
  goToSimulation(){
    this.router.navigate(['/simulation'])
  }
}
