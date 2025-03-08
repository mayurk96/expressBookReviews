const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session'); // Required for session handling
let books = require("./booksdb.js");
const regd_users = express.Router();

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key"; // Use environment variable for security

let users = {}; // Use an object for quick lookup

// Function to check if the username is valid (exists)
const isValid = (username) => {
    return users.hasOwnProperty(username);
};

// Function to check if username and password match
const authenticatedUser = (username, password) => {
    return isValid(username) && users[username].password === password;
};

// Middleware to initialize session
regd_users.use(session({
    secret: SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true in production with HTTPS
}));

// User login
regd_users.post("/login", (req, res) => {
    const { username, password } = req.body;

    // Check if username and password are provided
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    // Validate user credentials
    if (!authenticatedUser(username, password)) {
        return res.status(401).json({ message: "Invalid username or password" });
    }

    // Generate JWT token
    const accessToken = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });

    // Save token in session
    req.session.accessToken = accessToken;

    return res.status(200).json({ message: "Login successful", accessToken });
});

// Add or update a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const { review } = req.query;
    const username = req.session?.accessToken ? jwt.verify(req.session.accessToken, SECRET_KEY).username : null;

    // Check if the user is logged in
    if (!username) {
        return res.status(401).json({ message: "Unauthorized: Please log in to add a review" });
    }

    // Check if review is provided
    if (!review) {
        return res.status(400).json({ message: "Review text is required" });
    }

    // Check if book exists
    if (!books[isbn]) {
        return res.status(404).json({ message: "Book not found" });
    }

    // Initialize reviews if not present
    if (!books[isbn].reviews) {
        books[isbn].reviews = [];
    }

    // Check if user has already reviewed the book
    const existingReviewIndex = books[isbn].reviews.findIndex(r => r.user === username);

    if (existingReviewIndex !== -1) {
        // Modify existing review
        books[isbn].reviews[existingReviewIndex].comment = review;
        return res.status(200).json({ message: "Review updated successfully" });
    } else {
        // Add new review
        books[isbn].reviews.push({ user: username, comment: review });
        return res.status(201).json({ message: "Review added successfully" });
    }
});

// Delete a book review
regd_users.delete("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const username = req.session?.accessToken ? jwt.verify(req.session.accessToken, SECRET_KEY).username : null;

    // Check if the user is logged in
    if (!username) {
        return res.status(401).json({ message: "Unauthorized: Please log in to delete a review" });
    }

    // Check if the book exists
    if (!books[isbn]) {
        return res.status(404).json({ message: "Book not found" });
    }

    // Check if the book has reviews
    if (!books[isbn].reviews || books[isbn].reviews.length === 0) {
        return res.status(404).json({ message: "No reviews available for this book" });
    }

    // Find and remove the user's review
    const initialLength = books[isbn].reviews.length;
    books[isbn].reviews = books[isbn].reviews.filter(review => review.user !== username);

    // Check if a review was deleted
    if (books[isbn].reviews.length === initialLength) {
        return res.status(404).json({ message: "No review found for this user on this book" });
    }

    return res.status(200).json({ message: "Review deleted successfully" });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
