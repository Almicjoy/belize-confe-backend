// callback.js
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

// Middleware to parse application/x-www-form-urlencoded
router.use(bodyParser.urlencoded({ extended: true }));

router.post('/callback', (req, res) => {
    const { mdOrder, orderNumber, operation, status } = req.body;
  
    console.log('--- Payment Callback Received ---');
    console.log(`mdOrder: ${mdOrder}`);
    console.log(`orderNumber: ${orderNumber}`);
    console.log(`operation: ${operation}`);
    console.log(`status: ${status}`);
  
    // Optional: You could save this to a DB or session here
  
    // Redirect to return page on frontend
    const redirectUrl = `https://localhost:3000/return?status=${status}&operation=${operation}&orderNumber=${orderNumber}`;
    res.redirect(302, redirectUrl);
  });

module.exports = router;
