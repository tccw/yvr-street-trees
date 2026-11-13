import styled, { keyframes } from "styled-components";

interface VisibilityProps {
    visible: boolean;
}

const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

const FadedBackground = styled.div<VisibilityProps>`
    position: fixed;
    inset: 0;
    height: 100%;
    width: 100%;
    background: rgba(10, 12, 16, 0.88);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    z-index: 3100;
    display: ${props => props.visible ? "block" : "none"};
    animation: ${fadeIn} 0.18s ease-out;
`;

const CenteredResponsiveContainer = styled.section<VisibilityProps>`
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: 3101;
    width: min(92vw, 960px);
    height: min(80vh, calc(100vh - 120px), 740px);
    @supports (height: 100dvh) {
        height: min(80dvh, calc(100dvh - 120px), 740px);
    }
    @media (max-width: 768px) {
        width: 96vw;
        height: min(74vh, calc(100vh - 130px));
        @supports (height: 100dvh) {
            height: min(74dvh, calc(100dvh - 130px));
        }
    }
    display: ${props => props.visible ? "block" : "none"};
    pointer-events: none;
    animation: ${fadeIn} 0.18s ease-out;
`;

const CarouselContainer = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    pointer-events: none;
`;

const SlideTrack = styled.div`
    display: flex;
    width: 100%;
    height: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
    -ms-overflow-style: none;
    -webkit-overflow-scrolling: touch;
    pointer-events: auto;
    touch-action: pan-x pinch-zoom;

    &::-webkit-scrollbar {
        display: none;
    }
`;

const Slide = styled.div`
    flex: 0 0 100%;
    width: 100%;
    height: 100%;
    scroll-snap-align: center;
    scroll-snap-stop: always;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px 60px;
    box-sizing: border-box;
    user-select: none;

    @media (max-width: 768px) {
        padding: 8px 12px;
    }
`;

const NavigationButton = styled.button`
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(20, 24, 30, 0.65);
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border-radius: 50%;
    width: 44px;
    height: 44px;
    padding: 0;
    cursor: pointer;
    z-index: 12;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
    color: #ffffff;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
    pointer-events: auto;
    -webkit-tap-highlight-color: transparent;

    &:hover {
        background: rgba(255, 255, 255, 0.22);
        border-color: rgba(255, 255, 255, 0.4);
        transform: translateY(-50%) scale(1.06);
    }

    &:active {
        transform: translateY(-50%) scale(0.95);
    }

    &:focus-visible {
        outline: 2px solid rgba(255, 255, 255, 0.7);
        outline-offset: 2px;
    }

    &.prev {
        left: 4px;
    }

    &.next {
        right: 4px;
    }

    @media (max-width: 768px) {
        width: 40px;
        height: 40px;

        &.prev {
            left: 10px;
        }

        &.next {
            right: 10px;
        }
    }
`;

const CloseButton = styled.button`
    position: absolute;
    top: -48px;
    right: 4px;
    background: rgba(255, 255, 255, 0.14);
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    padding: 0;
    cursor: pointer;
    z-index: 13;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
    color: #ffffff;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
    pointer-events: auto;
    -webkit-tap-highlight-color: transparent;

    &:hover {
        background: rgba(255, 255, 255, 0.26);
        border-color: rgba(255, 255, 255, 0.45);
        transform: scale(1.06);
    }

    &:active {
        transform: scale(0.95);
    }

    &:focus-visible {
        outline: 2px solid rgba(255, 255, 255, 0.7);
        outline-offset: 2px;
    }

    @media (max-width: 768px) {
        top: -46px;
        right: 8px;
    }
`;

const ImageCounter = styled.div`
    position: absolute;
    top: -44px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.16);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    color: rgba(255, 255, 255, 0.92);
    padding: 6px 14px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.03em;
    font-variant-numeric: tabular-nums;
    z-index: 12;
    white-space: nowrap;
    pointer-events: auto;
    user-select: none;

    @media (max-width: 768px) {
        top: -42px;
        font-size: 12px;
        padding: 5px 12px;
    }
`;

const IndicatorContainer = styled.div`
    position: absolute;
    bottom: -48px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 2px;
    z-index: 12;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.14);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    pointer-events: auto;

    @media (max-width: 768px) {
        bottom: -44px;
        padding: 3px 8px;
    }
`;

const Indicator = styled.button<{ active: boolean }>`
    width: 28px;
    height: 28px;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    -webkit-tap-highlight-color: transparent;

    &::before {
        content: "";
        width: ${props => props.active ? "20px" : "7px"};
        height: 7px;
        border-radius: 999px;
        background: ${props => props.active ? "#ffffff" : "rgba(255, 255, 255, 0.42)"};
        transition: width 0.25s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.2s ease, transform 0.2s ease;
    }

    &:hover::before {
        background: ${props => props.active ? "#ffffff" : "rgba(255, 255, 255, 0.75)"};
    }

    &:focus-visible {
        outline: 2px solid rgba(255, 255, 255, 0.7);
        outline-offset: 2px;
        border-radius: 999px;
    }
`;

export {
    FadedBackground,
    CenteredResponsiveContainer,
    CarouselContainer,
    SlideTrack,
    Slide,
    NavigationButton,
    CloseButton,
    ImageCounter,
    IndicatorContainer,
    Indicator
};
