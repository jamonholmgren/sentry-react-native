import { ReactNativeErrorHandlers } from "../../src/js/integrations/reactnativeerrorhandlers";

jest.mock("@sentry/core", () => {
  const core = jest.requireActual("@sentry/core");

  const client = {
    getOptions: () => ({}),
  };

  const hub = {
    getClient: () => client,
    captureEvent: jest.fn(),
  };

  return {
    ...core,
    addGlobalEventProcessor: jest.fn(),
    getCurrentHub: () => hub,
  };
});

import { getCurrentHub } from "@sentry/core";
import { Severity } from "@sentry/types";

beforeEach(() => {
  ErrorUtils.getGlobalHandler = () => jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("ReactNativeErrorHandlers", () => {
  describe("onError", () => {
    test("Sets handled:false on a fatal error", async () => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      let callback: (error: Error, isFatal: boolean) => Promise<void> = () =>
        Promise.resolve();

      ErrorUtils.setGlobalHandler = jest.fn((_callback) => {
        callback = _callback as typeof callback;
      });

      const integration = new ReactNativeErrorHandlers();

      integration.setupOnce();

      expect(ErrorUtils.setGlobalHandler).toHaveBeenCalledWith(callback);

      await callback(new Error("Test Error"), true);

      const hub = getCurrentHub();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const mockCall = (hub.captureEvent as jest.MockedFunction<
        typeof hub.captureEvent
      >).mock.calls[0];
      const event = mockCall[0];

      expect(event.level).toBe(Severity.Fatal);
      expect(event.exception?.values?.[0].mechanism?.handled).toBe(false);
      expect(event.exception?.values?.[0].mechanism?.type).toBe("onerror");
    });

    test("Does not set handled:false on a non-fatal error", async () => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      let callback: (error: Error, isFatal: boolean) => Promise<void> = () =>
        Promise.resolve();

      ErrorUtils.setGlobalHandler = jest.fn((_callback) => {
        callback = _callback as typeof callback;
      });

      const integration = new ReactNativeErrorHandlers();

      integration.setupOnce();

      expect(ErrorUtils.setGlobalHandler).toHaveBeenCalledWith(callback);

      await callback(new Error("Test Error"), false);

      const hub = getCurrentHub();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const mockCall = (hub.captureEvent as jest.MockedFunction<
        typeof hub.captureEvent
      >).mock.calls[0];
      const event = mockCall[0];

      expect(event.level).toBe(Severity.Error);
      expect(event.exception?.values?.[0].mechanism?.handled).toBe(true);
      expect(event.exception?.values?.[0].mechanism?.type).toBe("generic");
    });
  });
});
