import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DebugSetupComponent } from './debug-setup.component';

describe('DebugSetupComponent', () => {
  let component: DebugSetupComponent;
  let fixture: ComponentFixture<DebugSetupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DebugSetupComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DebugSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
