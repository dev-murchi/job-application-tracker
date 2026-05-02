const { describe, beforeEach, it, expect } = require('@jest/globals');
const { createContainerInstance } = require('../../../ioc/container');

describe('createContainerInstance', () => {
  let container;

  beforeEach(() => {
    container = createContainerInstance();
  });

  // ── Factory ───────────────────────────────────────────────────────────────

  describe('factory', () => {
    it('returns an object with the full public API', () => {
      expect(typeof container.bindContract).toBe('function');
      expect(typeof container.register).toBe('function');
      expect(typeof container.registerFactory).toBe('function');
      expect(typeof container.resolve).toBe('function');
      expect(typeof container.has).toBe('function');
      expect(typeof container.dispose).toBe('function');
      expect(typeof container.isDisposed).toBe('function');
    });

    it('starts in a non-disposed state', () => {
      expect(container.isDisposed()).toBe(false);
    });

    it('each call returns an independent container', () => {
      const other = createContainerInstance();
      container.register('a', 1);
      expect(other.has('a')).toBe(false);
    });
  });

  // ── bindContract ──────────────────────────────────────────────────────────

  describe('bindContract', () => {
    it('accepts a contract with a validate function', () => {
      const token = Symbol('Svc');
      expect(() => container.bindContract(token, { validate: () => {} })).not.toThrow();
    });

    it('throws when contract has no validate function', () => {
      const token = Symbol('Svc');
      expect(() => container.bindContract(token, {})).toThrow('validate(instance)');
      expect(() => container.bindContract(token, null)).toThrow('validate(instance)');
    });

    it('throws when the same token is bound twice', () => {
      const token = Symbol('Svc');
      container.bindContract(token, { validate: () => {} });
      expect(() => container.bindContract(token, { validate: () => {} })).toThrow(
        'A contract is already bound',
      );
    });

    it('throws when called on a disposed container', async () => {
      await container.dispose();
      expect(() => container.bindContract(Symbol('x'), { validate: () => {} })).toThrow(
        'Container has been disposed',
      );
    });

    it('validates the instance when register() is called for a bound token', () => {
      const token = Symbol('Port');
      const contract = {
        validate(instance) {
          if (typeof instance.doWork !== 'function') {
            throw new TypeError("adapter must implement 'doWork()'");
          }
        },
      };
      container.bindContract(token, contract);

      expect(() => container.register(token, {})).toThrow("adapter must implement 'doWork()'");
      expect(() => container.register(token, { doWork: () => {} })).not.toThrow();
    });

    it('works with both Symbol and string tokens', () => {
      const strContract = { validate: () => {} };
      container.bindContract('myPort', strContract);
      expect(() => container.register('myPort', {})).not.toThrow();
    });
  });

  // ── register ──────────────────────────────────────────────────────────────

  describe('register', () => {
    it('stores and retrieves a primitive', () => {
      container.register('num', 42);
      expect(container.resolve('num')).toBe(42);
    });

    it('stores and retrieves an object', () => {
      const service = { doWork: jest.fn() };
      container.register('svc', service);
      expect(container.resolve('svc')).toBe(service);
    });

    it('marks the token as registered', () => {
      container.register('x', 'hello');
      expect(container.has('x')).toBe(true);
    });

    it('throws when the same token is registered twice', () => {
      container.register('dup', 1);
      expect(() => container.register('dup', 2)).toThrow("Dependency 'dup' is already registered");
    });

    it('throws when called on a disposed container', async () => {
      await container.dispose();
      expect(() => container.register('late', 1)).toThrow('Container has been disposed');
    });

    it('accepts an onDisposeFn that is called on dispose()', async () => {
      const teardown = jest.fn();
      container.register('svc', {}, teardown);
      await container.dispose();
      expect(teardown).toHaveBeenCalledTimes(1);
    });

    it('throws when onDisposeFn is not a function', () => {
      expect(() => container.register('bad', {}, 'not-a-fn')).toThrow(
        "onDisposeFn for 'bad' must be a function",
      );
    });

    it('accepts undefined onDisposeFn without error', () => {
      expect(() => container.register('ok', {}, undefined)).not.toThrow();
    });
  });

  // ── registerFactory ───────────────────────────────────────────────────────

  describe('registerFactory', () => {
    it('constructs the instance on first resolve()', () => {
      const factory = jest.fn(() => ({ value: 99 }));
      container.registerFactory('lazy', factory);
      expect(factory).not.toHaveBeenCalled();

      const instance = container.resolve('lazy');
      expect(factory).toHaveBeenCalledTimes(1);
      expect(instance).toEqual({ value: 99 });
    });

    it('caches the result — factory runs exactly once', () => {
      const factory = jest.fn(() => ({}));
      container.registerFactory('cached', factory);
      container.resolve('cached');
      container.resolve('cached');
      container.resolve('cached');
      expect(factory).toHaveBeenCalledTimes(1);
    });

    it('passes resolve as the first argument to the factory', () => {
      container.register('dep', 'depValue');
      container.registerFactory('consumer', (resolve) => ({
        dep: resolve('dep'),
      }));
      expect(container.resolve('consumer')).toEqual({ dep: 'depValue' });
    });

    it('marks the token as registered before first resolve()', () => {
      container.registerFactory('f', () => ({}));
      expect(container.has('f')).toBe(true);
    });

    it('throws when the same token is registered twice', () => {
      container.registerFactory('dup', () => ({}));
      expect(() => container.registerFactory('dup', () => ({}))).toThrow(
        "Dependency 'dup' is already registered",
      );
    });

    it('throws when a factory conflicts with an eagerly registered name', () => {
      container.register('taken', 1);
      expect(() => container.registerFactory('taken', () => ({}))).toThrow(
        "Dependency 'taken' is already registered",
      );
    });

    it('throws when factory argument is not a function', () => {
      expect(() => container.registerFactory('bad', 'not-a-fn')).toThrow(
        "Factory for 'bad' must be a function",
      );
    });

    it('throws when called on a disposed container', async () => {
      await container.dispose();
      expect(() => container.registerFactory('late', () => ({}))).toThrow(
        'Container has been disposed',
      );
    });

    it('accepts an onDisposeFn that is called on dispose()', async () => {
      const teardown = jest.fn();
      container.registerFactory('lazy', () => ({}), teardown);
      await container.dispose();
      expect(teardown).toHaveBeenCalledTimes(1);
    });

    it('throws when onDisposeFn is not a function', () => {
      expect(() => container.registerFactory('bad', () => ({}), 42)).toThrow(
        "onDisposeFn for 'bad' must be a function",
      );
    });
  });

  // ── resolve ───────────────────────────────────────────────────────────────

  describe('resolve', () => {
    it('throws for an unknown token', () => {
      expect(() => container.resolve('ghost')).toThrow("Dependency 'ghost' not registered");
    });

    it('resolves a transitive dependency chain', () => {
      container.register('a', 1);
      container.registerFactory('b', (r) => r('a') + 1);
      container.registerFactory('c', (r) => r('b') + 1);
      expect(container.resolve('c')).toBe(3);
    });

    it('resolves a diamond dependency without error', () => {
      // A -> B, A -> C, B -> D, C -> D  (D reached via two paths — not a cycle)
      const dFactory = jest.fn(() => 'D');
      container.registerFactory('D', dFactory);
      container.registerFactory('B', (r) => ({ d: r('D') }));
      container.registerFactory('C', (r) => ({ d: r('D') }));
      container.registerFactory('A', (r) => ({ b: r('B'), c: r('C') }));

      const a = container.resolve('A');
      expect(a.b.d).toBe('D');
      expect(a.c.d).toBe('D');
      // D's factory must run exactly once despite two resolution paths
      expect(dFactory).toHaveBeenCalledTimes(1);
    });

    // ── Circular dependency detection ──────────────────────────────────────

    describe('circular dependency detection', () => {
      it('throws on a direct self-cycle', () => {
        container.registerFactory('self', (r) => r('self'));
        expect(() => container.resolve('self')).toThrow('Circular dependency detected: self');
      });

      it('throws on a two-node cycle (A -> B -> A)', () => {
        container.registerFactory('A', (r) => r('B'));
        container.registerFactory('B', (r) => r('A'));
        expect(() => container.resolve('A')).toThrow('Circular dependency detected: A -> B -> A');
      });

      it('throws on a three-node cycle (X -> Y -> Z -> X)', () => {
        container.registerFactory('X', (r) => r('Y'));
        container.registerFactory('Y', (r) => r('Z'));
        container.registerFactory('Z', (r) => r('X'));
        expect(() => container.resolve('X')).toThrow(
          'Circular dependency detected: X -> Y -> Z -> X',
        );
      });

      it('includes the full chain in the error message', () => {
        container.registerFactory('p', (r) => r('q'));
        container.registerFactory('q', (r) => r('p'));
        let message;
        try {
          container.resolve('p');
        } catch (e) {
          message = e.message;
        }
        expect(message).toContain('p');
        expect(message).toContain('q');
      });
    });
  });

  // ── has ───────────────────────────────────────────────────────────────────

  describe('has', () => {
    it('returns false for unregistered token', () => {
      expect(container.has('none')).toBe(false);
    });

    it('returns true for an eagerly registered token', () => {
      container.register('e', 1);
      expect(container.has('e')).toBe(true);
    });

    it('returns true for a factory-registered token before it is resolved', () => {
      container.registerFactory('f', () => ({}));
      expect(container.has('f')).toBe(true);
    });

    it('returns true for a factory-registered token after it is resolved', () => {
      container.registerFactory('f', () => ({}));
      container.resolve('f');
      expect(container.has('f')).toBe(true);
    });
  });

  // ── dispose ───────────────────────────────────────────────────────────────

  describe('dispose', () => {
    it('sets isDisposed() to true', async () => {
      await container.dispose();
      expect(container.isDisposed()).toBe(true);
    });

    it('is idempotent — calling dispose twice does not throw', async () => {
      await container.dispose();
      await expect(container.dispose()).resolves.toBeUndefined();
    });

    it('does not call teardown callbacks a second time on repeated dispose()', async () => {
      const teardown = jest.fn();
      container.register('svc', {}, teardown);
      await container.dispose();
      await container.dispose();
      expect(teardown).toHaveBeenCalledTimes(1);
    });

    it('calls onDisposeFn registered via register()', async () => {
      const t1 = jest.fn();
      const t2 = jest.fn();
      container.register('a', {}, t1);
      container.register('b', {}, t2);
      await container.dispose();
      expect(t1).toHaveBeenCalledTimes(1);
      expect(t2).toHaveBeenCalledTimes(1);
    });

    it('calls onDisposeFn registered via registerFactory()', async () => {
      const teardown = jest.fn();
      container.registerFactory('lazy', () => ({}), teardown);
      await container.dispose();
      expect(teardown).toHaveBeenCalledTimes(1);
    });

    it('executes teardown callbacks in LIFO order', async () => {
      const order = [];
      container.register('first', {}, async () => await order.push('first'));
      container.register('second', {}, async () => await order.push('second'));
      container.register('third', {}, async () => await order.push('third'));
      await container.dispose();
      expect(order).toEqual(['third', 'second', 'first']);
    });

    it('awaits async teardown callbacks', async () => {
      let resolved = false;
      container.register('async', {}, async () => {
        await new Promise((r) => {
          setTimeout(r, 10);
        });
        resolved = true;
      });
      await container.dispose();
      expect(resolved).toBe(true);
    });

    it('makes resolve() throw after disposal', async () => {
      container.register('svc', {});
      await container.dispose();
      expect(() => container.resolve('svc')).toThrow("Dependency 'svc' not registered");
    });

    it('makes has() return false after disposal', async () => {
      container.register('svc', {});
      await container.dispose();
      expect(container.has('svc')).toBe(false);
    });
  });
});
