import * as functions from "firebase-functions";
import * as admin from "firebase-admin";


export const updateLikedItems = functions.firestore
  .document("users/{userId}")
  .onUpdate(async (change, context) => {
    const userId = context.params.userId;
    const oldLikedItems = (change.before.data()?.likedItems || []) as string[];
    const newLikedItems = (change.after.data()?.likedItems || []) as string[];

    // Check if newLikedItems array is longer than oldLikedItems array
    if (newLikedItems.length > oldLikedItems.length) {
      const newItems = newLikedItems.filter((item) => !oldLikedItems.includes(item));
      console.log(`User ${userId} liked new items: ${newItems.join(", ")}`);

      const db = admin.firestore();

      // Search for each new item in the items collection and send a Cloud Message to its owner
      for (const newItem of newItems) {
        const itemRef = db.collection("items").doc(newItem);
        const itemDoc = await itemRef.get();
        console.log(`Item id: ${newItem}`);

        if (itemDoc.exists) {
          const itemData = itemDoc.data()!;
          const ownerId = itemData.ownerId;

          console.log(`Retrieved owner ${ownerId}`);

          // Retrieve the user document for the owner of the item
          const ownerRef = db.collection("users").doc(ownerId);
          const ownerDoc = await ownerRef.get();

          // Retrieve the user doc of user
          const userRef = db.collection("users").doc(userId);
          const userDoc = await userRef.get();

          if (ownerDoc.exists && userDoc.exists) {
            const ownerData = ownerDoc.data()!;
            const ownerMessagingToken = ownerData.fcmToken;

            const userData = userDoc.data()!;
            const username = userData.username;

            console.log(`Create message for user ${ownerData.name} about liked item ${itemData.name}`);

            const message = {
              notification: {
                title: "Někdo si přidal tvůj předmět do oblíbených!",
                body: `Uživatel ${username} si přidal tvůj předmět ${itemData.name} do oblíbených.`,
              },
              token: ownerMessagingToken,
              data: {
                click_action: "SWAP_APP_NOTIFICATION",
                type: "ITEM_LIKED",
                userId: userId,
                itemId: newItem,
              },
            };

            await admin.messaging().send(message);
            console.log(`Sent Cloud Message to owner ${ownerId} of item ${newItem}.`);
          }
        }
      }
    }
  });

