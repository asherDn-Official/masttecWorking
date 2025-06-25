import "../CSS/disablescreen.css";
import React from "react";
import { toast } from "react-toastify";


export default function DisableScreen() {
  
  const handleWarning = () => {
       console.log("clicked")
    //   toast.warning(" You have view Access Only", {
    //     position: "top-center",
    //   });

     const screen  = document.getElementsByClassName('screen')[0];
     
     setTimeout(()=>{
        screen.classList.add('bg')
     },1000)

     setTimeout(()=>{
      screen.classList.remove('bg')
   },2000)



  };

  return (
    <div className=" screen" onClick={handleWarning}>
    </div>
  );
}
