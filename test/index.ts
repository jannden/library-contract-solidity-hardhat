import { expect } from "chai";
import { ethers } from "hardhat";

describe("BookLibrary", function () {
  it("Should be deployed", async function () {
    const BookLibrary = await ethers.getContractFactory("BookLibrary");
    const bookLibrary = await BookLibrary.deploy();
    await bookLibrary.deployed();
    console.log("Contract deployed to:", bookLibrary.address);
  });
});
