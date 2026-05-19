import {
  useEffect,
  useState
} from "react";

import {
  api
} from "../api";

import sampleProperties
  from "../data/sampleProperties";

function queryId() {
  return new URLSearchParams(
    window.location.search
  ).get("id");
}

export default function usePropertyDetail() {
  const [property, setProperty] =
    useState(sampleProperties[0]);

  useEffect(() => {
    const id = queryId();

    if (!id) return;

    api.property(id).then((data) => {
      if (data) setProperty(data);
    });
  }, []);

  return property;
}