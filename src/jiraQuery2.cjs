// File: jiraQuery.js

const axios = require("axios");

// Jira credentials and API URL
const JIRA_BASE_URL = "https://compuclaim.atlassian.net";
const JIRA_EMAIL = "jragan@compuclaim.com";
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
// JQL query: You can customize this query
const JQL_QUERY = "assignee = currentUser() ORDER BY created DESC";

// The Jira issue key where the comment will be added
const ISSUE_KEY = "PD-2478"; // Replace with your Jira issue key

// The comment you want to add
//const COMMENT_BODY = 'This is a new comment John added via the API.';
// The comment you want to add with the mention
const COMMENT_BODY = `Hello [~accountid:62e0779fbc2c449f3d941b69], here's an update on this issue added via the API.`;

// Function to get Jira tickets using JQL
async function getJiraTickets() {
  const url = `${JIRA_BASE_URL}/rest/api/2/search`;

  // HTTP Headers with Basic Auth (Base64-encoded email:token)
  const headers = {
    Authorization: `Basic ${Buffer.from(
      `${JIRA_EMAIL}:${JIRA_API_TOKEN}`
    ).toString("base64")}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  // Parameters for the API request (JQL query and max results)
  const params = {
    jql: JQL_QUERY,
    maxResults: 50, // Adjust the limit if needed
  };

  try {
    const response = await axios.get(url, { headers, params });

    // Extract the issues from the response data
    const issues = response.data.issues;

    // Fetch comments for each issue
    for (let issue of issues) {
      const comments = await getIssueComments(issue.key);
      issue.comments = comments; // Append comments to each issue object
    }

    return issues;
  } catch (error) {
    console.error("Error fetching Jira tickets:", error.message);
    throw error;
  }
}

// Function to get comments for a specific issue
async function getIssueComments(issueKey) {
  const url = `${JIRA_BASE_URL}/rest/api/2/issue/${issueKey}/comment`;

  // HTTP Headers with Basic Auth (Base64-encoded email:token)
  const headers = {
    Authorization: `Basic ${Buffer.from(
      `${JIRA_EMAIL}:${JIRA_API_TOKEN}`
    ).toString("base64")}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  try {
    const response = await axios.get(url, { headers });
    return response.data.comments; // Return the list of comments
  } catch (error) {
    console.error(
      `Error fetching comments for issue ${issueKey}:`,
      error.message
    );
    return [];
  }
}

// Function to add a comment to a Jira issue
async function addJiraComment(issueKey, comment) {
  const url = `${JIRA_BASE_URL}/rest/api/2/issue/${issueKey}/comment`;

  // HTTP Headers with Basic Auth (Base64-encoded email:token)
  const headers = {
    Authorization: `Basic ${Buffer.from(
      `${JIRA_EMAIL}:${JIRA_API_TOKEN}`
    ).toString("base64")}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  // The comment payload
  const data = {
    body: comment,
  };

  try {
    // Make the POST request to add the comment
    const response = await axios.post(url, data, { headers });

    // Log success message
    console.log(`Comment added to issue ${issueKey}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error adding comment to issue ${issueKey}:`, error.message);
    throw error;
  }
}

// Function to search for a user and get their accountId
async function getUserAccountId(username) {
  const url = `${JIRA_BASE_URL}/rest/api/3/user/search`;

  // HTTP Headers with Basic Auth (Base64-encoded email:token)
  const headers = {
    Authorization: `Basic ${Buffer.from(
      `${JIRA_EMAIL}:${JIRA_API_TOKEN}`
    ).toString("base64")}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  try {
    const response = await axios.get(url, {
      headers,
      params: { query: username },
    });

    // Assuming you get only one result, return the first user's accountId
    if (response.data.length > 0) {
      return response.data[0].accountId;
    } else {
      console.log("User not found");
      return null;
    }
  } catch (error) {
    console.error("Error fetching user accountId:", error.message);
    throw error;
  }
}

// // Example: Fetch accountId for user 'johndoe'
// getUserAccountId('John Ragan')
//     .then(accountId => {
//         if (accountId) {
//             console.log('User accountId:', accountId);
//         }
//     })
//     .catch(err => {
//         console.error('Failed to retrieve user accountId:', err.message);
//     });

// Execute the function and log the result
getJiraTickets()
  .then((data) => {
    console.log("Jira Tickets:", JSON.stringify(data, null, 2));
  })
  .catch((err) => {
    console.error("Failed to retrieve Jira tickets:", err.message);
  });

// // Execute the function to add a comment
// addJiraComment(ISSUE_KEY, COMMENT_BODY)
//     .then((data) => {
//         console.log('Comment added successfully:', JSON.stringify(data, null, 2));
//     })
//     .catch((err) => {
//         console.error('Failed to add comment:', err.message);
//     });
