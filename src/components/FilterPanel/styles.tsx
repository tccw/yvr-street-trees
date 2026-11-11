import styled from "styled-components";

const StyledFilterPanel = styled.div<{ open: boolean }>`
  z-index: 1000;
  position: absolute;
  top: 45px;
  right: 120px;
  background: #f2f2f2;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  padding: 12px 24px;
  margin: 20px;
  line-height: 2;
  outline: none;
  width: fit-content;
  max-width: 350px;
  height: fit-content;
  overflow: hidden;
  display: flex;
  flex-direction: row;

  border-radius: ${(props) => (props.open ? "8px" : "4px")};
  border-width: ${(props) => (props.open ? "0px" : "1px")};
  border-style: ${(props) => (props.open ? "none" : "solid")};
  border-color: ${(props) => (props.open ? "none" : "darkgrey")};
  min-height: ${(props) => (props.open ? "400px" : "none")};
  max-height: calc(100vh - 90px);

  /* Mobile: Move to left side with proper constraints */
  @media (max-width: 600px) {
    right: auto;
    left: 0;
    margin: 20px;
    max-width: calc(100vw - 60px);
    width: auto;

    /* Bounded so the panel can never grow off the bottom of the screen.
       The panel itself must become a column flex container for the
       inner toggle pane's flex sizing to work; height: fit-content
       would size to the full content height regardless. */
    height: calc(100dvh - 65px);
    max-height: none;
    display: flex;
    flex-direction: column;
  }
`;

const StyledFilterTogglePane = styled.div`
  position: relative;
  top: 0px;
  right: 0px;
  background: inheret;
  line-height: 2;
  outline: none;
  width: fit-content;
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-height: 100%;
  overflow: hidden;

  /* Mobile optimizations */
  @media (max-width: 600px) {
    width: 100%;
    flex: 1 1 auto;
    min-height: 0;
  }
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
  height: fit-content;
  max-width: 90%;
  border-radius: 4px;
  text-align: left;

  /* Mobile optimizations */
  @media (max-width: 600px) {
    max-width: 100%;
    margin: 5px 0;
    padding: 8px 16px;
    /* Keep fixed-size sections from shrinking away in the flex column */
    flex: 0 0 auto;
  }
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
  height: fit-content;
  width: fit-content;
  opacity: 0.6;
  margin: -8px -20px -20px -8px;

  /* Prevent text selection and highlighting */
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;

  /* Remove focus outline that might cause highlighting */
  outline: none;
  -webkit-tap-highlight-color: transparent;

  &:hover {
    opacity: 1;
  }

  &:focus {
    outline: none;
  }

  /* Mobile: Left-aligned button and prevent text stacking */
  @media (max-width: 600px) {
    justify-content: flex-start;
    margin: -8px -8px -20px -20px;

    p {
      white-space: nowrap;
      font-size: 1rem;
      user-select: none;
      -webkit-user-select: none;
    }
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

const TreeSearchBox = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 6px 8px;
  border: 1px solid #c9ced3;
  border-radius: 4px;
  font-size: 0.9rem;
  color: #3a3f42;
  outline: none;
  &:focus {
    border-color: #2193b9;
  }
`;

const TreeSearchResults = styled.div`
  max-height: 140px;
  overflow-y: auto;
  margin-top: 4px;
`;

const TreeSearchResult = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  color: #3a3f42;
  line-height: 1.2rem;
  &:hover {
    background: #e8f4f8;
  }
`;

const TreeSearchResultPath = styled.span`
  color: #7a8287;
  font-size: 0.75rem;
`;

const TaxonomyTree = styled.div`
  /* Desktop: fixed viewport-independent cap (the old behavior). */
  max-height: 340px;
  overflow-y: auto;
  padding-right: 4px;

  /* Mobile: fill whatever height the bounded panel has left, and scroll
     inside. (flex: 1 1 auto + min-height: 0 is the flexbox recipe for a
     shrinkable scroll child; fixed max-height would overflow the panel.) */
  @media (max-width: 600px) {
    flex: 1 1 auto;
    min-height: 0;
    max-height: none;
    width: 100%;
    box-sizing: border-box;
  }
`;

const TreeNodeRow = styled.div<{ depth: number; highlighted?: boolean }>`
  display: flex;
  align-items: center;
  gap: 2px;
  padding-left: ${(props) => props.depth * 14}px;
  line-height: 1.6rem;
  border-radius: 4px;
  background: ${(props) => (props.highlighted ? "#e8f4f8" : "transparent")};
`;

const TreeExpandToggle = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  cursor: pointer;
  color: #63686a;
  font-size: 0.7rem;
  user-select: none;
  flex: 0 0 auto;
`;

const TreeNodeLabel = styled.span<{ bold?: boolean }>`
  font-size: 0.85rem;
  color: #3a3f42;
  font-weight: ${(props) => (props.bold ? 600 : 400)};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TreeNodeCount = styled.span`
  font-size: 0.72rem;
  color: #9aa1a6;
  margin-left: 4px;
  flex: 0 0 auto;
`;

const SelectedChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin: 6px 0 0;

  /* Mobile: single row with an ellipsis chip instead of growing the panel */
  @media (max-width: 600px) {
    flex-wrap: nowrap;
    overflow: hidden;
  }
`;

const SelectedChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #e8f4f8;
  color: #1f4d5f;
  border-radius: 999px;
  padding: 0 6px 0 10px;
  font-size: 0.75rem;
  line-height: 1.4rem;
  white-space: nowrap;
  flex: 0 0 auto;
`;

const MoreChips = styled(SelectedChip)`
  background: #e3e6e8;
  color: #63686a;
  padding: 0 10px;
`;

const ChipRemove = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.7rem;
  line-height: 1;
  color: #1f4d5f;
  &:hover {
    background: #cbe6ef;
  }
`;

const ClearAllButton = styled.button`
  align-self: flex-start;
  margin-top: 8px;
  padding: 2px 12px;
  border: 1px solid #c9ced3;
  border-radius: 4px;
  background: white;
  color: #b3261e;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  &:hover {
    background: #fdecea;
    border-color: #e89a94;
  }
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
  ZoomLink,
  TreeSearchBox,
  TreeSearchResults,
  TreeSearchResult,
  TreeSearchResultPath,
  TaxonomyTree,
  TreeNodeRow,
  TreeExpandToggle,
  TreeNodeLabel,
  TreeNodeCount,
  SelectedChips,
  SelectedChip,
  MoreChips,
  ChipRemove,
  ClearAllButton
};
