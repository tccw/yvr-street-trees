import * as React from 'react';
import styled from 'styled-components';
import MapboxLogoWhite from '../../public/mapbox-logo-white.svg'

// TODO: determine why 100% width creates problems for the MapGL component height
const Foot = styled.footer`
    position: absolute;
    overflow: hidden;
    width: 99.85%;
    bottom: 0;
    height: 1.6em;
    z-index: 3;
    background-color: lightgrey;
    display: grid;
    text-align: center;
    vertical-align: middle;

    @media (min-width: 950px) {
        grid-template-areas:
        'feedback attribution copyright';
    }
    @media (max-width: 950px) {
        height: 4.5em;
        text-align: left;
        grid-template-areas:
            'feedback'
            'attribution'
            'copyright';
    }
    @media (max-width: 650px) {
        font-size: 0.7em;
    }
`;

const AttributionLink = styled.a`
    vertical-align: bottom;
    flex: 1;
    margin-top: 5px;
    margin-right: 20px;
    margin-left: 20px;
    text-decoration: none;
    :link, :visited {
        color: white;
    }
    :hover {
        text-decoration: underline;
    }
`;

const MapboxLogo = styled.img`
    vertical-align: middle;
    width: 100px;
    height: 18px;
    opacity: 0.7;
`;

const FancyDiv = styled.div`
    background-color: ${(props) => (props.color)};
    grid-area: ${(props) => (props.name)};
    padding: 3px 6px;
`;

const Footer = () => {

    let sections = [
        'Species descriptions via Wikipedia CC BY-SA',
        'Open City Data - Vancouver'
    ]

    return (
        <Foot>
            <FancyDiv color='#80b918' name='attribution'>
                <AttributionLink href='https://www.mapbox.com/about/maps' target="_blank" rel="noreferror noopener">
                    <MapboxLogo src={MapboxLogoWhite}/>
                </AttributionLink>
                <AttributionLink href='https://en.wikipedia.org/wiki/Wikipedia:Text_of_Creative_Commons_Attribution-ShareAlike_3.0_Unported_License' target="_blank" rel="noreferror noopener">
                    Wikipedia CC BY-SA 3.0</AttributionLink>
                <AttributionLink href='https://opendata.vancouver.ca/pages/licence/' target="_blank" rel="noreferror noopener">
                    Open Government Licence – Vancouver</AttributionLink>
            </FancyDiv>
            <FancyDiv color='grey' name='feedback'>
                {/* FEEDBACK PLACEHOLDER */}
            </FancyDiv>
            <FancyDiv color='lightblue' name = 'copyright'>
                <AttributionLink href=''>© 2021</AttributionLink>
            </FancyDiv>
        </Foot>
    )
}

export default Footer;