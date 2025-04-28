// import { Component } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {  Router } from '@angular/router';

interface Process {
  id: number;
  burst: number|null;
  arrival: number|null;
  completion?: number;
  turnAround?: number;
  waiting?: number;
  completed?: boolean;
  executed?: boolean;
}

interface Block {
  process: number | 'Idle';
  start: number;
  burst: number;
}
@Component({
  selector: 'sjf-nonpremptive',
  imports: [NgFor,NgIf,FormsModule,CommonModule],
  templateUrl: './sjf-nonpremptive.component.html',
  styleUrl: './sjf-nonpremptive.component.css'
})
export class SJFNonPremptiveComponent implements OnInit {
  processes: Process[] = [];
  processCounter = 1;
  resultProcesses: Process[] = [];
  schedule: Block[] = [];
  unitWidth = 30;
  avgWT = 0;
  avgTAT = 0;
  totalTime = 0;

  ngOnInit() {
    this.addProcess();
    this.addProcess();
  }
  constructor(private router:Router){}
  goBack(){
    this.router.navigate([''])
  }
  addProcess() {
    this.processes.push({
      id: this.processCounter++,
      burst: null,
      arrival: null
    });
  }

  removeProcess(id: number) {
    this.processes = this.processes.filter(p => p.id !== id);
  }

  simulate() {
    // Initialize processes
    const procs = this.processes.map(p => ({
      ...p,
      completion: 0,
      turnAround: 0,
      waiting: 0,
      completed: false
    }));

    let currentTime = 0;
    let completedCount = 0;

    while (completedCount < procs.length) {
      const available = procs.filter(p => !p.completed && p.arrival! <= currentTime);
      if (available.length === 0) {
        currentTime++;
        continue;
      }
      available.sort((a, b) => a.burst! - b.burst!);
      const next = available[0]!;
      currentTime += next.burst!;
      next.completion = currentTime;
      next.turnAround = next.completion! - next.arrival!;
      next.waiting = next.turnAround - next.burst!;
      next.completed = true;
      completedCount++;
    }

    this.resultProcesses = procs;
    const totalWT = procs.reduce((sum, p) => sum + (p.waiting || 0), 0);
    const totalTAT = procs.reduce((sum, p) => sum + (p.turnAround || 0), 0);
    this.avgWT = parseFloat((totalWT / procs.length).toFixed(2));
    this.avgTAT = parseFloat((totalTAT / procs.length).toFixed(2));

    this.buildSchedule();
  }

  buildSchedule() {
    let time = 0;
    const schedule: Block[] = [];
    const procs = this.resultProcesses.map(p => ({ ...p, executed: false }));
    let completed = 0;

    while (completed < procs.length) {
      const available = procs.filter(p => !p.executed && p.arrival! <= time);
      if (available.length === 0) {
        schedule.push({ process: 'Idle', start: time, burst: 1 });
        time++;
        continue;
      }
      available.sort((a, b) => a.burst! - b.burst!);
      const proc = available[0];
      schedule.push({ process: proc.id, start: time, burst: proc.burst! });
      time += proc.burst!;
      proc.executed = true;
      completed++;
    }

    this.schedule = schedule;
    this.totalTime = time;
  }

  getProcessClass(proc: number | 'Idle'): string {
    if (proc === 'Idle') {
      return '';
    }
    return 'process-' + ((proc % 5) || 5);
  }
}

