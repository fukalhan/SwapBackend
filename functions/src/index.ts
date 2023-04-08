import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();


// Start writing functions
// https://firebase.google.com/docs/functions/typescript

export const createUser = functions.https.onCall(async (data) => {
  const username = data.username;
  const email = data.email;
  const password = data.password;

  try {
    // Check if the username is already taken in the Users collection
    const snapshot = await admin
      .firestore()
      .collection("Users")
      .where("username", "==", username)
      .get();

    if (!snapshot.empty) {
      // Username is already taken
      return {result: "Username is already taken"};
    } else {
      // Create a new user account in Firebase Authentication
      const userCredential = await admin.auth().createUser({
        email: email,
        password: password,
      });

      // Create a new user record in the Users collection
      const newUser = {
        id: userCredential.uid,
        username: username,
        email: email,
        joinDate: userCredential.metadata.creationTime,
      };

      const userRef = admin
        .firestore()
        .collection("Users")
        .doc(userCredential.uid);

      await userRef.set(newUser);

      return {result: "User created successfully"};
    }
  } catch (error: any) {
    // Handle any errors that occur during the process
    console.error(error);

    if (error.code === "auth/weak-password") {
      // Handle Firebase Authentication errors (weak password)
      return {error: "The provided password is too weak. "};
    } else if (error.code === "auth/email-already-in-use") {
      // Handle Firebase Authentication errors (email already in use)
      return {error: "The provided email address is already in use."};
    } else {
      // Handle Firestore errors (all other errors)
      return {error: "An error occurred while creating the user"};
    }
  }
});
