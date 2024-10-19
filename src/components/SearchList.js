import React from 'react'
import Placeholder from '../components/images/avatar_placeholder.png';

const SearchList = (props) => {

    console.log(props)

  return (
    <div>


<img src={props.results.photoUrl || Placeholder}></img>
        <p> {props.results.displayName} </p>
     

        </div>
  )
}

export default SearchList


