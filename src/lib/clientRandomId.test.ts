import { describe, expect, it } from 'vitest';
import { createClientMessageId } from './clientRandomId';

describe('createClientMessageId', () => {
  it('returns non-empty string', () => {
    const id = createClientMessageId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });
});
