import React, { useState, useEffect, useCallback } from "react";
import CustomCloudinaryImage from "../custom-cloudinary-image";
import {
    CenteredResponsiveContainer,
    FadedBackground,
    ImageBorder,
    NavigationButton,
    CloseButton,
    CarouselContainer,
    LoadingSpinner,
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
    showCounter?: boolean;      // Show image counter (e.g., "3 of 10")
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

    const [currentIndex, setCurrentIndex] = useState(startIndex);
    const [isLoading, setIsLoading] = useState(false);

    // Update current index when startIndex changes
    useEffect(() => {
        setCurrentIndex(startIndex);
    }, [startIndex]);

    // Notify parent of index changes (only when currentIndex changes, not onIndexChange)
    useEffect(() => {
        if (onIndexChange && currentIndex !== startIndex) {
            onIndexChange(currentIndex);
        }
    }, [currentIndex]); // Removed onIndexChange from dependencies to prevent infinite loop

    // Navigation functions
    const goToPrevious = useCallback(() => {
        setIsLoading(true);
        setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? images.length - 1 : prevIndex - 1
        );
        setTimeout(() => setIsLoading(false), 100);
    }, [images.length]);

    const goToNext = useCallback(() => {
        setIsLoading(true);
        setCurrentIndex((prevIndex) =>
            prevIndex === images.length - 1 ? 0 : prevIndex + 1
        );
        setTimeout(() => setIsLoading(false), 100);
    }, [images.length]);

    const goToIndex = useCallback((index: number) => {
        if (index !== currentIndex) {
            setIsLoading(true);
            setCurrentIndex(index);
            setTimeout(() => setIsLoading(false), 100);
        }
    }, [currentIndex]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!isVisible) return;

            switch (event.key) {
                case 'ArrowLeft':
                    event.preventDefault();
                    goToPrevious();
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    goToNext();
                    break;
                case 'Escape':
                    event.preventDefault();
                    onClose();
                    break;
            }
        };

        if (isVisible) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isVisible, goToPrevious, goToNext, onClose]);

    // Don't render if no images or not visible
    if (!images.length || !isVisible) {
        return null;
    }

    const currentImage = images[currentIndex];
    const hasMultipleImages = images.length > 1;

    return (
        <>
            <FadedBackground visible={isVisible} onClick={onClose} />
            <CenteredResponsiveContainer visible={isVisible}>
                <CarouselContainer>
                    <CloseButton onClick={onClose} aria-label="Close lightbox">
                        ×
                    </CloseButton>

                    {showCounter && hasMultipleImages && (
                        <ImageCounter>
                            {currentIndex + 1} of {images.length}
                        </ImageCounter>
                    )}

                    <ImageBorder onClick={(e) => e.stopPropagation()}>
                        {isLoading && <LoadingSpinner />}
                        <CustomCloudinaryImage
                            key={`${currentImage}-${currentIndex}`} // Force re-render to fix stale image bug
                            cloudImageId={currentImage}
                        />
                    </ImageBorder>

                    {hasMultipleImages && (
                        <>
                            <NavigationButton
                                className="prev"
                                onClick={goToPrevious}
                                aria-label="Previous image"
                            >
                                ‹
                            </NavigationButton>
                            <NavigationButton
                                className="next"
                                onClick={goToNext}
                                aria-label="Next image"
                            >
                                ›
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
