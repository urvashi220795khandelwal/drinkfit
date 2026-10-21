import { validateDaily, validateProfile, type DailyForm, type ProfileForm } from '../utils/validation';

const good: ProfileForm = {
  age: '30', gender: 'male', currentWeight: '80', height: '175', targetWeight: '75',
  targetDays: '50', activityLevel: 'moderate', manualBmr: '',
};
const emptyDaily: DailyForm = {
  steps: '', exerciseType: 'none', exerciseMinutes: '', foodCalories: '', exerciseCalories: '', weightKg: '',
};

describe('validateProfile', () => {
  it('accepts valid input and comma decimals', () => {
    const r = validateProfile({ ...good, currentWeight: '80,5' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.currentWeight).toBe(80.5);
  });
  it('rejects under 18', () => {
    const r = validateProfile({ ...good, age: '16' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.age).toContain('18+');
  });
  it('rejects text', () => expect(validateProfile({ ...good, height: 'abc' }).ok).toBe(false));
  it('requires manual BMR for other', () => {
    expect(validateProfile({ ...good, gender: 'other' }).ok).toBe(false);
    expect(validateProfile({ ...good, gender: 'other', manualBmr: '1500' }).ok).toBe(true);
  });
});

describe('validateDaily', () => {
  it('empty form = zeros', () => {
    const r = validateDaily(emptyDaily);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.foodCalories).toBe(0);
  });
  it('rejects negative food', () => expect(validateDaily({ ...emptyDaily, foodCalories: '-5' }).ok).toBe(false));
  it('exercise needs minutes', () => expect(validateDaily({ ...emptyDaily, exerciseType: 'running' }).ok).toBe(false));
  it('blank exercise calories = estimate (null)', () => {
    const r = validateDaily({ ...emptyDaily, exerciseType: 'running', exerciseMinutes: '30' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.exerciseCalories).toBeNull();
  });
});
