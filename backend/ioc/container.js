/**
 * Generic DI container factory.
 *
 * API:
 *   bindContract(token, contract)
 *     Declare a port contract for a token before any adapter is registered.
 *     `contract` must expose a `validate(instance)` function that throws when
 *     the instance does not satisfy the port interface.
 *     Ports-and-adapters enforcement: every subsequent register() call for that
 *     token will automatically run contract.validate(instance).
 *
 *   register(name, instance, onDisposeFn?)
 *     Eagerly store a fully-constructed dependency.
 *     Throws if the token is already registered (override prevention).
 *     If a contract is bound for the token it is validated before storing.
 *
 *   registerFactory(name, factory, onDisposeFn?)
 *     Register a lazy factory: (resolve) => instance.
 *     The factory is called once on first resolve(); the result is cached.
 *     Circular dependencies are detected via a resolution stack and reported
 *     with the full chain, e.g. "authService -> jwtService -> authService".
 *
 *     NOTE: A diamond dependency (A->B, A->C, B->D, C->D) is NOT a cycle.
 *     The resolution stack uses indexOf (not a Set) so only true cycles
 *     — where a token reappears in the active resolution chain — are flagged.
 *     Factories that resolve a cached token return immediately without
 *     re-entering the stack.
 *
 *   resolve(name)   -> instance | throws if not registered
 *   has(name)       -> boolean
 *   dispose()       -> runs all teardown fns in LIFO order, then clears state
 *   isDisposed()    -> boolean
 *
 * Application-specific wiring belongs in ioc/registry.js, not here.
 */
const createContainerInstance = () => {
  const instances = new Map(); // eagerly registered instances + cached factory results
  const factories = new Map(); // lazily registered factory functions
  const contracts = new Map(); // port contracts keyed by token (string or Symbol)
  const disposeCallbacks = [];
  const resolvingStack = []; // active resolution chain — used for cycle detection
  let disposed = false;

  // ── Guards ────────────────────────────────────────────────────────────────

  const assertNotDisposed = () => {
    if (disposed) {
      throw new Error('Container has been disposed');
    }
  };

  const assertNotRegistered = (name) => {
    if (instances.has(name) || factories.has(name)) {
      throw new Error(
        `Dependency '${name}' is already registered. ` +
          'Each token must be unique — re-registration is not allowed.',
      );
    }
  };

  const assertDisposeFn = (name, fn) => {
    if (fn !== undefined && typeof fn !== 'function') {
      throw new Error(`onDisposeFn for '${name}' must be a function`);
    }
  };

  // ── Core resolve ──────────────────────────────────────────────────────────

  const resolve = (name) => {
    // Instances take priority; cached factory results are promoted here on first call.
    if (instances.has(name)) {
      return instances.get(name);
    }

    if (factories.has(name)) {
      // Cycle detection: is this token already in the active resolution chain?
      const cycleIndex = resolvingStack.indexOf(name);
      if (cycleIndex !== -1) {
        const chain = [...resolvingStack.slice(cycleIndex), name].join(' -> ');
        throw new Error(`Circular dependency detected: ${chain}`);
      }

      resolvingStack.push(name);
      try {
        const instance = factories.get(name)(resolve);
        instances.set(name, instance); // cache so the factory runs exactly once
        return instance;
      } finally {
        resolvingStack.pop();
      }
    }

    throw new Error(`Dependency '${name}' not registered`);
  };

  // ── Public API ────────────────────────────────────────────────────────────

  return {
    /**
     * Declare a port contract for a token.
     * Must be called before the token is registered.
     * All subsequent register() calls for this token will run contract.validate(instance).
     *
     * @param {string|Symbol} token    The DI token that identifies the port
     * @param {{ validate: (instance: *) => void }} contract
     */
    bindContract: (token, contract) => {
      assertNotDisposed();
      if (!contract || typeof contract.validate !== 'function') {
        throw new Error(
          `Contract for token '${String(token)}' must expose a validate(instance) function`,
        );
      }
      if (contracts.has(token)) {
        throw new Error(`A contract is already bound for token '${String(token)}'`);
      }
      contracts.set(token, contract);
    },

    /**
     * Eagerly register a fully-constructed dependency.
     * If a contract is bound for the token, validates the instance first.
     *
     * @param {string|Symbol} name    Unique token
     * @param {*}             instance The resolved value
     * @param {Function}      [onDisposeFn] Optional async () => void called during dispose()
     */
    register: (name, instance, onDisposeFn) => {
      assertNotDisposed();
      assertNotRegistered(name);
      if (contracts.has(name)) {
        contracts.get(name).validate(instance);
      }
      assertDisposeFn(name, onDisposeFn);
      instances.set(name, instance);
      if (onDisposeFn !== undefined) {
        disposeCallbacks.push(onDisposeFn);
      }
    },

    /**
     * Register a lazy factory that is constructed on first resolve().
     * The result is cached — subsequent resolves return the same instance.
     * Circular dependencies in the resolution chain throw with the full path.
     *
     * @param {string}   name          Unique token
     * @param {Function} factory       (resolve: (name: string) => any) => instance
     * @param {Function} [onDisposeFn] Optional async () => void called during dispose()
     */
    registerFactory: (name, factory, onDisposeFn) => {
      assertNotDisposed();
      assertNotRegistered(name);
      if (typeof factory !== 'function') {
        throw new Error(`Factory for '${name}' must be a function`);
      }
      assertDisposeFn(name, onDisposeFn);
      factories.set(name, factory);
      if (onDisposeFn !== undefined) {
        disposeCallbacks.push(onDisposeFn);
      }
    },

    resolve,

    has: (name) => instances.has(name) || factories.has(name),

    /**
     * Tear down all registered dispose functions in LIFO order, then clear state.
     */
    dispose: async () => {
      if (disposed) {
        return;
      }
      disposed = true;

      for await (const fn of [...disposeCallbacks].reverse()) {
        await fn();
      }
      instances.clear();
      factories.clear();
    },

    isDisposed: () => disposed,
  };
};

module.exports = { createContainerInstance };
