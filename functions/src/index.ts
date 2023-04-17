import * as admin from "firebase-admin";
import {createUser} from "./user/createUser";
import {saveItem} from "./items/saveItem/saveItem";
import {updateItem} from "./items/saveItem/updateItem";

admin.initializeApp();

export {createUser};
export {saveItem};
export {updateItem};
