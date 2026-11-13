import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CustomCloudinaryImage from "../custom-cloudinary-image";
import {
    CenteredResponsiveContainer,
    FadedBackground,
    SlideTrack,
    Slide,
    NavigationButton,
    CloseButton,
    CarouselContainer,
    ImageCounter,
    IndicatorContainer,
    Indicator
} from "./styles";

interface ImageLightboxProps {
    images: string[];           // Array of image IDs/URLs
    startIndex: number;         // Initial image index
    isVisible: boolean;         // Visibility state
    onClose: () => void;        // Close handler
    onIndexChange?: (index: number) => void; // Optional index change callback
    showIndicators?: boolean;   // Show dot indicators
    showCounter?: boolean;      // Show image counter (e.g., "3 / 10")
}

const ImageLightbox = (props: ImageLightboxProps) => {
    const {
        images,
        startIndex,
        isVisible,
        onClose,
        onIndexChange,
        showIndicators = true,
        showCounter = true
    } = props;

    const safeStartIndex = Math.max(0, Math.min(images.length - 1, startIndex || 0));
    const [currentIndex, setCurrentIndex] = useState(safeStartIndex);
    const trackRef = useRef<HTMLDivElement | null>(null);
    const currentIndexRef = useRef(safeStartIndex);
    const programmaticTargetRef = useRef<number | null>(null);
    const programmaticTimerRef = useRef<number | null>(null);

    const clearProgrammaticLock = useCallback(() => {
        programmaticTargetRef.current = null;
        if (programmaticTimerRef.current !== null) {
            window.clearTimeout(programmaticTimerRef.current);
            programmaticTimerRef.current = null;
        }
    }, []);

    // Jump instantaneously to startIndex when the lightbox opens
    useLayoutEffect(() => {
        if (!isVisible || !images.length) return;
        const target = Math.max(0, Math.min(images.length - 1, startIndex || 0));
        clearProgrammaticLock();
        currentIndexRef.current = target;
        setCurrentIndex(target);

        const el = trackRef.current;
        if (el && el.clientWidth > 0) {
            el.scrollLeft = target * el.clientWidth;
        }
    }, [isVisible, images.length, clearProgrammaticLock]);

    // If startIndex is updated externally while already visible, sync to it
    useEffect(() => {
        if (!isVisible || !images.length) return;
        const target = Math.max(0, Math.min(images.length - 1, startIndex || 0));
        if (target !== currentIndexRef.current) {
            currentIndexRef.current = target;
            setCurrentIndex(target);
            const el = trackRef.current;
            if (el && el.clientWidth > 0) {
                el.scrollTo({ left: target * el.clientWidth, behavior: "auto" });
            }
        }
    }, [startIndex, isVisible, images.length]);

    // Keep active slide aligned if the viewport resizes or rotates
    useEffect(() => {
        if (!isVisible) return;
        const handleResize = () => {
            const el = trackRef.current;
            if (el && el.clientWidth > 0) {
                el.scrollLeft = currentIndexRef.current * el.clientWidth;
            }
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [isVisible]);

    useEffect(() => {
        return () => clearProgrammaticLock();
    }, [clearProgrammaticLock]);

    const scrollToSlide = useCallback(
        (targetIndex: number) => {
            if (!images.length) return;
            const clamped = Math.max(0, Math.min(images.length - 1, targetIndex));
            currentIndexRef.current = clamped;
            setCurrentIndex(clamped);
            onIndexChange?.(clamped);

            const el = trackRef.current;
            if (el && el.clientWidth > 0) {
                clearProgrammaticLock();
                programmaticTargetRef.current = clamped;
                el.scrollTo({
                    left: clamped * el.clientWidth,
                    behavior: "smooth"
                });
                programmaticTimerRef.current = window.setTimeout(() => {
                    programmaticTargetRef.current = null;
                    programmaticTimerRef.current = null;
                }, 450);
            }
        },
        [images.length, onIndexChange, clearProgrammaticLock]
    );

    const goToPrevious = useCallback(() => {
        const prevIndex =
            currentIndexRef.current === 0 ? images.length - 1 : currentIndexRef.current - 1;
        scrollToSlide(prevIndex);
    }, [images.length, scrollToSlide]);

    const goToNext = useCallback(() => {
        const nextIndex =
            currentIndexRef.current === images.length - 1 ? 0 : currentIndexRef.current + 1;
        scrollToSlide(nextIndex);
    }, [images.length, scrollToSlide]);

    const goToIndex = useCallback(
        (index: number) => {
            if (index !== currentIndexRef.current) {
                scrollToSlide(index);
            }
        },
        [scrollToSlide]
    );

    const handleScroll = useCallback(() => {
        const el = trackRef.current;
        if (!el || el.clientWidth <= 0) return;

        if (programmaticTargetRef.current !== null) {
            const targetLeft = programmaticTargetRef.current * el.clientWidth;
            if (Math.abs(el.scrollLeft - targetLeft) < 4) {
                clearProgrammaticLock();
            }
            return;
        }

        const rawIndex = Math.round(el.scrollLeft / el.clientWidth);
        const nextIndex = Math.max(0, Math.min(images.length - 1, rawIndex));
        if (nextIndex !== currentIndexRef.current) {
            currentIndexRef.current = nextIndex;
            setCurrentIndex(nextIndex);
            onIndexChange?.(nextIndex);
        }
    }, [images.length, onIndexChange, clearProgrammaticLock]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!isVisible) return;

            switch (event.key) {
                case "ArrowLeft":
                    event.preventDefault();
                    goToPrevious();
                    break;
                case "ArrowRight":
                    event.preventDefault();
                    goToNext();
                    break;
                case "Escape":
                    event.preventDefault();
                    onClose();
                    break;
            }
        };

        if (isVisible) {
            document.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isVisible, goToPrevious, goToNext, onClose]);

    if (!images.length || !isVisible) {
        return null;
    }

    const hasMultipleImages = images.length > 1;

    return (
        <>
            <FadedBackground visible={isVisible} onClick={onClose} />
            <CenteredResponsiveContainer visible={isVisible}>
                <CarouselContainer>
                    <CloseButton onClick={onClose} aria-label="Close lightbox">
                        <CloseRoundedIcon fontSize="medium" />
                    </CloseButton>

                    {showCounter && hasMultipleImages && (
                        <ImageCounter>
                            {currentIndex + 1} / {images.length}
                        </ImageCounter>
                    )}

                    <SlideTrack
                        ref={trackRef}
                        onScroll={handleScroll}
                        onTouchStart={clearProgrammaticLock}
                        onPointerDown={clearProgrammaticLock}
                        onWheel={clearProgrammaticLock}
                    >
                        {images.map((imageId, index) => (
                            <Slide
                                key={`${imageId}-${index}`}
                                onClick={(e) => {
                                    if (e.target === e.currentTarget) {
                                        onClose();
                                    }
                                }}
                            >
                                <CustomCloudinaryImage
                                    cloudImageId={imageId}
                                    fillContainer
                                />
                            </Slide>
                        ))}
                    </SlideTrack>

                    {hasMultipleImages && (
                        <>
                            <NavigationButton
                                className="prev"
                                onClick={goToPrevious}
                                aria-label="Previous image"
                            >
                                <ChevronLeftRoundedIcon fontSize="large" />
                            </NavigationButton>
                            <NavigationButton
                                className="next"
                                onClick={goToNext}
                                aria-label="Next image"
                            >
                                <ChevronRightRoundedIcon fontSize="large" />
                            </NavigationButton>
                        </>
                    )}

                    {showIndicators && hasMultipleImages && (
                        <IndicatorContainer>
                            {images.map((_, index) => (
                                <Indicator
                                    key={index}
                                    active={index === currentIndex}
                                    onClick={() => goToIndex(index)}
                                    aria-label={`Go to image ${index + 1}`}
                                />
                            ))}
                        </IndicatorContainer>
                    )}
                </CarouselContainer>
            </CenteredResponsiveContainer>
        </>
    );
};

export default ImageLightbox;
