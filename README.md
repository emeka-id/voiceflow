# Voiceflow Salesforce Integration

This project is a Voiceflow agent for an ecommerce company that integrates with Salesforce CRM. The agent allows customers to check the status of their orders and update their shipping address.

## Features

- Check order status
- Update shipping address

## Technologies Used

- Node.js
- Express
- jsforce
- dotenv

## Setup Instructions

### Prerequisites

- Node.js and npm installed
- Salesforce Developer account
- Salesforce Connected App with OAuth2 credentials

### Environment Variables

Create a `.env` file in the root directory of the project and add the following environment variables:

```env
SALESFORCE_LOGIN_URL=https://login.salesforce.com
SALESFORCE_CLIENT_ID=your_salesforce_client_id  # Replace with your Salesforce client ID
SALESFORCE_CLIENT_SECRET=your_salesforce_client_secret  # Replace with your Salesforce client secret
SALESFORCE_REDIRECT_URI=http://localhost:3000/oauth2/callback



### Notes

- Update the `git clone` URL to your actual repository URL.
- Replace placeholder values (like `your_salesforce_client_id` and `your_salesforce_client_secret`) with actual values or instructions to obtain them.
- Ensure that the example responses and requests match the actual data structure returned by your API.

This README provides a comprehensive guide on setting up, running, and using the API endpoints of your project.
