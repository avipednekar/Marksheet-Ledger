// src/utils.ts

import React from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export const getStatusIcon = (status: string): React.ReactNode => {
  switch (status) {
    case 'PASS':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'FAIL':
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return <Clock className="h-5 w-5 text-gray-500" />;
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'PASS':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'FAIL':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getGradeColor = (grade: string): string => {
  switch (grade) {
    case 'A+':
    case 'A':
      return 'text-green-600 bg-green-50';
    case 'B+':
    case 'B':
      return 'text-blue-600 bg-blue-50';
    case 'C+':
    case 'C':
      return 'text-orange-600 bg-orange-50';
    case 'F':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

// Converts evaluation scheme name (e.g., "ESE") to a simple lowercase key (e.g., "ese")
export const getMarkKey = (schemeName: string): string => {
  return schemeName.toLowerCase().replace(/[^a-z]/g, '');
};