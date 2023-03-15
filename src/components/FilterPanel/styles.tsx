import styled from "styled-components";

const StyledFilterPanel = styled.div<{ open: boolean }>`
  z-index: 4;
  position: absolute;
  top: 45px;
  right: 0;
  background: #f2f2f2;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  padding: 12px 24px;
  margin: 20px;
  line-height: 2;
  outline: none;
  width: -moz-fit-content;
  width: fit-content;
  max-width: 350px;
  height: -moz-fit-content;
  height: fit-content;
  overflow: hidden;
  display: flex;
  flex-direction: row;

  border-radius: ${(props) => (props.open ? "8px" : "4px")};
  border-width: ${(props) => (props.open ? "0px" : "1px")};
  border-style: ${(props) => (props.open ? "none" : "solid")};
  border-color: ${(props) => (props.open ? "none" : "darkgrey")};
  min-height: ${(props) => (props.open ? "400px" : "none")};
`;

const StyledFilterTogglePane = styled.div`
  position: relative;
  top: 0px;
  right: 0px;
  background: inheret;
  line-height: 2;
  outline: none;
  width: -moz-fit-content;
  width: fit-content;
  display: flex;
  flex-direction: column;
`;

const StyledFilterBoxes = styled.span`
  background: ${(props) => (props.color ? props.color : "white")};
  box-shadow: 0px -6px 10px rgba(255, 255, 255, 1),
    0px 2px 7px rgba(0, 0, 0, 0.15);
  padding: 12px 24px;
  margin: 5px;
  line-height: 2;
  outline: none;
  display: flex;
  flex-direction: column;
  height: -moz-fit-content;
  height: fit-content;
  max-width: 90%;
  border-radius: 4px;
  text-align: left;
`;

// const Dot = styled.div`
//   height: 13px;
//   width: 13px;
//   border-radius: 50%;
//   background-color: ${(props) => props.color};
//   display: inline-block;
//   margin-right: 0.5rem;
//   margin-left: 0.5rem;
//   vertical-align: middle;
// `;

const Dot = styled.div.attrs(props => ({
    style: {
        backgroundColor: props.color,
    },
  }))`
    height: 13px;
    width: 13px;
    border-radius: 50%;
    display: inline-block;
    margin-right: 0.5rem;
    margin-left: 0.5rem;
    vertical-align: middle;
  `

const OpenCloseButton = styled.button`
  all: unset;
  display: flex;
  cursor: pointer;
  position: relative;
  border-radius: 50%;
  justify-content: flex-end;
  height: -moz-fit-content;
  height: fit-content;
  width: -moz-fit-content;
  width: fit-content;
  opacity: 0.6;
  margin: -8px -20px -20px -8px;

  &:hover {
    opacity: 1;
  }
`;

const LegendLabel = styled.span`
  text-align: left;
  color: #63686a;
  margin-left: 0px;
  margin-top: 0px;
  margin-bottom: 0px;
  width: -moz-fit-content;
  width: fit-content;
  display: table;
  line-height: 1.8rem;
  font-size: 1rem;
  font-weight: 600;

  @media (max-width: 600px) {
    font-size: 0.8rem;
    line-height: 1rem;
  }
`;

const SelectEntry = styled.li`
  list-style-type: none;
  color: #63686a;
  font-size: 0.9rem;
  line-height: 1rem;

  @media (max-width: 360px) {
    font-size: 0.7rem;
  }
`;

const GreyBorderBottomTitle = styled.h2<{
  margin_bottom: string;
  font_size: string;
}>`
  text-align: left;
  color: #63686a;
  margin-left: 0px;
  margin-top: 0px;
  margin-bottom: ${(props) =>
    props && props.margin_bottom ? props.margin_bottom : "20px"};
  border-bottom: 0.2rem solid #63686a;
  width: -moz-fit-content;
  width: fit-content;
  display: table;
  line-height: 1.8rem;

  @media (max-width: 600px) {
    font-size: 1.3rem;
  }
`;

const Filter = (props: { width: number; height: number }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.width}
      height={props.height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="feather feather-filter"
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
    </svg>
  );
};

const ZoomLink = styled.a`
    color: #2193b9;
`;

export {
  StyledFilterPanel,
  StyledFilterTogglePane,
  StyledFilterBoxes,
  Dot,
  OpenCloseButton,
  LegendLabel,
  SelectEntry,
  GreyBorderBottomTitle,
  Filter,
  ZoomLink
};
