import { calculateProgress } from '../components/ProjectsList';
import { BOQItem, WorkCategory } from '../types';

describe('calculateProgress', () => {
  it('should return 0 when total value is 0', () => {
    const boq: BOQItem[] = [];
    expect(calculateProgress(boq)).toBe(0);
  });

  it('should return 0 when no items are completed', () => {
    const boq: BOQItem[] = [
      { id: '1', itemNo: '1.1', description: 'Item 1', unit: 'ea', quantity: 10, rate: 100, category: WorkCategory.GENERAL, completedQuantity: 0 },
      { id: '2', itemNo: '1.2', description: 'Item 2', unit: 'ea', quantity: 20, rate: 50, category: WorkCategory.GENERAL, completedQuantity: 0 },
    ];
    expect(calculateProgress(boq)).toBe(0);
  });

  it('should return 100 when all items are completed', () => {
    const boq: BOQItem[] = [
      { id: '1', itemNo: '1.1', description: 'Item 1', unit: 'ea', quantity: 10, rate: 100, category: WorkCategory.GENERAL, completedQuantity: 10 },
      { id: '2', itemNo: '1.2', description: 'Item 2', unit: 'ea', quantity: 20, rate: 50, category: WorkCategory.GENERAL, completedQuantity: 20 },
    ];
    expect(calculateProgress(boq)).toBe(100);
  });

  it('should return correct percentage for partially completed items', () => {
    const boq: BOQItem[] = [
      { id: '1', itemNo: '1.1', description: 'Item 1', unit: 'ea', quantity: 10, rate: 100, category: WorkCategory.GENERAL, completedQuantity: 5 }, // 500 value
      { id: '2', itemNo: '1.2', description: 'Item 2', unit: 'ea', quantity: 20, rate: 50, category: WorkCategory.GENERAL, completedQuantity: 10 }, // 500 value
    ];
    // Total value: 10*100 + 20*50 = 1000 + 1000 = 2000
    // Completed value: 5*100 + 10*50 = 500 + 500 = 1000
    // Progress: (1000 / 2000) * 100 = 50
    expect(calculateProgress(boq)).toBe(50);
  });

  it('should handle decimal quantities and rates correctly', () => {
    const boq: BOQItem[] = [
      { id: '1', itemNo: '1.1', description: 'Item 1', unit: 'm', quantity: 10.5, rate: 10.0, category: WorkCategory.GENERAL, completedQuantity: 5.25 },
    ];
    // Total value: 10.5 * 10.0 = 105
    // Completed value: 5.25 * 10.0 = 52.5
    // Progress: (52.5 / 105) * 100 = 50
    expect(calculateProgress(boq)).toBe(50);
  });

  it('should handle mixed completed and uncompleted items', () => {
    const boq: BOQItem[] = [
      { id: '1', itemNo: '1.1', description: 'Item 1', unit: 'ea', quantity: 10, rate: 100, category: WorkCategory.GENERAL, completedQuantity: 10 }, // 1000 completed
      { id: '2', itemNo: '1.2', description: 'Item 2', unit: 'ea', quantity: 20, rate: 50, category: WorkCategory.GENERAL, completedQuantity: 0 }, // 0 completed
      { id: '3', itemNo: '1.3', description: 'Item 3', unit: 'ea', quantity: 5, rate: 200, category: WorkCategory.GENERAL, completedQuantity: 2 }, // 400 completed
    ];
    // Total value: (10*100) + (20*50) + (5*200) = 1000 + 1000 + 1000 = 3000
    // Completed value: (10*100) + (0*50) + (2*200) = 1000 + 0 + 400 = 1400
    // Progress: (1400 / 3000) * 100 = 46.66... round to 47
    expect(calculateProgress(boq)).toBe(47);
  });
});