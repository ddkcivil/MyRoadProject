import { getStatusChip, getPosition } from '../components/ScheduleModule';
import { ScheduleTask } from '../types';
import React from 'react'; // Required for JSX in getStatusChip

// Mock Material-UI Chip component for testing getStatusChip
vi.mock('@mui/material/Chip', () => (props: any) => ({
  props: {
    label: props.label,
    color: props.color,
  },
}));

describe('getStatusChip', () => {
  it('should return an info chip for "On Track" status', () => {
    const chip = getStatusChip('On Track');
    expect(chip.props.label).toBe('On Track');
    expect(chip.props.color).toBe('info');
  });

  it('should return an error chip for "Delayed" status', () => {
    const chip = getStatusChip('Delayed');
    expect(chip.props.label).toBe('Delayed');
    expect(chip.props.color).toBe('error');
  });

  it('should return a success chip for "Completed" status', () => {
    const chip = getStatusChip('Completed');
    expect(chip.props.label).toBe('Completed');
    expect(chip.props.color).toBe('success');
  });
});

describe('getPosition', () => {
  // Test data for a hypothetical project timeline
  const minDate = new Date('2023-01-01').getTime();
  const maxDate = new Date('2023-12-31').getTime();
  const totalDuration = maxDate - minDate; // Roughly a year in milliseconds

  it('should correctly calculate position for a task at the start of the timeline', () => {
    const startDate = '2023-01-01';
    const endDate = '2023-01-31';
    const position = getPosition(startDate, endDate, minDate, maxDate, totalDuration);
    expect(parseFloat(position.left)).toBeCloseTo(0, 2); // Task starts at the very beginning
    // Width for 30 days in a ~365 day year
    expect(parseFloat(position.width)).toBeCloseTo((new Date(endDate).getTime() - new Date(startDate).getTime()) / totalDuration * 100, 2);
  });

  it('should correctly calculate position for a task at the end of the timeline', () => {
    const startDate = '2023-12-01';
    const endDate = '2023-12-31';
    const position = getPosition(startDate, endDate, minDate, maxDate, totalDuration);
    expect(parseFloat(position.left)).toBeCloseTo((new Date(startDate).getTime() - minDate) / totalDuration * 100, 2);
    expect(parseFloat(position.width)).toBeCloseTo((new Date(endDate).getTime() - new Date(startDate).getTime()) / totalDuration * 100, 2);
  });

  it('should correctly calculate position for a task in the middle of the timeline', () => {
    const startDate = '2023-06-01';
    const endDate = '2023-06-30';
    const position = getPosition(startDate, endDate, minDate, maxDate, totalDuration);
    expect(parseFloat(position.left)).toBeCloseTo((new Date(startDate).getTime() - minDate) / totalDuration * 100, 2);
    expect(parseFloat(position.width)).toBeCloseTo((new Date(endDate).getTime() - new Date(startDate).getTime()) / totalDuration * 100, 2);
  });

  it('should handle zero duration tasks (start and end date are same)', () => {
    const startDate = '2023-03-15';
    const endDate = '2023-03-15';
    const position = getPosition(startDate, endDate, minDate, maxDate, totalDuration);
    expect(parseFloat(position.left)).toBeCloseTo((new Date(startDate).getTime() - minDate) / totalDuration * 100, 2);
    expect(parseFloat(position.width)).toBeCloseTo(0.5, 2); // Minimum width of 0.5%
  });

  it('should handle tasks with start date before minDate', () => {
    const startDate = '2022-12-15'; // Before minDate
    const endDate = '2023-01-15';
    const position = getPosition(startDate, endDate, minDate, maxDate, totalDuration);
    expect(parseFloat(position.left)).toBeCloseTo(0, 2); // Should clamp to 0
    // Width should be from minDate to endDate
    expect(parseFloat(position.width)).toBeCloseTo((new Date(endDate).getTime() - minDate) / totalDuration * 100, 2);
  });

  it('should handle tasks with end date after maxDate', () => {
    const startDate = '2023-12-15';
    const endDate = '2024-01-15'; // After maxDate
    const position = getPosition(startDate, endDate, minDate, maxDate, totalDuration);
    expect(parseFloat(position.left)).toBeCloseTo((new Date(startDate).getTime() - minDate) / totalDuration * 100, 2);
    // Width should be from startDate to maxDate
    expect(parseFloat(position.width)).toBeCloseTo((maxDate - new Date(startDate).getTime()) / totalDuration * 100, 2);
  });
});