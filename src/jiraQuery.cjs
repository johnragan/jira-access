"use strict";
// File: jiraQuery.ts
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create(
        (typeof Iterator === "function" ? Iterator : Object).prototype
      );
    return (
      (g.next = verb(0)),
      (g["throw"] = verb(1)),
      (g["return"] = verb(2)),
      typeof Symbol === "function" &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y["return"]
                  : op[0]
                  ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = require("axios");
// Jira credentials
var JIRA_BASE_URL = "https://compuclaim.atlassian.net";
var JIRA_EMAIL = "jragan@compuclaim.com";
// Access the environment variable and assign it to a variable
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
// Rest of your code
// JQL query: You can customize this query
var JQL_QUERY = "reporter = currentUser() ORDER BY created DESC";
// Function to get Jira tickets
function getJiraTickets() {
  return __awaiter(this, void 0, void 0, function () {
    var response, error_1;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 2, , 3]);
          return [
            4 /*yield*/,
            axios_1.default.get(
              "".concat(JIRA_BASE_URL, "/rest/api/2/search"),
              {
                params: {
                  jql: JQL_QUERY,
                  maxResults: 50, // Limit the number of results (optional)
                },
                headers: {
                  Authorization: "Basic ".concat(
                    Buffer.from(
                      "".concat(JIRA_EMAIL, ":").concat(JIRA_API_TOKEN)
                    ).toString("base64")
                  ),
                  Accept: "application/json",
                  "Content-Type": "application/json",
                },
              }
            ),
          ];
        case 1:
          response = _a.sent();
          // Return the results as JSON
          return [2 /*return*/, response.data];
        case 2:
          error_1 = _a.sent();
          console.error("Error fetching Jira tickets:", error_1);
          throw error_1;
        case 3:
          return [2 /*return*/];
      }
    });
  });
}
// Run the function
getJiraTickets()
  .then(function (data) {
    console.log("Jira Tickets:", JSON.stringify(data, null, 2));
  })
  .catch(function (err) {
    console.error("Failed to retrieve Jira tickets:", err.message);
  });
