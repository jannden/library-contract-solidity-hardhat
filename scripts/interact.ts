import * as dotenv from "dotenv";

import { BigNumber, Contract, Wallet } from "ethers";
import hre, { ethers } from "hardhat";

dotenv.config();

interface AvailableBook {
  id: BigNumber;
  book: string;
}

const formatAvailableBooks = (books: Array<AvailableBook>): string[] => {
  return books.map((item) => item.book);
};

/*
const aliceWallet = new hre.ethers.Wallet("alicePrivateKey", provider)
const aliceContractInstance = new hre.ethers.Contract(contractAddress, Contract.abi, aliceWallet)

const bobsWallet = new hre.ethers.Wallet("bobsPrivateKey", provider)
const bobsContractInstance = await aliceContractInstance.connect(bobsWallet)
*/

async function interact() {
  // Setup wallet and provider
  let wallet: Wallet;
  if (hre.hardhatArguments.network === "rinkeby") {
    // Wallet instance rinkeby
    const provider = new hre.ethers.providers.InfuraProvider(
      "rinkeby",
      process.env.INFURA
    );
    wallet = new hre.ethers.Wallet(process.env.PRIVATE_KEY || "", provider);
  } else {
    // Wallet instance localhost
    const provider = new hre.ethers.providers.JsonRpcProvider(
      "http://localhost:8545"
    );
    wallet = new hre.ethers.Wallet(
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      provider
    );
  }
  const balance = await wallet.getBalance();
  console.log("Balance is", hre.ethers.utils.formatEther(balance));

  // Contract
  let bookLibrary: Contract;
  if (hre.hardhatArguments.network === "rinkeby") {
    const deployedContractAddress =
      "0x8B2fFcb599a869c379c5C5b0974e57AE2B3a82e4";
    const BookLibrary = await hre.ethers.getContractFactory("BookLibrary");
    bookLibrary = await BookLibrary.attach(deployedContractAddress);
  } else {
    // Redeploy to clean state
    const BookLibrary = await hre.ethers.getContractFactory("BookLibrary");
    bookLibrary = await BookLibrary.deploy();
  }
  console.log("Contract address is", bookLibrary.address);

  // Accounts
  const accounts = await ethers.getSigners();

  // Prepare variable for available books and desirable book
  let availableBooks: Array<AvailableBook>;
  const desiredBookIndex = 0;

  // Add books to the library
  console.log("Adding Books");

  const addBook = await bookLibrary.addBook("Hey", 1);
  await addBook.wait();

  // Update available books
  availableBooks = await bookLibrary.getAvailableBooks();
  console.log("Available books are", formatAvailableBooks(availableBooks));

  // If there are no available books, it's an error
  if (!availableBooks.length) {
    console.error("Adding books failed!");
  }

  // Person 1 borrows the desired book
  console.log("Person 1 borrows.");
  const borrowBook = await bookLibrary
    .connect(accounts[1])
    .borrowBook(desiredBookIndex);
  await borrowBook.wait();

  // Update available books
  availableBooks = await bookLibrary.getAvailableBooks();
  console.log("Available books are", formatAvailableBooks(availableBooks));

  // Person 1 returns the desired book
  console.log("Person 1 returns.");
  const returnBook = await bookLibrary
    .connect(accounts[1])
    .returnBook(desiredBookIndex);
  await returnBook.wait();

  // Update available books
  availableBooks = await bookLibrary.getAvailableBooks();
  console.log("Available books are", formatAvailableBooks(availableBooks));

  // Person 2 borrows the desired book
  console.log("Person 2 borrows.");
  const borrowBookAgain = await bookLibrary
    .connect(accounts[2])
    .borrowBook(desiredBookIndex);
  await borrowBookAgain.wait();

  // Update available books
  const allBorrowers = await bookLibrary.getAllBorrowers(desiredBookIndex);
  console.log("All borrowers are", allBorrowers);
}

interact().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

module.exports = interact;
