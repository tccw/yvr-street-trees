import React from "react";
import { Link } from "react-router-dom";
import { NavHeader } from "./styles";

const RootComponent: React.FC = () => {
  return (
    <>
      <NavHeader>
        {/* @ts-ignore */}
        <span style={{ "pointer-events": "stroke" }}>
          {/* @ts-ignore */}
          <Link style={{ "padding-right": "10px" }} to="LivingSnowProject">
            <b>Map</b>
          </Link>
        </span>
        {/* @ts-ignore */}
        <span style={{ "pointer-events": "stroke" }}>
          <Link to="LivingSnowProject/table">
            <b>Table</b>
          </Link>
        </span>
      </NavHeader>
    </>
  );
};

export default RootComponent;
