import { feature } from '@turf/helpers';
import * as React from 'react'
import { useState } from 'react'
import styled from 'styled-components'
// import * as componentStyles from '../cssmodules/infopanel.module.css'

const Title = styled.h1`
    text-align: left;
    color: #63686a;
    margin: 20px;
    border-bottom: 0.5rem solid palegreen;
    width: -moz-fit-content;
    width: fit-content;
    display: table; 
`;

const Panel = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: #fffef7;
    color:black;
    overflow: hidden;
    transition: ease-in-out 0.3s;
    width: ${props => (props.open ? '500px' : '0px')};

    @media (max-width: 1200px) {
        width: 35%;
        min-width 250px;
    }
`;

const Button = styled.button`
    margin: 5px;
    width: 15rem;
    height: 4rem;
    border-radius: 1rem;
    box-shadow: .3rem .3rem .6rem #c8d0e7, -.2rem -.2rem .5rem white;
    justify-self: center;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: .3s ease;
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

function InfoPanel(props) {
    const [isExpanded, setIsExpanded] = useState(true); 

    const handleToggle = () => {
        setIsExpanded(! isExpanded);
    };

    return (
        <>
            <Panel open={isExpanded}>
                <Button onClick={handleToggle}>Gary</Button>
                        <Title>
                            {props.title}
                            {props.color && <Dot color={props.color}></Dot>} 
                        </Title>
                                           
                    {props.children}
            </Panel>
            {/* temporary toggle button */}
            {! isExpanded && 
                <button className="collapsedtoggle" onClick={handleToggle}>Toggle</button>
            }            
        </>
    )
}

export default InfoPanel;