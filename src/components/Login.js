import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from './contexts/AuthContext';
import { useNavigate } from "react-router-dom";




const Login = () => {

  const displaynameRef = useRef();
  const emailRef = useRef();
  const passwordRef = useRef();
  const { signUp, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [logUser, setLogin] = useState(true);

  const navigate = useNavigate();


  useEffect(() => {
    // if(user_id) {
    //   console.log("there is a user");
    //   navigate("/home");

    // }



    // if(!user_id) {
    //   console.log("there is no user");
    // }
  });


  // function writeUserData(userId, displayName, email, password) {

  //   const db_ref = db.ref();
  //   // db_ref.child('users/' + userId).set({
  //   //   displayName: displayName,
  //   //   email: email,
  //   //   password: password
  //   // })
  //   get(child(db_ref, `users/${userId}`)).then((snapshot) => {
  //     if (!snapshot.exists()) {
  //       db_ref.child('users/' + userId).set({
  //         photoUrl: "",
  //         displayName: displayName,
  //         Bio: "",
  //         Gender: "Prefer not to say",
  //         email: email,
  //         password: password
  //       })
  //     } else {
  //       alert("User already exists");
  //     }
  //   }).catch((error) => {
  //     console.error(error);
  //   });
  //   setLoading(false);
  // }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    if(!logUser) {
    await signUp(emailRef.current.value, passwordRef.current.value, displaynameRef.current.value);
      setLogin(true);


  }
  if(logUser) {
    await login(emailRef.current.value, passwordRef.current.value).then(res => {
      setLoading(true)
      // dispatch({
      //   type: actionTypes.SET_USER,
      //   user: res
      // })
      // console.log(user);
      navigate("/home");
      // console.log("this is the response from the log in:" + JSON.stringify(res.uid));

    }, error => {
      console.log(error.message);
    });
  }

  setLoading(false);
}

  return (
    <div className='login-register'>
        <div className='banner'>
        <div className='logo-container'>
          <div className='logo'></div>
          <h1>The Dome </h1>
        </div>
        </div>


        <div className='login-form__container'>
          <div className='form__container'>
          <h1> 🕹️WELCOME TO THE DOME 🎮 </h1>

            { !logUser && (

      <form onSubmit={handleSubmit}>
      <p> Create an acccount 👾 </p>
      <label id="display-name__text">Display name</label>
      <input  id="display-name__box" type="text" ref={displaynameRef} name="displayName" />
      <label>Email</label>
      <input type="email" name="user_email" ref={emailRef} required/>
      <label>Password</label>
      <input type="text" ref={passwordRef} name="Password" />



<div className='form__footer'>
      <button id="login-register__button" type="submit" disabled={loading} onClick={handleSubmit}> Register </button>
      <p> Already have an account? </p>
      <p id="text-state" onClick={() =>setLogin(true)}>Sign in</p>
</div>


    </form>
            )}

    { logUser && (
      <form>
        <p> Welcome Back! 😊 👋 </p>
         <label>Email</label>
         <input type="email" name="user_email" ref={emailRef} required/>
         <label>Password</label>
         <input type="text" ref={passwordRef} name="Password" />

        <div className='form__footer'>
      <button id="login-register__button" type="submit" disabled={loading} onClick={handleSubmit}> Login </button>
      <p> Need to register? </p>
      <p id="text-state" onClick={() =>setLogin(false)}> Register </p>
      </div>
         </form>
      )}
    
          </div>


          <div className='form__side-text'>
            <h1> The Dome official discord chatroom</h1>
            <p>We’re excited to have you join our community! This server is all about , sharing gaming tips, discussing books, collaborating on art, etc., and we can’t wait for you to dive in.</p>
          </div>
          
        </div>
        

    </div>
  )
}

export default Login