import styled from "styled-components";

const ImageGrid = styled.section`
  margin: 1rem;
  margin-bottom: 3rem;
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: 1fr 1fr;
`;

const ImageWrap = styled.div`
//   overflow: hidden;
  height: 0;
  padding: 50% 0;
  position: relative;
`;

const WrappedImage = styled.img`
  min-width: 100%;
  min-height: 100%;
  max-width: 150%;
  position: absolute;
  top: 50%;
  left: 50%;
  -webkit-transform: translate(-50%, -50%);
  -ms-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
`;

export { ImageGrid, ImageWrap, WrappedImage };
