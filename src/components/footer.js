import * as React from 'react';
import styled from 'styled-components';
import MapboxLogoWhite from '../../public/mapbox-logo-white.svg'

const Foot = styled.footer`
    position: absolute;
    display: flex;
    width: 100%;
    margin-top: 5px;
    bottom: 0;
    right: 0;
    height: 23px;
    z-index: 3;
    background-color: lightgrey;
`;

const AttributionLink = styled.a`
    vertical-align: middle;    
    flex: 1;
    margin-left: 20px;
    margin-right: 20px;
`;

const MapboxAttributionLogo = styled.a`

`;

const FancyDiv = styled.div`
    background-color: lightgreen;
`;

const Footer = () => {

    let sections = [
        'Species descriptions via Wikipedia CC BY-SA',
        'Open City Data - Vancouver'
    ]

    return (
        <Foot>
            <FancyDiv>
                <img src={MapboxLogoWhite}></img>
                <AttributionLink href='https://opendata.vancouver.ca/pages/licence/'>Species descriptions via Wikipedia CC BY-SA</AttributionLink>
                <AttributionLink href='https://opendata.vancouver.ca/pages/licence/'>Open Government Licence – Vancouver</AttributionLink>
            </FancyDiv>
        </Foot>
    )
}

export default Footer;