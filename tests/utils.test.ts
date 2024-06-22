import { describe, it } from "vitest";
import { createDeferred, sleep } from "../src/utils";

describe("utils", () => {
  describe("Deferred", () => {
    it("can throw error", async ({ expect }) => {
      const errorThrow = async () => {
        await sleep(1000);
        throw new Error("error");
      };
      const fn = async () => {
        const deferred = createDeferred();
        await errorThrow();
        return deferred.promise;
      };

      await expect(fn()).rejects.toThrow("error");
    });
  });
});
