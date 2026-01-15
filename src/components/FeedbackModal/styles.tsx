import styled from "styled-components";

interface VisibilityProps {
  visible: boolean;
}

export const ModalOverlay = styled.div<VisibilityProps>`
  height: 100%;
  width: 100%;
  background-color: black;
  backdrop-filter: blur(10px);
  opacity: 0.8;
  z-index: 1100;
  position: fixed;
  top: 0;
  left: 0;
  display: ${(props) => (props.visible ? "block" : "none")};
  cursor: pointer;
`;

export const ModalContainer = styled.section<VisibilityProps>`
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 1101;
  height: auto;
  width: 95vw;
  max-width: 95vw;
  max-height: 95vh;
  display: ${(props) => (props.visible ? "flex" : "none")};
  flex-direction: column;
  align-items: center;
  justify-content: center;

  @media (min-width: 901px) {
    width: auto;
  }
`;

export const ModalContent = styled.div`
  position: relative;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  width: 100%;
  height: 100%;
  max-width: 900px;
  max-height: 95vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @media (max-width: 768px) {
    max-width: 100%;
    max-height: 95vh;
    border-radius: 4px;
  }

  @media (max-width: 600px) {
    max-width: 100vw;
    max-height: 100vh;
    border-radius: 0;
  }
`;

export const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  background: white;
  position: relative;

  @media (max-width: 600px) {
    padding: 16px;
  }
`;

export const ModalTitle = styled.h2`
  margin: 0;
  color: #63686a;
  font-size: 1.5rem;
  font-weight: 500;

  @media (max-width: 600px) {
    font-size: 1.25rem;
  }
`;

export const CloseButton = styled.button`
  background: rgba(0, 0, 0, 0.6);
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;

  &:hover {
    background: rgba(0, 0, 0, 0.8);
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }

  &:focus {
    outline: 2px solid rgba(99, 104, 106, 0.5);
    outline-offset: 2px;
  }

  @media (max-width: 768px) {
    width: 48px;
    height: 48px;
    font-size: 22px;
  }

  @media (max-width: 600px) {
    width: 50px;
    height: 50px;
  }
`;

export const IframeContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  justify-content: center;
  padding: 24px;
  background: #f5f5f5;

  @media (max-width: 768px) {
    padding: 16px;
  }

  @media (max-width: 600px) {
    padding: 8px;
  }
`;

export const StyledIframe = styled.iframe`
  width: 100%;
  max-width: 100%;
  height: 900px;
  border: none;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-width: 640px;

  @media (max-width: 768px) {
    height: 750px;
    min-width: unset;
  }

  @media (max-width: 600px) {
    height: 700px;
    border-radius: 0;
  }
`;
