import { InputElementBase } from './input-element-base';

describe('InputElementBase', () => {
  it('should create an instance', () => {
    expect(new InputElementBase({ controlType: 'input', value: '', key: 'testKey', type: 'text' })).toBeTruthy();
  });
});
