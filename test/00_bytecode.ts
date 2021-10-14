import { expect } from "chai";
import vnrsJSON from "../artifacts/contracts/VNRS.sol/VNRS.json";

describe("Bytecode Size", function () {
  it("Has a bytecode that does not exceed the maximum", async () => {
    if (process.env.COVERAGE === "true") {
      return;
    }
    // Max size is 0x6000 (= 24576) bytes
    const maxSize = 24576 * 2; // 2 characters per byte
    console.log(
      `byteLength: ${
        vnrsJSON.deployedBytecode.length
      }, maxSize:${maxSize} fill: ${(
        (vnrsJSON.deployedBytecode.length / maxSize) *
        100
      ).toFixed(4)}%`
    );
    expect(vnrsJSON.deployedBytecode.length).is.lessThan(maxSize);
  });
});
