import styled from "styled-components"

const FadedBackground = styled.div`
    height: 100%;
    width: 100%;
    background-color: black;
    backdrop-filter: blur(10px);
    opacity: 0.8;
    z-index: 10;
    position: absolute;
    top: 0;
    left: 0;
    /* position: absolute;
  width: inheret;
  background: black;
  margin: 0 20px;
  font-size: 13px;
  line-height: 2;
  color: #6b6b76;
  outline: none;
  display: flex;
  flex-direction: column;
  top: 0;
  left: 0; */
`

const CentralImage = styled.div`
    position: relative;
    width: inheret;
    margin: 20px;
    display: flex;
    flex-direction: column;
    opacity: 1 !important;
`

export { FadedBackground, CentralImage };
