
import {Category} from "./category";
import {State} from "./state";

export interface Item {
    id: string,
    ownerId: string;
    name: string;
    description: string;
    state: State;
    category: Category;
}
