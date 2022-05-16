import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const books = [
  { title: "The Witcher", copies: 1 },
  { title: "Harry Potter", copies: 1 },
  { title: "Hercule Poirot", copies: 1 },
];

// const jsNumber = (bigNumber: number) => Number(bigNumber.toString());

interface AvailableBook {
  id: number;
  book: string;
}

describe("BookLibrary", function () {
  let bookLibrary: Contract;
  let availableBooks: Array<AvailableBook>;
  let accounts: Array<SignerWithAddress>;

  before(async function () {
    accounts = await ethers.getSigners();
    const BookLibrary = await ethers.getContractFactory("BookLibrary");
    bookLibrary = await BookLibrary.deploy();
    await bookLibrary.deployed();
  });

  it("Should add a book", async function () {
    books.forEach(async (item) => {
      const addBook = await bookLibrary.addBook(item.title, item.copies);
      await addBook.wait();
    });

    availableBooks = await bookLibrary.getAvailableBooks();
    expect(availableBooks.length).to.equal(books.length);
    availableBooks.forEach((item: AvailableBook, index: number) => {
      expect(item.book).to.equal(books[index].title);
    });
  });

  it("Should borrow available book", async function () {
    const borrowingIndex = 0;
    const borrowBook = await bookLibrary
      .connect(accounts[1])
      .borrowBook(borrowingIndex);
    await borrowBook.wait();

    availableBooks = await bookLibrary.getAvailableBooks();
    expect(availableBooks.length).to.equal(books.length - 1);
    expect(availableBooks.map((item) => item.book)).to.eql(
      books
        .filter((_, index) => index !== borrowingIndex)
        .map((item) => item.title)
    );
  });

  it("Should not borrow unavailable book", async function () {
    const borrowingIndex = 0;
    expect(
      bookLibrary.connect(accounts[2]).borrowBook(borrowingIndex)
    ).to.be.revertedWith("No available copies.");
  });

  it("Should add an existing book", async function () {
    const addingIndex = 0;
    const addBook = await bookLibrary.addBook(books[addingIndex].title, 1);
    await addBook.wait();

    availableBooks = await bookLibrary.getAvailableBooks();
    expect(availableBooks.length).to.equal(books.length);
    availableBooks.forEach((item: AvailableBook, index: number) => {
      expect(item.book).to.equal(books[index].title);
    });
  });

  it("Should not borrow book twice", async function () {
    const borrowingIndex = 0;
    expect(
      bookLibrary.connect(accounts[1]).borrowBook(borrowingIndex)
    ).to.be.revertedWith("Please return the book first.");
  });

  it("Should not return book that's not borrowed", async function () {
    const borrowingIndex = 0;
    expect(
      bookLibrary.connect(accounts[2]).returnBook(borrowingIndex)
    ).to.be.revertedWith("Sender doesn't have this book.");
  });

  it("Should return borrowed book", async function () {
    const borrowingIndex = 0;
    const returnBook = await bookLibrary
      .connect(accounts[1])
      .returnBook(borrowingIndex);
    await returnBook.wait();

    availableBooks = await bookLibrary.getAvailableBooks();
    expect(availableBooks.map((item) => item.book)).to.include(
      books[borrowingIndex].title
    );
  });

  it("Should fetch all borrowers for a book", async function () {
    const borrowingIndex = 0;
    const borrowBook = await bookLibrary
      .connect(accounts[2])
      .borrowBook(borrowingIndex);
    await borrowBook.wait();

    const allBorrowers = await bookLibrary.getAllBorrowers(borrowingIndex);
    expect(allBorrowers).to.eql(
      accounts.map((item) => item.address).slice(1, 3)
    );
  });
});
