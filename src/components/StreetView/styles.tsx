import styled from "styled-components";

export const StreetViewContainer = styled.div`
  width: 100%;
  height: 300px; /* visible height */
  border-radius: 8px;
  overflow: hidden;
  @media (max-width: 600px) {
    height: 200px;
  }
`;

