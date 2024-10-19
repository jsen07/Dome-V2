export const initialState = {
    user: null,
    isLoading: true
};

export const actionTypes = {
    SET_USER: "SET_USER",
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
            default:
                return state;
    }
}

export default reducer;