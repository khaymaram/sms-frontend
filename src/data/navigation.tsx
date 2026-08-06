import type { ReactNode } from 'react';
import { GraduationCap, BookOpen, UserCheck2, LayoutDashboard, CircleDollarSign, CalendarClock, LibraryBig} from 'lucide-react';
import type { UserRole } from '../types';

export interface NavigationItem {
  label: string;
  path?: string;
  icon?: ReactNode;
  children?: NavigationItem[];
  roles?: UserRole[];
}

export const navigationItems: NavigationItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: <LayoutDashboard size={20} />
    ,roles: ['admin', 'professor']
  },
  {
    label: 'Students',
    path: '/roster',
    icon: <GraduationCap size={20} />
    ,roles: ['admin']
  },
  {
    label: 'Courses',
    path: '/courses',
    icon: <BookOpen size={20} />
    ,roles: ['admin', 'student']
  },
  {
    label: 'Professors',
    path: '/professors',
    icon: <UserCheck2 size={20}/>
    ,roles: ['admin']
  },
  {
    label: 'Majors',
    path: '/majors',
    icon: <LibraryBig size={20}/>,
    roles: ['admin']
  },
  {
    label: 'Finances',
    path: '/finances',
    icon: <CircleDollarSign size={20}/>
    ,roles: ['admin', 'student']
  },
  {
    label: 'Schedule',
    path: '/my-schedule',
    icon: <CalendarClock size={20}/>,
    roles: ['student']
  }
  
];
