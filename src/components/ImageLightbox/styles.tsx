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
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
`;

const NavigationButton = styled.button`
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(0, 0, 0, 0.6);
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
    color: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

    &:hover {
        background: rgba(0, 0, 0, 0.8);
        transform: translateY(-50%) scale(1.1);
    }

    &:active {
        transform: translateY(-50%) scale(0.95);
    }

    &:focus {
        outline: 2px solid rgba(255, 255, 255, 0.5);
        outline-offset: 2px;
    }

    &.prev {
        left: 16px;
    }

    &.next {
        right: 16px;
    }

    @media (max-width: 768px) {
        width: 44px;
        height: 44px;
        font-size: 20px;

        &.prev {
            left: 20px;
        }

        &.next {
            right: 20px;
        }
    }

    @media (max-width: 480px) {
        &.prev {
            left: 24px;
        }

        &.next {
            right: 24px;
        }
    }
`;

const CloseButton = styled.button`
    position: absolute;
    top: 16px;
    right: 16px;
    background: rgba(0, 0, 0, 0.6);
    border: none;
    border-radius: 50%;
    width: 44px;
    height: 44px;
    font-size: 24px;
    font-weight: bold;
    cursor: pointer;
    z-index: 13;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    color: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

    &:hover {
        background: rgba(0, 0, 0, 0.8);
        transform: scale(1.1);
    }

    &:active {
        transform: scale(0.95);
    }

    &:focus {
        outline: 2px solid rgba(255, 255, 255, 0.5);
        outline-offset: 2px;
    }

    @media (max-width: 768px) {
        top: 20px;
        right: 20px;
        width: 48px;
        height: 48px;
        font-size: 22px;
    }

    @media (max-width: 480px) {
        top: 24px;
        right: 24px;
        width: 50px;
        height: 50px;
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
    bottom: -60px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 10px;
    z-index: 12;
    padding: 8px 16px;
    border-radius: 20px;
    background: rgba(0, 0, 0, 0.3);

    @media (max-width: 768px) {
        bottom: -50px;
        gap: 8px;
        padding: 6px 12px;
    }

    @media (max-width: 480px) {
        bottom: -45px;
    }
`;

const Indicator = styled.button<{ active: boolean }>`
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: none;
    background: ${props => props.active ? '#72fc5dff' : 'rgba(255, 255, 255, 0.4)'};
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    &::before {
        content: '';
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: ${props => props.active ? 'palegreen' : 'rgba(255, 255, 255, 0.4)'};
        transition: all 0.3s ease;
    }

    &:hover::before {
        background: ${props => props.active ? '#8abdff' : 'rgba(255, 255, 255, 0.7)'};
        transform: scale(1.2);
    }

    &:focus {
        outline: 2px solid rgba(255, 255, 255, 0.5);
        outline-offset: 2px;
    }

    @media (max-width: 768px) {
        &::before {
            width: 8px;
            height: 8px;
        }
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
