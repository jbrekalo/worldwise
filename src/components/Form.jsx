// "https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=0&longitude=0"

import { useEffect, useReducer } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import Button from "./Button";
import BackButton from "./BackButton";
import Message from "./Message";
import Spinner from "./Spinner";
import { useUrlPosition } from "../../hooks/UseUrlPosition";
import styles from "./Form.module.css";
import { useCities } from "../contexts/CitiesContext";
import { useNavigate } from "react-router-dom";

export function convertToEmoji(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

const BASE_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client";

const initialState = {
  cityName: "",
  country: "",
  date: new Date(),
  notes: "",
  isLoadingGeocoding: false,
  geocodingError: "",
  emoji: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "setIsLoadingGeocoding":
      return {
        ...state,
        isLoadingGeocoding: action.payload,
      };
    case "setGeocodingError":
      return {
        ...state,
        geocodingError: action.payload,
      };
    case "setCityName":
      return {
        ...state,
        cityName: action.payload,
      };
    case "setCountry":
      return {
        ...state,
        country: action.payload,
      };
    case "setDate":
      return {
        ...state,
        date: action.payload,
      };
    case "setNotes":
      return {
        ...state,
        notes: action.payload,
      };
    case "setEmoji":
      return {
        ...state,
        emoji: convertToEmoji(action.payload),
      };

    default:
      throw new Error("Action unknown");
  }
}

function Form() {
  const [lat, lng] = useUrlPosition();
  const { createCity, isLoading } = useCities();
  const navigate = useNavigate();

  const [
    {
      cityName,
      country,
      date,
      notes,
      isLoadingGeocoding,
      geocodingError,
      emoji,
    },
    dispatch,
  ] = useReducer(reducer, initialState);

  useEffect(
    function () {
      if (!lat && !lng) return;

      async function fetchCityData() {
        try {
          dispatch({ type: "setIsLoadingGeocoding", payload: true });
          dispatch({ type: "setGeocodingError", payload: "" });
          const res = await fetch(
            `${BASE_URL}?latitude=${lat}&longitude=${lng}`
          );
          const data = await res.json();

          if (!data.countryCode)
            throw new Error(
              "That doesn't seem to be a city. Click somewhere else 😉"
            );

          dispatch({
            type: "setCityName",
            payload: data.city || data.locality || "",
          });
          dispatch({
            type: "setCountry",
            payload: data.countryName,
          });
          dispatch({
            type: "setEmoji",
            payload: data.countryCode,
          });
        } catch (err) {
          dispatch({ type: "setGeocodingError", payload: err.message });
        } finally {
          dispatch({ type: "setIsLoadingGeocoding", payload: false });
        }
      }
      fetchCityData();
    },
    [lat, lng]
  );

  function handleSubmit(e) {
    e.preventDefault();

    if (!cityName || !date) return;

    const newCity = {
      cityName,
      country,
      emoji,
      date,
      notes,
      position: { lat, lng },
    };

    createCity(newCity);
    navigate("/app");
  }

  if (isLoadingGeocoding) return <Spinner />;

  if (!lat && !lng)
    return <Message message="Start by clicking somewhere on the map" />;

  if (geocodingError) return <Message message={geocodingError} />;

  return (
    <form
      className={`${styles.form} ${isLoading ? styles.loading : ""}`}
      onSubmit={handleSubmit}
    >
      <div className={styles.row}>
        <label htmlFor="cityName">City name</label>
        <input
          id="cityName"
          onChange={(e) =>
            dispatch({
              type: "setCityName",
              payload: e.target.value,
            })
          }
          value={cityName}
        />
        <span className={styles.flag}>{emoji}</span>
      </div>

      <div className={styles.row}>
        <label htmlFor="date">When did you go to {cityName}?</label>
        {/* <input
          id="date"
          onChange={(e) =>
            dispatch({
              type: "setDate",
              payload: e.target.value,
            })
          }
          value={date}
        /> */}
        <DatePicker
          id="date"
          onChange={(date) =>
            dispatch({
              type: "setDate",
              payload: date,
            })
          }
          selected={date}
          dateFormat={"dd/MM/yyyy"}
        />
      </div>

      <div className={styles.row}>
        <label htmlFor="notes">Notes about your trip to {cityName}</label>
        <textarea
          id="notes"
          onChange={(e) =>
            dispatch({
              type: "setNotes",
              payload: e.target.value,
            })
          }
          value={notes}
        />
      </div>

      <div className={styles.buttons}>
        <Button type="primary">Add</Button>
        <BackButton />
      </div>
    </form>
  );
}

export default Form;
