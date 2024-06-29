// Import necessary modules
const express = require('express');
const bodyParser = require('body-parser');
const jsforce = require('jsforce');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Initialize an Express application
const app = express();

// Use body-parser middleware to parse JSON request bodies
app.use(bodyParser.json());

// Configure OAuth2 settings for Salesforce using environment variables
const oauth2 = new jsforce.OAuth2({
  loginUrl: process.env.SALESFORCE_LOGIN_URL,
  clientId: process.env.SALESFORCE_CLIENT_ID,
  clientSecret: process.env.SALESFORCE_CLIENT_SECRET,
  redirectUri: process.env.SALESFORCE_REDIRECT_URI // Ensure this matches the callback URL in Salesforce
});

let conn = new jsforce.Connection({ oauth2: oauth2 });
let accessToken = '';  // Variable to store access token
let instanceUrl = '';  // Variable to store instance URL

// Root route to provide a basic welcome message
app.get('/', (req, res) => {
  res.send('Welcome to the Salesforce OAuth Integration');
});

// Route to initiate OAuth2 authentication
app.get('/oauth2/auth', (req, res) => {
  res.redirect(oauth2.getAuthorizationUrl({ scope: 'full refresh_token' }));
});

// Callback route to handle OAuth2 authorization code
app.get('/oauth2/callback', (req, res) => {
  const code = req.query.code;  // Get authorization code from query parameters
  if (!code) {
    return res.status(400).send('Authorization code not provided');
  }
  conn.authorize(code, (err, userInfo) => {
    if (err) {
      return res.status(500).json({ error: err });
    }
    accessToken = conn.accessToken;
    instanceUrl = conn.instanceUrl;
    // Confirm authentication
    res.send(`OAuth2 Authorization successful! You can now make API calls.`);
  });
});

// Middleware to check for authentication
const isAuthenticated = (req, res, next) => {
  if (!accessToken || !instanceUrl) {
    return res.status(401).send('Unauthorized');
  }
  next();
};

// Route to retrieve the status of a case by case number
app.get('/case/status/:caseNumber', isAuthenticated, (req, res) => {
  const caseNumber = req.params.caseNumber;

  conn = new jsforce.Connection({
    instanceUrl: instanceUrl,
    accessToken: accessToken
  });

  const query = `SELECT Status FROM Case WHERE CaseNumber = '${caseNumber}' LIMIT 1`;

  conn.query(query, (err, result) => {
    if (err) {
      return res.status(500).send(err);
    }
    if (result.records.length > 0) {
      res.send({ status: result.records[0].Status });
    } else {
      res.status(404).send({ error: 'Case not found' });
    }
  });
});

// Route to retrieve contact data by contact ID
app.get('/contact/:contactId', isAuthenticated, (req, res) => {
  const contactId = req.params.contactId;

  conn = new jsforce.Connection({
    instanceUrl: instanceUrl,
    accessToken: accessToken
  });

  const url = `${instanceUrl}/services/data/v61.0/sobjects/Contact/${contactId}`;

  conn.request(url, (err, result) => {
    if (err) {
      return res.status(500).send(err);
    }

    const responseData = {
      id: result.Id,
      MailingStreet: result.MailingStreet,
      MailingCity: result.MailingCity,
      MailingState: result.MailingState,
      MailingPostalCode: result.MailingPostalCode,
      MailingCountry: result.MailingCountry,
      Phone: result.Phone
    };

    res.send(responseData);
  });
});

// Route to update contact data
app.patch('/contact/:contactId', isAuthenticated, (req, res) => {
  const contactId = req.params.contactId;
  const updates = req.body; // The fields to be updated

  conn = new jsforce.Connection({
    instanceUrl: instanceUrl,
    accessToken: accessToken
  });

  const updateData = {
    attributes: { type: 'Contact' },
    id: contactId,
    ...updates
  };

  const url = `${instanceUrl}/services/data/v61.0/composite/sobjects`;

  conn.request({
    method: 'PATCH',
    url: url,
    body: JSON.stringify({
      allOrNone: false,
      records: [updateData]
    }),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    }
  }, (err, result) => {
    if (err) {
      return res.status(500).send(err);
    }

    // After updating, retrieve the updated contact data to return the address
    conn.sobject('Contact').retrieve(contactId, (err, contact) => {
      if (err) {
        return res.status(500).send(err);
      }

      const responseData = {
        id: contact.Id,
        MailingStreet: contact.MailingStreet,
        MailingCity: contact.MailingCity,
        MailingState: contact.MailingState,
        MailingPostalCode: contact.MailingPostalCode,
        MailingCountry: contact.MailingCountry,
        Phone: contact.Phone
      };

      res.send(responseData);
    });
  });
});

// Define the port to run the server on (default to 3000 if not specified)
const PORT = process.env.PORT || 3000;

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
