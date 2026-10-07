import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Pointages } from './pointages';

describe('Pointages', () => {
  let component: Pointages;
  let fixture: ComponentFixture<Pointages>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Pointages],
    }).compileComponents();

    fixture = TestBed.createComponent(Pointages);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
