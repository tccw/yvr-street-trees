import React, { useEffect, useRef } from "react";
import {
  ModalOverlay,
  ModalContainer,
  ModalContent,
  ModalHeader,
  ModalTitle,
  CloseButton,
  IframeContainer,
  StyledIframe,
} from "./styles";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";

      // Focus close button when modal opens
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
    } else {
      // Restore scroll position
      const scrollY = document.body.style.top;
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    }

    return () => {
      // Cleanup on unmount
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <ModalOverlay visible={isOpen} onClick={onClose} />
      <ModalContainer visible={isOpen} role="dialog" aria-modal="true" aria-labelledby="feedback-modal-title">
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <ModalHeader>
            <ModalTitle id="feedback-modal-title">Feedback</ModalTitle>
            <CloseButton
              ref={closeButtonRef}
              onClick={onClose}
              aria-label="Close feedback form"
              title="Close (ESC)"
            >
              ✕
            </CloseButton>
          </ModalHeader>
          <IframeContainer>
            <StyledIframe
              src="https://docs.google.com/forms/d/e/1FAIpQLSe5fRdZUxqBouCzfWCPkDQ0_OL4jTfb8gpsrO4Garc37y48lw/viewform?embedded=true"
              title="Feedback Form"
              loading="lazy"
            >
              Loading…
            </StyledIframe>
          </IframeContainer>
        </ModalContent>
      </ModalContainer>
    </>
  );
};

export default FeedbackModal;
