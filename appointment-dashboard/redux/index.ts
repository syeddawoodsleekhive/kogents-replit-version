import { combineReducers } from "redux";
import { visitorReducer } from "./visitors";
import { chatReducer } from "./chat";
import { userReducer } from "./user";
import { cannedResponsesReducer } from "./canned-responses";
import tagsReducer from "./tags";
import { onboardingReducer } from "./onboarding";

export const rootReducer = combineReducers({
  visitors: visitorReducer,
  chat: chatReducer,
  user: userReducer,
  cannedResponses: cannedResponsesReducer,
  tags: tagsReducer,
  onboarding: onboardingReducer,
});
