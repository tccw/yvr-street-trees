import { makeStyles, Radio, RadioGroup, withStyles } from "@mui/material";
import { green } from "@mui/material/colors";
import styled from "styled-components";
import { useWindowSize } from "../../hooks/useWindowSize";

// right: 100px;
const StyledFilterPanel = styled.div`
  position: absolute;
  bottom: 70px;
  right: 45px;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  padding: 3px 6px;
  margin: 20px;
  line-height: 2;
  outline: none;
  width: -moz-fit-content;
  width: fit-content;
  max-width: 450px;
  height: -moz-fit-content;
  height: fit-content;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  @media (max-width: 600px) {
    right: none;
  }
`;

export { StyledFilterPanel };
