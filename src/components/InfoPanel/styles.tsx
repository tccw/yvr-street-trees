import styled from "styled-components";

interface PanelProps {
  open: boolean;
}

const Panel = styled.div<PanelProps>`
    position: fixed;
    z-index: 2;
    top: 0;
    left: ${(props) => (props.open ? "0" : "-50%")};
    bottom: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    background-color: white;
    color:black;
    overflow: hidden;
    overflow-y: auto;
    transition: ease-in-out 0.3s;
    width: 500px;
    box-shadow: 0 -2px 4px rgba(0,0,0,0.3);
    @media (max-width: 1200px) {
        width: 40%;
        min-width ${(props) => (props.open ? "350px" : "0px")};
        left: ${(props) => (props.open ? "0" : "-50%")};
    }
    @media (max-width: 600px) {
        width: ${(props) => (props.open ? "100%" : "0px")};
        min-width: 0px;
        top: ${(props) => (props.open ? "40%" : "100%")};
        bottom: 0;
        box-shadow: 0 -2px 4px rgba(0,0,0,0.3);
        left: 2%;
        width: 96%;
        height: 60%;
        border-radius: 2%;
    }
`;

const Title = styled.h1`
  text-align: left;
  color: #63686a;
  margin: 0 20px 5px 20px;
  border-bottom: 0.5rem solid palegreen;
  font-size: 2rem;
  width: -moz-fit-content;
  width: fit-content;
  text-transform: capitalize;
`;

const Dot = styled.div`
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background-color: ${(props) => props.color};
  display: inline-block;
  margin-left: 0.5rem;
  vertical-align: middle;
`;

const PanelHeader = styled.header`
  z-index: 3;
  position: sticky;
  justify-content: space-between;
  display: flex;
  top: 0;
  left: 0;
  height: -moz-fit-content;
  height: fit-content;
  margin-bottom: 2%;
  flex-direction: row;
  background-color: white;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
`;

const OpenCloseButton = styled.button<{ onClick: (e: Event) => void }>`
  all: unset;
  display: flex;
  cursor: pointer;
  position: relative;
  border-radius: 20%;
  align-self: flex-end;
  height: -moz-fit-content;
  height: fit-content;
  width: -moz-fit-content;
  width: fit-content;
  opacity: 0.6;
  margin: 0.3rem;
  &:hover {
    opacity: 1;
  }
  @media (max-width: 600px) {
    transform: rotate(-90deg);
    align-self: flex-start;
  }
`;

const MiddleStyledText = styled.span`
  align-self: center;
  font-weight: 300;
  color: lightgrey;
  margin-left: 25%;
`;

const OpenFlagContainer = styled.div`
  position: fixed;
  z-index: 1;
  top: 0;
  left: 0;
  height: -moz-fit-content;
  height: fit-content;
  width: -moz-fit-content;
  width: fit-content;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: white;
  color: black;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  @media (max-width: 600px) {
    transform: rotate(0deg);
    top: 90%;
    border-radius: 10%;
    left: 2%;
  }
`;

export {
  Panel,
  Title,
  Dot,
  PanelHeader,
  OpenCloseButton,
  MiddleStyledText,
  OpenFlagContainer,
};
