import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SjfNonpremptiveComponent } from './sjf-nonpremptive.component';

describe('SjfNonpremptiveComponent', () => {
  let component: SjfNonpremptiveComponent;
  let fixture: ComponentFixture<SjfNonpremptiveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SjfNonpremptiveComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SjfNonpremptiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
