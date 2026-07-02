import { CursorRequest } from "./base";

export interface Category {
  id: string;
  name: string;
}


export interface CategoryFilterRequest extends CursorRequest{
  id?: string;
  name?: string;
}

