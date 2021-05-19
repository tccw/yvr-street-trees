import { feature } from '@turf/helpers';
import * as React from 'react'
import { useState } from 'react'
import styled from 'styled-components'
import { ChevronRight, ChevronLeft } from '../svg-icons'


const Panel = styled.div`
    position: fixed;
    z-index: 2;
    top: 0;
    left: 0;
    bottom: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    background-color: white;
    color:black;
    overflow: hidden;
    overflow-y: auto;
    transition: ease-in-out 0.3s;
    width: ${props => (props.open ? '500px' : '0px')};

    @media (max-width: 1200px) {
        width: 35%;
        min-width 250px;
    }
`;

const Title = styled.h1`
    text-align: left;
    color: #63686a;
    margin: 0 20px 5px 20px;
    border-bottom: 0.5rem solid palegreen;
    width: -moz-fit-content;
    width: fit-content;
    display: table; 
    text-transform: capitalize;
`;

const Dot = styled.div`
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background-color: ${props => (props.color)};
    display: inline-block;
    margin-left: 0.5rem;
    vertical-align: middle;
`;

const OpenCloseButton = styled.button `
    all: unset;
    display: flex;
    cursor: pointer;
    position: relative;
    border-radius: 20%;
    align-self: flex-end;
    height: -moz-fit-content;
    height: fit-content;
    width: -moz-fit-content;
    width: fit-content;
    opacity: 0.6;
    margin: 0.3rem;

    &:hover {
        opacity: 1;
    }
`;

const OpenFlagContainer = styled.div`
    position: fixed;
    z-index: 1;
    top: 0;
    left: 0;
    height: -moz-fit-content;
    height: fit-content;
    width: -moz-fit-content;
    width: fit-content;
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: white;
    color:black;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
`;

function InfoPanel(props) {
    const [isExpanded, setIsExpanded] = useState(true); 

    const handleToggle = () => {
        setIsExpanded(! isExpanded);
    };

    return (
        <>
            <Panel open={isExpanded}>
                <OpenCloseButton onClick={handleToggle} title='collapse panel'>
                    {ChevronLeft}
                </OpenCloseButton>
                        <Title>
                            {props.title}
                            {props.color && <Dot color={props.color}></Dot>} 
                        </Title>                 
                    {props.children}
            </Panel>
            {! isExpanded && 
                <OpenFlagContainer>
                    <OpenCloseButton onClick={handleToggle} title='expand panel'>
                        {ChevronRight}
                    </OpenCloseButton>
                </OpenFlagContainer>
            }            
        </>
    )
}

export default InfoPanel;