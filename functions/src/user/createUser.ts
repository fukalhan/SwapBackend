import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {defaultProfilePic} from "./profilePicUri";

export const createUser = functions.https.onCall(async (data) => {
  const username = data.username;
  const email = data.email;
  const password = data.password;

  try {
    // Check if the username is already taken in the Users collection
    const snapshot = await admin
      .firestore()
      .collection("users")
      .where("username", "==", username)
      .get();

    if (!snapshot.empty) {
      // Username is already taken
      return {result: "USERNAME_TAKEN"};
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
        profilePic: defaultProfilePic,
        email: email,
        joinDate: userCredential.metadata.creationTime,
      };

      const userRef = admin
        .firestore()
        .collection("users")
        .doc(userCredential.uid);

      await userRef.set(newUser);

      return {result: "SUCCESS"};
    }
  } catch (error: any) {
    // Handle any errors that occur during the process
    console.error(error);

    if (error.code === "auth/weak-password") {
      return {result: "WEAK_PASSWORD"};
    } else if (error.code === "auth/email-already-exists") {
      return {result: "EMAIL_ALREADY_EXISTS"};
    } else if (error.code === "unavailable") {
      return {result: "SERVICE_UNAVAILABLE"};
    } else {
      return {result: "REQUEST_FAILED"};
    }
  }
});
