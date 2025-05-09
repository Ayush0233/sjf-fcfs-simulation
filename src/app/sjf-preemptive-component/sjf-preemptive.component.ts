import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';

interface Process {
  id: number;
  burst: number|null;
  arrival: number|null;
  remaining?: number;
  completion?: number;
  turnAround?: number;
  waiting?: number;
}

interface ScheduleBlock {
  process: number | 'Idle';
  start: number;
  burst: number;
  displayWidth?: number;
}

@Component({
  selector: 'sjf-preemptive',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, CommonModule],
  templateUrl: './sjf-preemptive.component.html',
  styleUrls: ['./sjf-preemptive.component.css']
})
export class SjfPreemptiveComponent implements OnDestroy {
  processes: Process[] = [];
  resultProcesses: Process[] = [];
  schedule: ScheduleBlock[] = [];
  displaySchedule: ScheduleBlock[] = [];

  avgWT = 0;
  avgTAT = 0;
  totalTime = 0;
  unitWidth = 50;

  animationSpeedBase = 500;
  animationSpeedMultiplier = 1;
  playing = false;

  private nextId = 1;
  private pointer = 0;
  private timerSub: Subscription | null = null;

  constructor() {
    this.addProcess();
    this.addProcess();
  }

  ngOnDestroy() {
    this.clearTimer();
  }

  goBack() {
    window.history.back();
  }

  addProcess() {
    this.processes.push({ id: this.nextId++, burst: null, arrival:  null});
  }

  removeProcess(id: number) {
    this.processes = this.processes.filter(p => p.id !== id);
  }

  simulate() {
    this.clearTimer();
    this.resetDisplay();
    const n = this.processes.length;
    const procs = this.processes.map(p => ({ ...p, remaining: p.burst }));
    let currentTime = 0, completed = 0;

    this.schedule = [];
    this.resultProcesses = [];

    while (completed < n) {
      let idx = -1, minRem = Infinity;
      for (let i = 0; i < n; i++) {
        if (procs[i].arrival! <= currentTime && procs[i].remaining! > 0 && procs[i].remaining! < minRem) {
          minRem = procs[i].remaining!;
          idx = i;
        }
      }

      if (idx === -1) {
        this.schedule.push({ process: 'Idle', start: currentTime, burst: 1 });
        currentTime++;
      } else {
        this.schedule.push({ process: procs[idx].id, start: currentTime, burst: 1 });
        procs[idx].remaining!--;
        currentTime++;

        if (procs[idx].remaining === 0) {
          completed++;
          procs[idx].completion = currentTime;
          procs[idx].turnAround = procs[idx].completion! - procs[idx].arrival!;
          procs[idx].waiting = procs[idx].turnAround! - procs[idx].burst!;
          const { remaining, ...finalProcess } = procs[idx]; // Remove 'remaining' before pushing
  this.resultProcesses.push(finalProcess);
        }
      }
    }

    this.totalTime = currentTime;
    this.calculateAverages();
    this.resetDisplay(); // Reset display for Gantt chart
    this.playing = false; // Ensure animation is not playing
    // DO NOT start animation automatically.
    this.resetDisplay(); 
    this.playing = false;
  }

  private calculateAverages() {
    const n = this.resultProcesses.length;
    const totalWT = this.resultProcesses.reduce((sum, p) => sum + (p.waiting || 0), 0);
    const totalTAT = this.resultProcesses.reduce((sum, p) => sum + (p.turnAround || 0), 0);

    this.avgWT = parseFloat((totalWT / n).toFixed(2));
    this.avgTAT = parseFloat((totalTAT / n).toFixed(2));
  }

  play() {
    if (this.playing) return; // prevent double starting
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
    this.clearTimer();  // Clear any running animation
    this.simulate();    // Recalculate schedule
    this.resetDisplay(); // Reset display pointers
    this.playing = false; // Make sure it's paused
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
      displayWidth: 0  // set initial width to 0
    }));
    this.pointer = 0;
  }
  

  getProcessClass(id: number | 'Idle'): string {
    return id === 'Idle' ? '' : 'process-' + ((id - 1) % 5 + 1);
  }

  trackByIdx(i: number) {
    return i;
  }
}
