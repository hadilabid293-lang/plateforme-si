import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Affectations } from './affectations';

describe('Affectations', () => {
  let component: Affectations;
  let fixture: ComponentFixture<Affectations>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Affectations],
    }).compileComponents();

    fixture = TestBed.createComponent(Affectations);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
