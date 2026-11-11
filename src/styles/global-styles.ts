import { createGlobalStyle } from 'styled-components'
import styled from 'styled-components'

export const GlobalStyle = createGlobalStyle`
    /* Mapbox geocoder: its dropdown sits inside map controls. The
       POSITION containers (.mapboxgl-ctrl-top-right etc.) have
       z-index: 2 and every .mapboxgl-ctrl gets transform: translate(0),
       which creates a stacking context — so the geocoder's own z-index
       (1, suggestions 1000) could never beat the filter panel's
       z-index 1000 on siblings outside the map. Raise the POSITION
       container instead: the whole stack (input + suggestions dropdown)
       then paints above the panel as one unit, no matter the inner
       z-indexes. Only the top-right slot is raised — the geocoder is
       the only control there (the bottom-right nav/geolocate controls
       stay at z-index 2 and can sit under the panel, e.g. when open
       on mobile).
       (Plugin CSS comes from both @mapbox/mapbox-gl-geocoder v5 JS
       import and the v4.7.2 <link> in index.html — same class names.) */
    .mapboxgl-ctrl-top-right {
        z-index: 3000;
    }

    :root {
        --primary-light: #8abdff;
        --primary: #6d5dfc;
        --primary-dark: #5b0eeb;

        --white: #FFFFFF;
        --greyLight-1: #E4EBF5;
        --greyLight-2: #c8d0e7;
        --greyLight-3: #bec8e4;
        --greyDark: #9baacf;
    }
`;

interface GreyBorderBottomTitleProps {
    margin_bottom?: string;
    font_size?: string;
}

export const GreyBorderBottomTitle = styled.h2<GreyBorderBottomTitleProps>`
    text-align: left;
    color: #63686a;
    margin-left: 0px;
    margin-top: 0px;
    margin-bottom: ${props => props.margin_bottom || '20px'};
    font-size: ${props => props.font_size || 'inherit'};
    border-bottom: 0.2rem solid #63686a;
    width: fit-content;
    display: table;
    line-height: 1.8rem;

    @media (max-width: 600px) {
        font-size: 1.3rem;
    }
`;

interface MobileSafeBottomProps {
    offset?: number;
    right?: number;
}

export const MobileSafeBottom = styled.div<MobileSafeBottomProps>`
    position: fixed;
    right: ${props => props.right || 10}px;
    bottom: ${props => props.offset || 10}px;
    z-index: 1000;

    /* Modern mobile-safe positioning */
    @supports (bottom: env(safe-area-inset-bottom)) {
        bottom: calc(${props => props.offset || 10}px + env(safe-area-inset-bottom));
        padding-bottom: env(safe-area-inset-bottom);
    }

    /* Responsive adjustments for mobile */
    @media (max-width: 600px) {
        right: ${props => (props.right || 10) - 5}px;

        /* Extra padding for mobile browsers that hide/show UI */
        @supports (height: 100dvh) {
            bottom: calc(${props => props.offset || 10}px + env(safe-area-inset-bottom) + 10px);
        }
    }
`;

export const MobileSafeContainer = styled.div`
    height: 100vh;

    /* Use dynamic viewport height for mobile browsers */
    @supports (height: 100dvh) {
        height: 100dvh;
    }

    /* Fallback for browsers without dvh support */
    @supports not (height: 100dvh) {
        @media (max-width: 600px) {
            height: calc(100vh - 60px); /* Account for mobile browser UI */
        }
    }
`;
