import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {Item} from "../model/item";
import {DataResponse, Response, ResponseFlag} from "../../common/response";
import {State} from "../model/state";
import {Category} from "../model/category";


export const saveItem = functions.https.onCall(async (data) => {
  const json: any = JSON.parse(data);

  try {
    // Create a reference to a new document with an auto-generated ID
    const itemRef = admin.firestore().collection("items").doc();
    const id = itemRef.id;
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    // Parse the JSON data into an Item object
    const item: Item = {
      id,
      ownerId: json.ownerId,
      name: json.name,
      description: json.description,
      state: State[json.state.toUpperCase() as keyof typeof State],
      category: Category[json.category.toUpperCase() as keyof typeof Category],
      timestamp,
    };

    console.log("Item id:" + id);
    console.log("Item name: " + item.name);

    // Call the addItemToUser function
    const addItemResponse = await addItemToUser({
      itemId: id,
      uid: item.ownerId,
    });
    if (!addItemResponse.success) {
      console.error("Add item to user failed");
      return new DataResponse<ResponseFlag, string>(false, ResponseFlag.FAIL);
    }

    console.log("After item added to user");

    // Add the document ID to the data
    const dataWithId = {...item, id: id};

    // Save the data to Firestore
    await itemRef.set(dataWithId);

    console.log("Item saved succesfully");
    return new DataResponse<ResponseFlag, string>(
      true,
      ResponseFlag.SUCCESS,
      id
    );
  } catch (error: any) {
    console.error(error.name.string, "Item save failed");
    return new DataResponse<ResponseFlag, string>(false, ResponseFlag.FAIL);
  }
});

interface AddItemData {
  itemId: string;
  uid: string;
}

async function addItemToUser(data: AddItemData) {
  const {itemId, uid} = data;
  const userRef = admin.firestore().collection("users").doc(uid);

  try {
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      console.error("Add item to user failed, user doesnt exist");
      return new Response<ResponseFlag>(false, ResponseFlag.FAIL);
    }

    // Get or create the "items" field in the user document
    const items: string[] = userDoc.get("items") ?? [];
    items.push(itemId);

    // Save the updated items array to Firestore
    await userRef.set({items}, {merge: true});

    console.log("Add item to user success");
    return new Response<ResponseFlag>(true, ResponseFlag.SUCCESS);
  } catch (error) {
    console.error("Add item to user failed");
    return new Response<ResponseFlag>(false, ResponseFlag.FAIL);
  }
}
