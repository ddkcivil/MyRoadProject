import { getResultChip } from '../components/LabModule';
import React from 'react'; // Required for JSX in getResultChip

// Mock Material-UI Chip component for testing getResultChip
vi.mock('@mui/material/Chip', () => (props: any) => ({
  props: {
    label: props.label,
    color: props.color,
  },
}));

describe('getResultChip', () => {
  it('should return a success chip for "Pass" result', () => {
    const chip = getResultChip('Pass');
    expect(chip.props.label).toBe('Pass');
    expect(chip.props.color).toBe('success');
  });

  it('should return an error chip for "Fail" result', () => {
    const chip = getResultChip('Fail');
    expect(chip.props.label).toBe('Fail');
    expect(chip.props.color).toBe('error');
  });

  it('should return a warning chip for "Pending" result', () => {
    const chip = getResultChip('Pending');
    expect(chip.props.label).toBe('Pending');
    expect(chip.props.color).toBe('warning');
  });

  it('should handle unexpected result strings gracefully (though types should prevent this)', () => {
    const chip = getResultChip('UNKNOWN' as any); // Cast to simulate unexpected string
    expect(chip.props.label).toBe('Pending'); // Falls back to pending in this implementation
    expect(chip.props.color).toBe('warning');
  });
});