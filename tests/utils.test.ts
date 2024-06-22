import { describe, it } from "vitest";
import { createPromiseResolvers, sleep } from "../src/utils";

describe("utils", () => {
  describe("PromiseResolvers", () => {
    it("can throw error", async ({ expect }) => {
      const errorThrow = async () => {
        await sleep(1000);
        throw new Error("error");
      };
      const fn = async () => {
        const resolvers = createPromiseResolvers();
        await errorThrow();
        return resolvers.promise;
      };

      await expect(fn()).rejects.toThrow("error");
    });
  });
});
