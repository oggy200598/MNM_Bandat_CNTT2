import {
  useEffect,
  useState
} from "react";

import {
  useParams
} from "react-router-dom";

import {
  api
} from "../api";

export default function usePropertyDetail(){

  const[property,setProperty]=
    useState(null);

  const{id}=useParams();

  useEffect(()=>{

    if(!id)return;

    api.property(id)
      .then((data)=>{

        if(data){
          setProperty(data);
        }

      });

  },[id]);

  return [property, setProperty];
}