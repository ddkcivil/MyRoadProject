import { getGeoFromChainage, getStatusChip, formatDate, debounce, START_COORDS, END_COORDS, PROJECT_LENGTH } from '../components/RFIModule';
import { RFIStatus } from '../types';
import React from 'react'; // Required for JSX in getStatusChip

// Fix jest.mock for @mui/material/Chip to avoid JSX syntax directly in the mock
vi.mock('@mui/material/Chip', () => (props: any) => ({
  props: {
    label: props.label,
    color: props.color,
    sx: props.sx,
  },
}));

// Simplify lucide-react mocks, as their actual rendering is not under test here.
vi.mock('lucide-react', () => ({
  CheckCircle: () => null,
  XCircle: () => null,
  Clock: () => null,
  Archive: () => null,
}));


describe('getGeoFromChainage', () => {
  // Store original Math.random
  const originalMathRandom = Math.random;

  beforeEach(() => {
    // Mock Math.random to return a fixed value for deterministic testing
    Math.random = vi.fn(() => 0.5); // Always return 0.5 for consistent offset
  });

  afterEach(() => {
    // Restore original Math.random after each test
    Math.random = originalMathRandom;
  });

  it('should correctly parse chainage without "+" and interpolate', () => {
    // 0+000
    let coords = getGeoFromChainage('0', START_COORDS, END_COORDS, PROJECT_LENGTH);
    expect(coords[0]).toBeCloseTo(START_COORDS[0], 4);
    expect(coords[1]).toBeCloseTo(START_COORDS[1] + (0.5 - 0.5) * 0.0005, 4); // Adjust expected value for mock offset

    // Mid-point 7+500 (7.5 km)
    coords = getGeoFromChainage('7.5', START_COORDS, END_COORDS, PROJECT_LENGTH);
    expect(coords[0]).toBeCloseTo(START_COORDS[0] + (END_COORDS[0] - START_COORDS[0]) * 0.5, 4);
    expect(coords[1]).toBeCloseTo(START_COORDS[1] + (END_COORDS[1] - START_COORDS[1]) * 0.5 + (0.5 - 0.5) * 0.0005, 4);

    // End-point 15+000
    coords = getGeoFromChainage('15', START_COORDS, END_COORDS, PROJECT_LENGTH);
    expect(coords[0]).toBeCloseTo(END_COORDS[0], 4);
    expect(coords[1]).toBeCloseTo(END_COORDS[1] + (0.5 - 0.5) * 0.0005, 4);
  });

  it('should correctly parse chainage with "+" and interpolate', () => {
    // 7+500
    let coords = getGeoFromChainage('7+500', START_COORDS, END_COORDS, PROJECT_LENGTH);
    expect(coords[0]).toBeCloseTo(START_COORDS[0] + (END_COORDS[0] - START_COORDS[0]) * 0.5, 4);
    expect(coords[1]).toBeCloseTo(START_COORDS[1] + (END_COORDS[1] - START_COORDS[1]) * 0.5 + (0.5 - 0.5) * 0.0005, 4);

    // 1+234
    coords = getGeoFromChainage('1+234', START_COORDS, END_COORDS, PROJECT_LENGTH);
    const expectedRatio = 1.234 / PROJECT_LENGTH;
    expect(coords[0]).toBeCloseTo(START_COORDS[0] + (END_COORDS[0] - START_COORDS[0]) * expectedRatio, 4);
    expect(coords[1]).toBeCloseTo(START_COORDS[1] + (END_COORDS[1] - START_COORDS[1]) * expectedRatio + (0.5 - 0.5) * 0.0005, 4);
  });

  it('should handle invalid or non-numeric chainage gracefully', () => {
    let coords = getGeoFromChainage('abc', START_COORDS, END_COORDS, PROJECT_LENGTH);
    expect(coords[0]).toBeCloseTo(START_COORDS[0], 4); // Defaults to 0km
    expect(coords[1]).toBeCloseTo(START_COORDS[1] + (0.5 - 0.5) * 0.0005, 4);

    coords = getGeoFromChainage('', START_COORDS, END_COORDS, PROJECT_LENGTH);
    expect(coords[0]).toBeCloseTo(START_COORDS[0], 4);
    expect(coords[1]).toBeCloseTo(START_COORDS[1] + (0.5 - 0.5) * 0.0005, 4);
  });

  it('should clamp chainage ratio between 0 and 1', () => {
    // Chainage < 0
    let coords = getGeoFromChainage('-5', START_COORDS, END_COORDS, PROJECT_LENGTH);
    expect(coords[0]).toBeCloseTo(START_COORDS[0], 4);
    expect(coords[1]).toBeCloseTo(START_COORDS[1] + (0.5 - 0.5) * 0.0005, 4);

    // Chainage > PROJECT_LENGTH
    coords = getGeoFromChainage('20', START_COORDS, END_COORDS, PROJECT_LENGTH);
    expect(coords[0]).toBeCloseTo(END_COORDS[0], 4);
    expect(coords[1]).toBeCloseTo(END_COORDS[1] + (0.5 - 0.5) * 0.0005, 4);
  });
});

