import { InputElementSelect } from './input-element-select';

describe('InputElementSelect', () => {
  it('should create an instance', () => {
    expect(new InputElementSelect({ value: '', key: 'testKey', type: 'select' })).toBeTruthy();
  });
});
