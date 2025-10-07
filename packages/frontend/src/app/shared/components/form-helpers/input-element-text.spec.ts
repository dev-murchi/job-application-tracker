import { InputElementText } from './input-element-text';

describe('InputElementText', () => {
  it('should create an instance', () => {
    expect(new InputElementText({ value: '', key: 'testKey', type: 'text' })).toBeTruthy();
  });
});
