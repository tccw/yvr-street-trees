import styled from "styled-components";

const StatsSection = styled.section`
  margin: 0 20px;
`;

const StatsHeader = styled.h2`
  text-align: left;
  color: #63686a;
  margin-left: 0px;
  margin-bottom: 20px;
  border-bottom: 0.2rem solid #63686a;
  width: -moz-fit-content;
  width: fit-content;
  display: table;
  text-transform: capitalize;
`;

const Description = styled.p`
  color: #63686a;
  margin-left: inheret;
  margin-top: 0;
  margin-bottom: 20px;
  text-align: justify;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin-bottom: 50px;
`;

const StatsGridItem = styled.div`
  margin: 10px;
`;

const StyledStat = styled.p`
  color: darkgreen;
  font-size: 1.5rem;
  line-height: 1.5rem;
  font-weight: bold;
  margin: 0;
`;

interface StatsSubtitleProps {
  weight?: string;
  fontSize?: number;
  color?: string;
}

const StatsSubtitle = styled.span<StatsSubtitleProps>`
  color: ${(props) => (props.color ? props.color : "#63686a")};
  font-weight: ${(props) => (props.weight ? props.weight : "bold")};
  font-size: ${(props) => (props.fontSize ? props.fontSize : "1")}rem;
`;

export {
  StatsSection,
  StatsHeader,
  Description,
  StatsGrid,
  StatsGridItem,
  StyledStat,
  StatsSubtitle,
};
