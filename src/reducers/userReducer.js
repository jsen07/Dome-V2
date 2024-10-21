

export const initialState = {
    user: null,
    isLoading: true,
    chat: {
        chatId: null,
        chatName: null
    }
};

export const actionTypes = {
    SET_USER: "SET_USER",
    SET_CHAT: "SET_CHAT"
};

const reducer = (state, action) => {
    // console.log(action);

    switch(action.type) {
        case actionTypes.SET_USER:
            return {
                ...state,
                user: action.user,
                isLoading: false
            }
        case actionTypes.SET_PROFILE:
            return {
                ...state,
                photoURL: action.photoURL,
                isLoading: false
            }
            case actionTypes.SET_CHAT:
            return {
                ...state,
                isLoading: false,
                chat: action.chat
            }
            default:
                return state;
    }
}

export default reducer;