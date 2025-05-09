import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';

interface Process {
  id: number;
  burst: number | null;
  arrival: number | null;
  remaining?: number;
  completion?: number;
  turnAround?: number;
  waiting?: number;
  executed?: boolean;       // add executed flag for scheduling
}

interface ScheduleBlock {
  process: number | 'Idle';
  start: number;
  burst: number;
  displayWidth?: number;
}

@Component({
  selector: 'sjf-nonpremptive',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, CommonModule],
  templateUrl: './sjf-nonpremptive.component.html',
  styleUrls: ['./sjf-nonpremptive.component.css']
})
export class SJFNonPremptiveComponent implements OnDestroy {
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
    this.processes.push({ id: this.nextId++, burst: null, arrival: null });
  }

  removeProcess(id: number) {
    this.processes = this.processes.filter(p => p.id !== id);
  }

  simulate() {
    this.clearTimer();
    this.resetDisplay();
    const n = this.processes.length;
    const procs = this.processes.map(p => ({ ...p, remaining: p.burst, executed: false }));
    let currentTime = 0, completed = 0;

    this.schedule = [];
    this.resultProcesses = [];

    while (completed < n) {
      // find next shortest among those not executed
      const available = procs.filter(p => !p.executed && p.arrival! <= currentTime && p.remaining! > 0);
      if (available.length === 0) {
        this.schedule.push({ process: 'Idle', start: currentTime, burst: 1 });
        currentTime++;
      } else {
        // non-preemptive: pick shortest burst among available
        available.sort((a, b) => a.burst! - b.burst!);
        const proc = available[0]!;
        this.schedule.push({ process: proc.id, start: currentTime, burst: proc.burst! });
        currentTime += proc.burst!;
        proc.completion = currentTime;
        proc.turnAround = proc.completion - proc.arrival!;
        proc.waiting = proc.turnAround - proc.burst!;
        proc.executed = true;
        completed++;
        // store final
        const { remaining, executed, ...finalP } = proc;
        this.resultProcesses.push(finalP);
      }
    }

    this.totalTime = currentTime;
    this.calculateAverages();
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
    this.playing ? this.pause() : this.play();
  }

  runSimulation() {
    this.clearTimer();
    this.simulate();
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
    this.displaySchedule = this.schedule.map(b => ({ ...b, displayWidth: 0 }));
    this.pointer = 0;
  }

  getProcessClass(id: number | 'Idle'): string {
    return id === 'Idle' ? '' : 'process-' + ((id - 1) % 5 + 1);
  }

  trackByIdx(i: number) {
    return i;
  }
}
