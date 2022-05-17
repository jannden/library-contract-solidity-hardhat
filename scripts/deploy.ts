import hre, { ethers } from "hardhat";

async function deployContract() {
  // Compilation is necessary only when calling the script from node command line
  // await hre.run("compile");

  // BookLibrary
  const BookLibrary = await ethers.getContractFactory("BookLibrary");
  const bookLibrary = await BookLibrary.deploy();
  await bookLibrary.deployed();

  // Printing info
  // console.log and hre.run("print",...) can be used interchangeably
  console.log("Contract deployed to:", bookLibrary.address);
  await hre.run("print", {
    message: "Deployed successfully",
  });

  // Verifying contract on EtherScan.io
  if (hre.hardhatArguments.network === "rinkeby") {
    await bookLibrary.deployTransaction.wait(6);
    await hre.run("verify:verify", {
      address: bookLibrary.address,
      constructorArguments: [],
    });
  }
}

deployContract().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

module.exports = deployContract;
