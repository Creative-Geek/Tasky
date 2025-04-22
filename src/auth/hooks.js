import { HttpError } from "wasp/server";

// A simple list of disallowed words. You might want to use a more comprehensive library.
const badWords = ["admin", "root", "superuser", "badword1", "badword2"]; // Add more words as needed

export const onBeforeSignup = async ({ providerId }) => {
  console.log("onBeforeSignup Reached");
  // Check only for username/password signup
  if (providerId.providerName === "username") {
    const username = providerId.providerUserId;

    // Check if the username contains any bad words (case-insensitive)
    const containsBadWord = badWords.some((word) =>
      username.toLowerCase().includes(word)
    );

    if (containsBadWord) {
      throw new HttpError(400, "Username contains disallowed words.");
    }

    // You could add other username validation rules here, e.g., length, characters allowed, etc.
    // Example: Check username length
    if (username.length < 3) {
      throw new HttpError(400, "Username must be at least 3 characters long.");
    }
  }

  // If validation passes, the function completes without throwing an error,
  // and the signup process continues.
};
