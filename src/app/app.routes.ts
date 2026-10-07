import { Routes } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { Employes } from './rh/employes/employes';
import { Pointages } from './rh/pointages/pointages';
import { Conges } from './rh/conges/conges';
import { Timesheet } from './rh/timesheet/timesheet';
import { Projets } from './gestion-projet/projets/projets';
import { Affectations } from './gestion-projet/affectations/affectations';
import { Planning } from './gestion-projet/planning/planning';
import { DashboardKpi } from './gestion-projet/dashboard-kpi/dashboard-kpi';
import { Administration } from './back-office/administration/administration';
import { Roles } from './back-office/roles/roles';

export const routes: Routes = [

  {
    path: 'dashboard',
    component: Dashboard
  },

  {
    path: 'employes',
    component: Employes
  },

  {
    path: 'pointages',
    component: Pointages
  },
  {
  path: 'conges',
  component: Conges
},
{
  path: 'timesheet',
  component: Timesheet
},
{
  path: 'projets',
  component: Projets
},
{
  path: 'affectations',
  component: Affectations
},
{
  path: 'planning',
  component: Planning
},
{
  path: 'dashboard-kpi',
  component: DashboardKpi
},
{
  path: 'administration',
  component: Administration
},
{
  path: 'roles',
  component: Roles
},

  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }

];
