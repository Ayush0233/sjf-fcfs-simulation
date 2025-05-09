// import { CommonModule, NgFor, NgIf } from '@angular/common';
// import { Component } from '@angular/core';
// import { FormsModule } from '@angular/forms';

// interface Process {
//   id: number;
//   burst: number|null;
//   arrival: number|null;
//   completion?: number;
//   turnAround?: number;
//   waiting?: number;
// }

// interface ScheduleBlock {
//   process: number | 'Idle';
//   start: number;
//   burst: number;
// }

// @Component({
//   selector: 'fcfs',
//   imports:[NgFor,CommonModule, NgIf,FormsModule ],
//   templateUrl: './fcfs.component.html',
//   styleUrls: ['./fcfs.component.css']
// })
// export class FcfsComponent {
//   processes: Process[] = [];
//   resultProcesses: Process[] = [];
//   schedule: ScheduleBlock[] = [];
//   avgWT = 0;
//   avgTAT = 0;
//   unitWidth = 30;  // width per time unit for Gantt chart
//   totalTime = 0;

//   private nextId = 1;

//   constructor() {
//     this.addProcess();
//   }

//   goBack() {
//     window.history.back();
//   }

//   addProcess() {
//     this.processes.push({ id: this.nextId++, burst: null, arrival:null });
//   }

//   removeProcess(id: number) {
//     this.processes = this.processes.filter(p => p.id !== id);
//   }

//   simulate() {
//     // Deep copy input processes
//     const procs = this.processes.map(p => ({ ...p }));
//     // Sort by arrival time
//     procs.sort((a, b) => a.arrival! - b.arrival!);

//     let currentTime = 0;
//     this.schedule = [];
//     this.resultProcesses = [];

//     // FCFS scheduling
//     for (const p of procs) {
//       if (currentTime < p.arrival!) {
//         // idle block
//         this.schedule.push({ process: 'Idle', start: currentTime, burst: p.arrival! - currentTime });
//         currentTime = p.arrival!;
//       }
//       // process block
//       this.schedule.push({ process: p.id, start: currentTime, burst: p.burst! });
//       currentTime += p.burst!;
//       p.completion = currentTime;
//       p.turnAround = p.completion - p.arrival!;
//       p.waiting = p.turnAround - p.burst!;
//       this.resultProcesses.push(p);
//     }

//     this.totalTime = currentTime;

//     // calculate averages
//     const totalWT = this.resultProcesses.reduce((sum, p) => sum + (p.waiting || 0), 0);
//     const totalTAT = this.resultProcesses.reduce((sum, p) => sum + (p.turnAround || 0), 0);
//     this.avgWT = parseFloat((totalWT / this.resultProcesses.length).toFixed(2));
//     this.avgTAT = parseFloat((totalTAT / this.resultProcesses.length).toFixed(2));
//   }

//   getProcessClass(id: number | 'Idle'): string {
//     if (id === 'Idle') return '';
//     return 'process-' + ((id - 1) % 5 + 1);
//   }
// }
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';

interface Process {
  id: number;
  burst: number|null;
  arrival: number|null;
  completion?: number;
  turnAround?: number;
  waiting?: number;
}

interface ScheduleBlock {
  process: number | 'Idle';
  start: number;
  burst: number;
  displayWidth?: number;  // for animation
}

@Component({
  selector: 'fcfs',
  standalone: true,
  imports:[NgFor, CommonModule, NgIf, FormsModule],
  templateUrl: './fcfs.component.html',
  styleUrls: ['./fcfs.component.css']
})
export class FcfsComponent implements OnDestroy {
  processes: Process[] = [];
  resultProcesses: Process[] = [];
  schedule: ScheduleBlock[] = [];
  displaySchedule: ScheduleBlock[] = [];

  avgWT = 0;
  avgTAT = 0;
  unitWidth = 30;  // width per time unit for Gantt chart
  totalTime = 0;

  animationSpeedBase = 500;  // base delay in ms
  animationSpeedMultiplier = 1;
  playing = false;

  private nextId = 1;
  private pointer = 0;
  private timerSub: Subscription | null = null;

  constructor() {
    this.addProcess();
  }

  ngOnDestroy() {
    this.clearTimer();
  }

  goBack() {
    window.history.back();
  }

  addProcess() {
    this.processes.push({ id: this.nextId++, burst: null, arrival: null });
  }

  removeProcess(id: number) {
    this.processes = this.processes.filter(p => p.id !== id);
  }

  simulate() {
    this.clearTimer();
    this.resetDisplay();
    
    const procs = this.processes.map(p => ({ ...p }));
    procs.sort((a, b) => a.arrival! - b.arrival!);

    let currentTime = 0;
    this.schedule = [];
    this.resultProcesses = [];

    for (const p of procs) {
      if (currentTime < p.arrival!) {
        this.schedule.push({ process: 'Idle', start: currentTime, burst: p.arrival! - currentTime });
        currentTime = p.arrival!;
      }
      this.schedule.push({ process: p.id, start: currentTime, burst: p.burst! });
      currentTime += p.burst!;
      p.completion = currentTime;
      p.turnAround = p.completion - p.arrival!;
      p.waiting = p.turnAround - p.burst!;
      this.resultProcesses.push(p);
    }

    this.totalTime = currentTime;

    const totalWT = this.resultProcesses.reduce((sum, p) => sum + (p.waiting || 0), 0);
    const totalTAT = this.resultProcesses.reduce((sum, p) => sum + (p.turnAround || 0), 0);

    this.avgWT = parseFloat((totalWT / this.resultProcesses.length).toFixed(2));
    this.avgTAT = parseFloat((totalTAT / this.resultProcesses.length).toFixed(2));

    this.resetDisplay();
    this.playing = false;
  }

  play() {
    if (this.playing) return;
    this.startTimer();
    this.playing = true;
  }

  pause() {
    if (!this.playing) return;
    this.clearTimer();
    this.playing = false;
  }

  togglePlay() {
    if (this.playing) {
      this.pause();
    } else {
      this.play();
    }
  }

  runSimulation() {
    this.clearTimer();
    this.simulate();
    this.resetDisplay();
    this.playing = false;
  }

  private startTimer() {
    const delay = this.animationSpeedBase / this.animationSpeedMultiplier;
    this.timerSub = interval(delay).subscribe(() => {
      if (this.pointer < this.displaySchedule.length) {
        const blk = this.displaySchedule[this.pointer];
        setTimeout(() => blk.displayWidth = blk.burst * this.unitWidth);
        this.pointer++;
      } else {
        this.clearTimer();
        this.playing = false;
      }
    });
  }

  private clearTimer() {
    if (this.timerSub) {
      this.timerSub.unsubscribe();
      this.timerSub = null;
    }
  }

  private resetDisplay() {
    this.displaySchedule = this.schedule.map(b => ({
      ...b,
      displayWidth: 0
    }));
    this.pointer = 0;
  }

  getProcessClass(id: number | 'Idle'): string {
    if (id === 'Idle') return '';
    return 'process-' + ((id - 1) % 5 + 1);
  }

  trackByIdx(i: number) {
    return i;
  }
}
