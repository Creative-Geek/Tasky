import { HttpError } from "wasp/server";

// A simple list of disallowed words. You might want to use a more comprehensive library.
const badWords = ["admin", "root", "superuser", "badword1", "badword2"]; // Add more words as needed

/**
 * Validates a username against various rules
 * @param {string} username - The username to validate
 * @throws {HttpError} - If validation fails
 */
const validateUsername = (username) => {
  // Check if the username contains any bad words (case-insensitive)
  const containsBadWord = badWords.some((word) =>
    username.toLowerCase().includes(word)
  );

  if (containsBadWord) {
    throw new HttpError(400, "Username contains disallowed words.");
  }

  // Check username length
  if (username.length < 2) {
    throw new HttpError(400, "Username must be at least 2 characters long.");
  }

  // Additional validation rules can be added here
};

// export the hook
export const onBeforeSignup = async ({ providerId }) => {
  console.log("onBeforeSignup Reached");
  // Check only for username/password signup
  if (providerId.providerName === "username") {
    const username = providerId.providerUserId;
    validateUsername(username);
  }
};
