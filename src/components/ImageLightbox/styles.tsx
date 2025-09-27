import styled, { keyframes } from "styled-components"

const FadedBackground = styled.div<VisibilityProps>`
    height: 100%;
    width: 100%;
    background-color: black;
    backdrop-filter: blur(10px);
    opacity: 0.8;
    z-index: 10;
    position: fixed;
    top: 0;
    left: 0;
    display: ${props => props.visible? 'block': 'none'}
`

const CenteredResponsiveContainer = styled.section<VisibilityProps>`
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: 11;
    height: auto;
    width: auto;
    max-width: 95vw;
    max-height: 95vh;
    display: ${props => props.visible? 'block': 'none'}
`;

const CarouselContainer = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    height: 100%;
`;

const ImageBorder = styled.section`
    position: relative;
    width: inherit;
    background: white;
    margin: 0 20px;
    color: #6b6b76;
    outline: none;
    display: flex;
    flex-direction: column;
    max-width: 90vw;
    max-height: 80vh;
    overflow: hidden;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
`;

const NavigationButton = styled.button`
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255, 255, 255, 0.9);
    border: none;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    font-size: 24px;
    font-weight: bold;
    cursor: pointer;
    z-index: 12;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    color: #333;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);

    &:hover {
        background: rgba(255, 255, 255, 1);
        transform: translateY(-50%) scale(1.1);
    }

    &:active {
        transform: translateY(-50%) scale(0.95);
    }

    &.prev {
        left: -25px;
    }

    &.next {
        right: -25px;
    }

    @media (max-width: 768px) {
        width: 40px;
        height: 40px;
        font-size: 20px;

        &.prev {
            left: -20px;
        }

        &.next {
            right: -20px;
        }
    }
`;

const CloseButton = styled.button`
    position: absolute;
    top: -15px;
    right: -15px;
    background: rgba(255, 255, 255, 0.9);
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    font-size: 24px;
    font-weight: bold;
    cursor: pointer;
    z-index: 13;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    color: #333;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);

    &:hover {
        background: rgba(255, 255, 255, 1);
        transform: scale(1.1);
    }

    &:active {
        transform: scale(0.95);
    }

    @media (max-width: 768px) {
        top: -10px;
        right: -10px;
        width: 35px;
        height: 35px;
        font-size: 20px;
    }
`;

const spin = keyframes`
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
`;

const LoadingSpinner = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #007bff;
    border-radius: 50%;
    animation: ${spin} 1s linear infinite;
    z-index: 14;
`;

const ImageCounter = styled.div`
    position: absolute;
    top: -40px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
    z-index: 12;
    white-space: nowrap;

    @media (max-width: 768px) {
        top: -35px;
        font-size: 12px;
        padding: 6px 12px;
    }
`;

const IndicatorContainer = styled.div`
    position: absolute;
    bottom: -50px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 8px;
    z-index: 12;

    @media (max-width: 768px) {
        bottom: -40px;
        gap: 6px;
    }
`;

const Indicator = styled.button<{ active: boolean }>`
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: none;
    background: ${props => props.active ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.4)'};
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background: rgba(255, 255, 255, 0.7);
        transform: scale(1.2);
    }

    @media (max-width: 768px) {
        width: 10px;
        height: 10px;
    }
`;

interface VisibilityProps {
    visible: boolean;
}

export {
    FadedBackground,
    ImageBorder,
    CenteredResponsiveContainer,
    NavigationButton,
    CloseButton,
    CarouselContainer,
    LoadingSpinner,
    ImageCounter,
    IndicatorContainer,
    Indicator
};
