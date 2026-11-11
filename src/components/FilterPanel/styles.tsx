import styled from "styled-components";

/**
 * Standalone collapsed trigger ("Filter Map" pill).
 * Rendered ONLY when the panel is closed, so it owns its own box model:
 * no negative margins, no panel padding/line-height inheritance.
 * Placement mirrors the panel's old position (top-right desktop,
 * top-left mobile) to preserve muscle memory.
 */
const FilterTrigger = styled.button`
  z-index: 1000;
  position: fixed;
  /* Geocoder (Mapbox control, top-right) occupies y ~10-60px
     (10px top margin + 50px input height). Keep this pill below it. */
  top: calc(70px + env(safe-area-inset-top));
  right: 120px;
  height: 44px;
  padding: 0 18px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  color: #63686a;
  border: 1px solid darkgrey;
  border-radius: 999px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  &:hover {
    background: #f7f7f7;
  }
  &:focus-visible {
    outline: 2px solid #2193b9;
    outline-offset: 2px;
  }
  @media (max-width: 600px) {
    right: auto;
    left: 20px;
  }
`;

const TriggerBadge = styled.span`
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #f5a623;
  flex-shrink: 0;
`;

/**
 * Open panel only. It never renders collapsed, so it has a single layout:
 * a bounded column whose grow box (> TaxonomyTree) scrolls internally.
 */
const StyledFilterPanel = styled.div`
  z-index: 1000;
  position: absolute;
  /* Effective top = 50px + 20px margin = 70px, matching FilterTrigger
     (geocoder bottom is ~60px). Keeps open/close from jumping. */
  top: 50px;
  right: 120px;
  background: #f2f2f2;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  box-sizing: border-box;
  padding: 12px 24px;
  margin: 20px;
  line-height: 2;
  outline: none;
  /* Desktop: fixed width (mobile media query below overrides with
     width: auto) so the panel is usefully wide for the genus tree,
     search box, and sliders. 440px total = 392px usable content
     after padding: 24px each side; cards/tree/search fill it, with
     the 5px card margin + 24px panel padding as the right gutter. */
  width: 440px;
  max-width: 440px;
  height: fit-content;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  border-radius: 8px;
  min-height: 400px;
  max-height: calc(100vh - 90px);

  @media (max-width: 600px) {
    right: auto;
    left: 0;
    margin: 20px;
    max-width: calc(100vw - 60px);
    width: auto;

    /* Definite height so the column flex chain (pane -> grow box
       -> taxonomy tree) can shrink and the tree scrolls internally.
       90px = 70px effective top offset (top: 50px + margin: 20px)
       + 20px desired bottom gap, so the bottom buffer matches the
       side margins. env(safe-area-inset-bottom) adds the notch /
       home-indicator inset on iPhones. box-sizing: border-box (base
       rule) makes height include padding, so this math is exact. */
    height: calc(100vh - 90px - env(safe-area-inset-bottom, 0px));
    height: calc(100dvh - 90px - env(safe-area-inset-bottom, 0px));
    max-height: calc(100vh - 90px - env(safe-area-inset-bottom, 0px));
    max-height: calc(100dvh - 90px - env(safe-area-inset-bottom, 0px));
    min-height: min(
      400px,
      calc(100dvh - 90px - env(safe-area-inset-bottom, 0px))
    );
  }
`;

const StyledFilterTogglePane = styled.div`
  position: relative;
  top: 0px;
  right: 0px;
  background: inheret;
  line-height: 2;
  outline: none;
  /* Desktop: fill the panel's content width so interior cards/tree
     stretch with the fixed 440px panel instead of hugging the left
     at fit-content size (mobile media query below also sets 100%). */
  width: 100%;
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

const StyledFilterBoxes = styled.span<{ color?: string; grow?: boolean }>`
  background: ${(props) => (props.color ? props.color : "white")};
  box-shadow: 0px -6px 10px rgba(255, 255, 255, 1),
    0px 2px 7px rgba(0, 0, 0, 0.15);
  /* box-sizing: border-box (like the panel) so max-width: 100% includes
     padding: 12px 24px. Without it, content-box max-width + 48px
     padding + 10px margin overflows the pane and the card's right
     edge bleeds to the panel border (no right buffer). */
  box-sizing: border-box;
  padding: 12px 24px;
  margin: 5px;
  line-height: 2;
  outline: none;
  display: flex;
  flex-direction: column;
  height: ${(props) => (props.grow ? "auto" : "fit-content")};
  /* Desktop: fill the pane width (matching the tree/search width) and
     let margins provide the side buffer; the mobile override below
     keeps max-width: 100% + margin: 5px 0. */
  max-width: 100%;
  border-radius: 4px;
  text-align: left;
  flex: ${(props) => (props.grow ? "1 1 auto" : "0 0 auto")};
  min-height: ${(props) => (props.grow ? "0" : "auto")};
  overflow: ${(props) => (props.grow ? "hidden" : "visible")};

  /* Mobile optimizations */
  @media (max-width: 600px) {
    max-width: 100%;
    margin: 5px 0;
    padding: 8px 16px;
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
  display: flex;
  cursor: pointer;
  position: relative;
  border-radius: 50%;
  justify-content: flex-end;
  height: fit-content;
  width: fit-content;
  opacity: 0.6;
  padding: 8px;
  align-self: flex-end;
  background: transparent;
  border: none;

  /* Prevent text selection and highlighting */
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;

  -webkit-tap-highlight-color: transparent;

  &:hover {
    opacity: 1;
  }

  &:focus-visible {
    outline: 2px solid #2193b9;
    outline-offset: 2px;
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

/**
 * Positioning context for the search input + results dropdown.
 * On mobile the results are absolutely positioned relative to this
 * wrapper so they overlay the taxonomy tree (autocomplete-style)
 * instead of taking flow space and squeezing the tree.
 */
const SearchContainer = styled.div`
  position: relative;
  width: 100%;
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

  /* Mobile: overlay the taxonomy tree (positioned relative to
     SearchContainer, just below the input) with a much taller cap
     than the desktop 140px, so more suggestions are visible without
     shrinking the tree underneath. Picking a result clears the query
     and removes the overlay. */
  @media (max-width: 600px) {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    margin-top: 0;
    max-height: min(45dvh, 320px);
    background: #fff;
    border: 1px solid #c9ced3;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
    box-sizing: border-box;
    z-index: 10;
  }
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
  /* Keep deep rows (padding-left: depth * 14px) inside the pane's
     content box on desktop instead of sliding under the right
     padding; TreeNodeLabel ellipsizes when constrained. */
  width: 100%;
  box-sizing: border-box;

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

/* Range filters (Diameter / Height): same pill as SelectedChip but a
   slightly darker blue so they read as a different kind of filter. */
const RangeChip = styled(SelectedChip)`
  background: #b9d9e8;
  color: #15435a;
`;

const RangeChipRemove = styled(ChipRemove)`
  color: #15435a;
  &:hover {
    background: #9cc8dc;
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
  FilterTrigger,
  TriggerBadge,
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
  SearchContainer,
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
  RangeChip,
  RangeChipRemove,
  MoreChips,
  ChipRemove,
  ClearAllButton
};
