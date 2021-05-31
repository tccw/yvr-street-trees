import { createGlobalStyle } from 'styled-components'
import styled from 'styled-components'

const GlobalStyle = createGlobalStyle`
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

export const GreyBorderBottomTitle = styled.h2`
    text-align: left;
    color: #63686a;
    margin-left: 0px;
    margin-top: 0px;
    margin-bottom: ${props => ((props && props.margin_bottom) ? props.margin_bottom : '20px')};
    border-bottom: 0.2rem solid #63686a;
    width: -moz-fit-content;
    width: fit-content;
    display: table; 
    line-height: 1.8rem;
`;
