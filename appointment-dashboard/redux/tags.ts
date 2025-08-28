const initialState: TagsReducerStateType = {
  tags: [],
  tagCategories: [],
  tagsLoading: true,
  tagsError: null,
  tagsStats: {
    totalTags: 0,
    totalTagCategories: 0,
  },
};

const tagsReducer = (
  state = initialState,
  action: TagsActionTypes
): TagsReducerStateType => {
  switch (action.type) {
    case "SET_TAGS":
      return {
        ...state,
        tags: action.payload,
        tagsStats: {
          ...state.tagsStats,
          totalTags: action.payload.length,
        },
      };

    case "SET_TAG_CATEGORIES":
      return {
        ...state,
        tagCategories: action.payload,
        tagsStats: {
          ...state.tagsStats,
          totalTagCategories: action.payload.length,
        },
      };

    case "ADD_TAG":
      return {
        ...state,
        tags: [...state.tags, action.payload],
        tagsStats: {
          ...state.tagsStats,
          totalTags: state.tagsStats.totalTags + 1,
        },
      };

    case "UPDATE_TAG":
      return {
        ...state,
        tags: state.tags.map((tag) =>
          tag.id === action.payload.id
            ? { ...tag, ...action.payload.updates }
            : tag
        ),
      };

    case "DELETE_TAG":
      return {
        ...state,
        tags: state.tags.filter((tag) => tag.id !== action.payload),
        tagsStats: {
          ...state.tagsStats,
          totalTags: state.tagsStats.totalTags - 1,
        },
      };

    case "ADD_TAG_CATEGORY":
      return {
        ...state,
        tagCategories: [...state.tagCategories, action.payload],
        tagsStats: {
          ...state.tagsStats,
          totalTagCategories: state.tagsStats.totalTagCategories + 1,
        },
      };

    case "UPDATE_TAG_CATEGORY":
      return {
        ...state,
        tagCategories: state.tagCategories.map((category) =>
          category.id === action.payload.id
            ? { ...category, ...action.payload.updates }
            : category
        ),
      };

    case "DELETE_TAG_CATEGORY":
      return {
        ...state,
        tagCategories: state.tagCategories.filter(
          (category) => category.id !== action.payload
        ),
        tagsStats: {
          ...state.tagsStats,
          totalTagCategories: state.tagsStats.totalTagCategories - 1,
        },
      };

    case "SET_TAGS_LOADING":
      return {
        ...state,
        tagsLoading: action.payload,
      };

    case "SET_TAGS_ERROR":
      return {
        ...state,
        tagsError: action.payload,
      };

    case "SET_TAGS_STATS":
      return {
        ...state,
        tagsStats: {
          ...state.tagsStats,
          ...action.payload,
        },
      };

    default:
      return state;
  }
};

export default tagsReducer;
