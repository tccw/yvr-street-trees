import styled from "styled-components";

// margin order is top right bottom left
const StyledTreeInfo = styled.section`
  position: relative;
  width: inheret;
  background: white;
  margin: 0 20px;
  font-size: 13px;
  line-height: 2;
  color: #6b6b76;
  outline: none;
  display: flex;
  flex-direction: column;
`;

export interface SubTextProps {
  margin_bottom?: number;
  font_size: string | number;
  font_style: string;
}

const StyledSubText = styled.span<SubTextProps>`
  text-align: left;
  color: #63686a;
  margin-left: 20px;
  margin-bottom: ${(props) => (props.margin_bottom ? props.margin_bottom : 0)};
  font-size: ${(props) => props.font_size};
  font-style: ${(props) => props.font_style};
  font-weight: 50;
`;

const TreeDetailsList = styled.ul`
  list-style-type: none;
  flex-grow: 1;
`;

const TreeListElement = styled.li`
  border-bottom: 1px solid lightgrey;
  width: 95%;
  margin-bottom: 0.5rem;
`;

const TreeDetail = styled.div`
  display: flex;
  vertical-align: middle;
`;

const TreeDetailKey = styled.span`
  flex: 1;
  font-weight: bold;
  font-size: 1rem;
  text-align: left;
`;

const TreeDetailValue = styled.span`
  flex: 2;
  font-size: 0.9rem;
  color: darkgreen;
`;

interface CopyButtonProps {
  copied: boolean;
}

const CopyButton = styled.button.attrs((props) => ({
  alt: "copy to clipboard",
  title: "copy to clipboard",
}))<CopyButtonProps>`
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
  opacity: ${(props) => (props.copied ? 1 : 0.3)};
  vertical-align: middle;

  &:hover {
    opacity: 1;
  }
`;

const Blurb = styled.p`
  font-size: 1.1rem;
  line-height: 1.5;
  text-align: justify;
  margin-top: 0px;
  margin-bottom: 60px;
`;

const Description = styled.p`
  color: #63686a;
  margin-left: inheret;
  margin-top: 0;
  margin-bottom: 20px;
  text-align: justify;
`;

const AttributesContainer = styled.div`
    display: flex;
    width: fit-content;
    flex-direction: row;
`

export {
  StyledTreeInfo,
  StyledSubText,
  TreeDetailsList,
  TreeListElement,
  TreeDetail,
  TreeDetailKey,
  TreeDetailValue,
  CopyButton,
  Blurb,
  Description,
  AttributesContainer
};
