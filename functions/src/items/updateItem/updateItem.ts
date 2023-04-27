import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {Response, ResponseFlag} from "../../common/response";

interface SaveImagesRequest {
    itemId: string;
    imagesUri: string[];
}

export const updateItem = functions.https.onCall(async (data) => {
  const json: any = JSON.parse(data);
  const request: SaveImagesRequest = {
    itemId: json.ownerId,
    imagesUri: json.uris,
  };

  try {
    const itemRef = admin.firestore().collection("items").doc(request.itemId);

    // Merge the imagesUri with the existing images array if it exists
    const itemDoc = await itemRef.get();
    const existingImages: string[] = itemDoc.get("images") || [];
    const updatedImages = [...existingImages, ...request.imagesUri];

    // Save the updated images array to Firestore
    await itemRef.update({images: updatedImages});

    console.log("Update item with images success");
    return new Response<ResponseFlag>(true, ResponseFlag.SUCCESS);
  } catch (error) {
    console.error("Update item with images failed");
    return new Response<ResponseFlag>(false, ResponseFlag.FAIL);
  }
});
