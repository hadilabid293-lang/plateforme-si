import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Employesb } from './employesb';

describe('Employesb', () => {
  let component: Employesb;
  let fixture: ComponentFixture<Employesb>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Employesb],
    }).compileComponents();

    fixture = TestBed.createComponent(Employesb);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
