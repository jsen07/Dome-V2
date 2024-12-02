import FriendsList from "../components/FriendsList";


export const initialState = {
    user: null,
    isLoading: true,
    chat: {
        chatId: null,
        chatName: null
    },
    friendsList: null,
};

export const actionTypes = {
    SET_USER: "SET_USER",
    SET_CHAT: "SET_CHAT",
    SET_FRIENDSLIST: "SET_FRIENDSLIST",
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
            case actionTypes.SET_FRIENDSLIST:
                return {
                    ...state,
                    isLoading: false,
                    friendsList: action.friendsList
                }
            default:
                return state;
    }
}

export default reducer;