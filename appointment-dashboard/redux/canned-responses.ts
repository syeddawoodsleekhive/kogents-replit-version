const initialState: CannedResponsesState = {
  categories: [],
  responses: [],
  loading: true,
  error: null,
  stats: {
    totalResponses: 0,
    totalCategories: 0,
    activeResponses: 0,
  },
};

export const cannedResponsesReducer = (
  state = initialState,
  action: CannedResponsesActionTypes
): CannedResponsesState => {
  switch (action.type) {
    case "SET_CATEGORIES":
      return {
        ...state,
        categories: action.payload,
      };

    case "SET_RESPONSES":
      return {
        ...state,
        responses: action.payload,
      };

    case "ADD_CATEGORY":
      return {
        ...state,
        categories: [...state.categories, action.payload],
      };

    case "UPDATE_CATEGORY":
      return {
        ...state,
        categories: state.categories.map((category) =>
          category.id === action.payload.id
            ? { ...category, ...action.payload.updates }
            : category
        ),
      };

    case "DELETE_CATEGORY":
      return {
        ...state,
        categories: state.categories.filter(
          (category) => category.id !== action.payload
        ),
      };

    case "ADD_RESPONSE":
      return {
        ...state,
        responses: [...state.responses, action.payload],
      };

    case "UPDATE_RESPONSE":
      return {
        ...state,
        responses: state.responses.map((response) =>
          response.id === action.payload.id
            ? { ...response, ...action.payload.updates }
            : response
        ),
      };

    case "DELETE_RESPONSE":
      return {
        ...state,
        responses: state.responses.filter(
          (response) => response.id !== action.payload
        ),
      };

    case "SET_LOADING":
      return {
        ...state,
        loading: action.payload,
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
      };

    case "SET_STATS":
      return {
        ...state,
        stats: action.payload,
      };

    default:
      return state;
  }
};
