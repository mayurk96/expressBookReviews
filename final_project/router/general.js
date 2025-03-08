const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();
const axios = require('axios');



public_users.post('/register', function (req, res) {
  const { username, password } = req.body; // Extract username and password from request body

  // Check if username and password are provided
  if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
  }

  // Check if the username already exists
  if (users[username]) {
      return res.status(409).json({ message: "Username already exists" });
  }

  // Register the new user
  users[username] = { password }; // Store password (consider hashing for security)

  return res.status(201).json({ message: "User registered successfully" });
});


// Get the book list available in the shop
public_users.get('/', function (req, res) {
  // Assuming books data is stored in a variable named 'books'
  if (!books || Object.keys(books).length === 0) {
      return res.status(404).json({ message: "No books available" });
  }

  return res.status(200).send(JSON.stringify(books, null, 2)); // Pretty-print JSON
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', function (req, res) {
  const isbn = req.params.isbn; // Get ISBN from request parameters

  if (books[isbn]) {
      return res.status(200).json(books[isbn]); // Return book details if found
  } else {
      return res.status(404).json({ message: "Book not found" }); // Return error if ISBN is invalid
  }
});

  
// Get book details based on author
public_users.get('/author/:author', function (req, res) {
  const author = req.params.author; // Get author from request parameters
  let booksByAuthor = [];

  // Iterate through the books object
  Object.keys(books).forEach((isbn) => {
      if (books[isbn].author.toLowerCase() === author.toLowerCase()) {
          booksByAuthor.push(books[isbn]);
      }
  });

  if (booksByAuthor.length > 0) {
      return res.status(200).json(booksByAuthor); // Return books by the author
  } else {
      return res.status(404).json({ message: "No books found by this author" });
  }
});

// Get all books based on title
public_users.get('/title/:title', function (req, res) {
  const title = req.params.title;
  let booksArray = Object.values(books); // Assuming books is an object

  let filteredBooks = booksArray.filter(book => book.title.toLowerCase() === title.toLowerCase());

  if (filteredBooks.length > 0) {
      res.status(200).json(filteredBooks);
  } else {
      res.status(404).json({ message: "Book not found" });
  }
});


//  Get book review
public_users.get('/review/:isbn', function (req, res) {
  const isbn = req.params.isbn; // Get ISBN from request parameters

  if (books[isbn]) {
      return res.status(200).json(books[isbn].reviews); // Return reviews if the book exists
  } else {
      return res.status(404).json({ message: "Book not found" }); // Error if ISBN is invalid
  }
});

//using axios to complete all of the tasks above

// list the whole list of books/ async/await
public_users.get("/axios", async (req, res) => {
  try {
    const response = await axios.get("http://localhost:5000");
    res.json(response.data);
  } catch {
    res.sendStatus(401);
  }
});

// list books based on ISBN/ async/await
public_users.get("/axios/isbn/:isbn", async (req, res) => {
  try {
    const response = await axios.get(
      `http://localhost:5000/isbn/${req.params.isbn}`
    );
    res.json(response.data);
  } catch {
    res.status(500);
  }
});

// list books based on authors/ async/await
public_users.get("/axios/author/:author", async (req, res) => {
  try {
    const response = await axios.get(
      `http://localhost:5000/author/${req.params.author}`
    );
    res.json(response.data);
  } catch {
    res.status(500);
  }
});

// list books based on title/ promises
public_users.get("/axios/title/:title", (req, res) => {
  const response = axios
    .get(`http://localhost:5000/title/${req.params.title}`)
    .then((response) => {
      res.json(response.data);
    })
    .catch((err) => {
      console.log(err);
      res.status(500);
    });
});

// list book review based on isbn/ promises
public_users.get("/axios/review/:isbn", (req, res) => {
  const response = axios
    .get(`http://localhost:5000/review/${req.params.isbn}`)
    .then((response) => {
      res.json(response.data);
    })
    .catch((err) => {
      console.log(err);
      res.status(500);
    });
});


module.exports.general = public_users;
