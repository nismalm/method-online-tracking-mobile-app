/**
 * Form dropdown options and validation rules
 * Centralized constants for maintaining consistency across the application
 */

// Package duration options
export const PACKAGE_OPTIONS = [
  {label: '30 Days', value: '30'},
  {label: '60 Days', value: '60'},
  {label: '90 Days', value: '90'},
  {label: '180 Days', value: '180'},
];

// Blood group options
export const BLOOD_GROUP_OPTIONS = [
  {label: 'A+', value: 'A+'},
  {label: 'A-', value: 'A-'},
  {label: 'B+', value: 'B+'},
  {label: 'B-', value: 'B-'},
  {label: 'AB+', value: 'AB+'},
  {label: 'AB-', value: 'AB-'},
  {label: 'O+', value: 'O+'},
  {label: 'O-', value: 'O-'},
];

// Gender options
export const GENDER_OPTIONS = [
  {label: 'Male', value: 'Male'},
  {label: 'Female', value: 'Female'},
];

// Training mode options
export const TRAINING_MODE_OPTIONS = [
  {label: 'Online', value: 'Online'},
  {label: 'Offline', value: 'Offline'},
];

// Client status options
export const STATUS_OPTIONS = [
  {label: 'Active', value: 'active'},
  {label: 'Paused', value: 'paused'},
  {label: 'Completed', value: 'completed'},
  {label: 'Stopped', value: 'stopped'},
];

// Status color mapping
export const STATUS_COLORS = {
  active: '#22c55e',
  paused: '#EAB308',
  completed: '#3B82F6',
  stopped: '#ef4444',
};

// Validation rules for form fields
export const VALIDATION_RULES = {
  name: {
    minLength: 2,
    required: true,
  },
  mobile: {
    pattern: /^\+?[1-9]\d{6,14}$/,
    required: true,
  },
  age: {
    min: 1,
    max: 120,
    required: true,
  },
  height: {
    min: 50,
    max: 300,
    required: true,
  },
  weight: {
    min: 20,
    max: 500,
    required: true,
  },
};
