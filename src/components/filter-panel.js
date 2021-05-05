import * as React from 'react';
import { useState, useEffect } from 'react';
import styled from 'styled-components';


const StyledFilterPanel = styled.div`
    position: absolute;
    top: 0;
    right: 0;
    background: #f2f2f2;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    padding: 12px 24px;
    margin: 20px;
    line-height: 2;
    outline: none;
    width: -moz-fit-content;
    width: fit-content;
    display: flex;
    flex-direction: row;
    
`;

// box-shadow: 0px -6px 10px rgba(255, 255, 255, 1), 0px 2px 7px rgba(0, 0, 0, 0.15);
const StyledFilterBoxes = styled.span`
    background: white;
    box-shadow: 0px -6px 10px rgba(255, 255, 255, 1), 0px 2px 7px rgba(0, 0, 0, 0.15);
    padding: 12px 24px;
    margin: 10px;
    line-height: 2;
    outline: none;
    display:flex;
    flex-direction: column;
    height: -moz-fit-content;
    height: fit-content;
`;

const StyledCheckBox = styled.input`
    box-shadow: -2px -2px 5px 0px #fff9,
                -1px -1px 2px 0px #fff9,
                2px 2px 5px 0px #0002,
                1px 1px 2px 0px #0001,
                inset 0px 0px 0px 0px #fff9,
                inset 0px 0px 0px 0px #0001,
                inset 0px 0px 0px 0px #fff9,        
                inset 0px 0px 0px 0px #0001;
    height: 15px;
    width: 15px;
    border: none;

    input:checked {
        backgroud-color: green;
    }

    &:active {
        box-shadow:  1px 1px 2px 0 rgba(255,255,255,.5),
                    -1px -1px 2px 0 rgba(116, 125, 136, .2), 
                    inset -1px -1px 2px 0 rgba(255,255,255,.5),
                    inset 1px 1px 2px 0 rgba(116, 125, 136, .3);
    }
`;

const diameterChoices = [ 'Under 6 inches',  '6 to 12 inches', 
                          '12 to 18 inches', '18 to 24 inches',
                          '24 to 30 inches', '30 to 36 inches', 
                          '36 to 42 inches', 'Over 42 inches'];

const heightChoices = [ 'Under 10 feet', '10 to 20 feet',
                        '20 to 30 feet', '30 to 40 feet',
                        '40 to 50 feet', '50 to 60 feet', 
                        '60 to 70 feet', '70 to 80 feet',
                        '80 to 90 feet', '90 to 100 feet',
                        'Over 100 feet'];

// pass the treeFilter setter to this component to set parent state
export function FilterPanel({currentState, updateParent}) {
    const [isExpanded, setIsExpanded] = React.useState(false)
    // make an object with keys from the array, all values are true
    const [diameterBoxState, setDiameterBoxState] = useState(diameterChoices.reduce(
                                                                (acc, curr, i) => (acc[curr]={
                                                                    checked:true,
                                                                    value: (i + 1) * 6}, acc), {}))
    const [heightBoxState, setHeightBoxState] = useState(heightChoices.reduce(
                                                                (acc, curr, i) => (acc[curr]={
                                                                    checked:true, 
                                                                    value: i}, acc), {}))
    
    const handleDiamChange = (event) => {
        setDiameterBoxState({...diameterBoxState, [event.target.id]: {
                                                        checked: event.target.checked, 
                                                        value: parseInt(event.target.value)
                                                    }
                                                });
    }

    const handleHeightChange = (event) => {
        setHeightBoxState({...heightBoxState, [event.target.id]: {
                                                        checked: event.target.checked, 
                                                        value: parseInt(event.target.value)
                                                    }
                                                });
    }

    const handleToggle = () => {
        setIsExpanded(! isExpanded);
    }

    const setFilterState = () => {
        let diameterArray = [];
        let heightArray = [];

        for (const [key, value] of Object.entries(diameterBoxState)) {
            if (value.checked) {
                // need to parse the value to int since the event object 
                diameterArray.push(value.value);  
            }
        }

        for (const [key, value] of Object.entries(heightBoxState)) {
            if (value.checked) {
                heightArray.push(value.value);
            }
        }       
    
        updateParent({...currentState, 
                         diameters: diameterArray.length == 0 ? null : diameterArray,
                         height_ids: heightArray.length == 0? null : heightArray});
    }
    
    useEffect(() => {
        setFilterState();
    }, [heightBoxState, diameterBoxState]);

    var diameterCheckboxes = diameterChoices.map((label, i) => {
        return (
            <label key={i} >
                <input type='checkbox' id={label} value={(i + 1) * 6}
                        onChange={handleDiamChange}/>
                {label}
            </label>
        )
    });
    var heightCheckboxes = heightChoices.map((label, i) => {
        return (
            <label key={i}>
                <input type='checkbox' id={label} value={i} 
                        onChange={handleHeightChange}/>
                {label}
            </label>
        )
    });

    return (
        <StyledFilterPanel>
            <StyledFilterBoxes>
                <b>By tree diameter</b>
                {diameterCheckboxes}
            </StyledFilterBoxes>
            <StyledFilterBoxes>
                <b>By tree height</b>
                {heightCheckboxes}
            </StyledFilterBoxes>
        </StyledFilterPanel>
    )
}