import { createListenerMiddleware } from "@reduxjs/toolkit";
import { addItem } from "./slices/cartSlice";
import { showAddedToCart } from "./slices/cartFeedbackSlice";

export const cartFeedbackListener = createListenerMiddleware();

cartFeedbackListener.startListening({
  actionCreator: addItem,
  effect: async (action, api) => {
    api.dispatch(showAddedToCart(action.payload.key));
  },
});
