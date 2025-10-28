import React from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export const getStatusIcon = (status: string): React.ReactNode => {
  switch (status) {
    case 'PASS':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'FAIL':
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return <Clock className="h-5 w-5 text-neutral-500" />;
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'PASS':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'FAIL':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-neutral-100 text-neutral-800 border-neutral-200';
  }
};

export const getGradeColor = (grade: string): string => {
  switch (grade) {
    case 'A+':
    case 'A':
      return 'text-green-600 bg-green-50';
    case 'B+':
    case 'B':
      return 'text-indigo-600 bg-indigo-50';
    case 'C+':
    case 'C':
      return 'text-orange-600 bg-orange-50';
    case 'F':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-neutral-600 bg-neutral-50';
  }
};

export const getMarkKey = (schemeName: string): string => {
  return schemeName.toLowerCase().replace(/[^a-z]/g, '');
};