describe('getStatusChip', () => {
  it('should return a success chip for APPROVED status', () => {
    const chip = getStatusChip(RFIStatus.APPROVED);
    expect(chip.props.label).toBe('Approved');
    expect(chip.props.color).toBe('success');
  });

  it('should return an error chip for REJECTED status', () => {
    const chip = getStatusChip(RFIStatus.REJECTED);
    expect(chip.props.label).toBe('Rejected');
    expect(chip.props.color).toBe('error');
  });

  it('should return a warning chip for OPEN status', () => {
    const chip = getStatusChip(RFIStatus.OPEN);
    expect(chip.props.label).toBe('Open');
    expect(chip.props.color).toBe('warning');
  });

  it('should return a grey chip for CLOSED status', () => {
    const chip = getStatusChip(RFIStatus.CLOSED);
    expect(chip.props.label).toBe('Closed');
    // For CLOSED, color is not directly passed to Chip, but bgcolor is set via sx.
    // We can't easily test sx props with this mock, but we can check the label.
    expect(chip.props.sx.bgcolor).toBe('grey.100');
  });

  it('should return an unknown chip for default status', () => {
    const chip = getStatusChip('UNKNOWN' as RFIStatus); // Cast to simulate unknown status
    expect(chip.props.label).toBe('Unknown');
  });
});

describe('formatDate', () => {
  it('should format a valid date string correctly', () => {
    const date = '2023-10-26';
    expect(formatDate(date)).toBe('26 Oct 2023');
  });

  it('should return "N/A" for an empty date string', () => {
    const date = '';
    expect(formatDate(date)).toBe('N/A');
  });

  it('should handle invalid date strings gracefully', () => {
    const date = 'invalid-date';
    // Test for a consistent outcome or "N/A" if that's the desired fallback.
    const formatted = formatDate(date);
    expect(formatted).toBe('Invalid Date'); // Expected behavior of new Date() with invalid string then toLocaleDateString
  });

  it('should format a different valid date string correctly', () => {
    const date = '2024-03-01';
    expect(formatDate(date)).toBe('01 Mar 2024');
  });
});

describe('debounce', () => {
  vi.useFakeTimers(); // Use vi.useFakeTimers()

  it('should debounce a function call', () => {
    const func = vi.fn(); // Use vi.fn()
    const debouncedFunc = debounce(func, 100);

    debouncedFunc();
    debouncedFunc();
    debouncedFunc();

    // Function should not have been called yet
    expect(func).not.toHaveBeenCalled();

    // Advance timers by less than the delay
    vi.advanceTimersByTime(50);
    expect(func).not.toHaveBeenCalled();

    // Advance timers by the remaining delay
    vi.advanceTimersByTime(50);
    expect(func).toHaveBeenCalledTimes(1);

    // Call again after debounce period, should be called once more
    debouncedFunc();
    vi.advanceTimersByTime(100);
    expect(func).toHaveBeenCalledTimes(2);
  });

  it('should pass arguments to the debounced function', () => {
    const func = vi.fn(); // Use vi.fn()
    const debouncedFunc = debounce(func, 100);

    debouncedFunc(1, 2);
    vi.advanceTimersByTime(100);
    expect(func).toHaveBeenCalledWith(1, 2);

    debouncedFunc('hello');
    vi.advanceTimersByTime(100);
    expect(func).toHaveBeenCalledWith('hello');
  });

  it('should correctly reset the timer on subsequent calls', () => {
    const func = vi.fn(); // Use vi.fn()
    const debouncedFunc = debounce(func, 100);

    debouncedFunc(); // Call 1
    vi.advanceTimersByTime(50);
    debouncedFunc(); // Call 2 (resets timer)
    vi.advanceTimersByTime(50);
    debouncedFunc(); // Call 3 (resets timer)

    expect(func).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100); // Only after this should Call 3 execute
    expect(func).toHaveBeenCalledTimes(1);
  });
});