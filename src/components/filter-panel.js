import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { titleCase } from '../utils'
import { ChevronCollapse, Filter } from '../svg-icons'


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
    height: -moz-fit-content;
    height: fit-content;
    overflow: hidden;
    display: flex;
    flex-direction: row;
    
    border-width: ${props => (props.open ? '0px' : '2px')};
    border-style: ${props => (props.open ? 'none' : 'solid')};
    border-color: ${props => (props.open ? 'none' : 'palegreen')};
`;

const StyledFilterTogglePane = styled.div`
    position: relative;
    top: 0;
    right: 0;
    background: inheret;
    line-height: 2;
    outline: none;
    width: -moz-fit-content;
    width: fit-content;
    display: flex;
    flex-direction: row;
    
`;

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

const StyledFilterTrees = styled.span`
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
    max-height: 380px;
    overflow: scroll;
    text-transform: capitalize; 
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
    cursor: pointer;
    height: 15px;
    width: 15px;
    border: none;

    :checked {
        backgroud-color: green;
    }
    ::before, ::after {
        margin: 0;
        padding: 0;
        box-sizing: inherit;
    }

    &:active {
        box-shadow:  1px 1px 2px 0 rgba(255,255,255,.5),
                    -1px -1px 2px 0 rgba(116, 125, 136, .2), 
                    inset -1px -1px 2px 0 rgba(255,255,255,.5),
                    inset 1px 1px 2px 0 rgba(116, 125, 136, .3);
    }
`;

const Dot = styled.div`
    height: 15px;
    width: 15px;
    border-radius: 50%;
    background-color: ${props => (props.color)};
    display: inline-block;
    margin-right: 0.5rem;
    margin-left: 0.5rem;
    vertical-align: middle;
`;

const TreeEntry = styled.li`
    list-style-type: none;
    background-color: ${props => (props.selected ? 'inheret' : 'inheret')};
    color: ${props => (props.selected ? 'inheret' : 'inheret')};
    &:hover {
        cursor: pointer;
        background-color: rgba(0, 0, 0, 0.1);
    }
`;

const OpenCloseButton = styled.button`
    all: unset;
    display: flex;
    cursor: pointer;
    position: relative;
    border-radius: 50%;
    justify-content: flex-end;
    height: -moz-fit-content;
    height: fit-content;
    width: -moz-fit-content;
    width: fit-content;
    opacity: 0.6;
    margin: -8px -20px -20px 0px;


    &:hover {
        opacity: 1;
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
export function FilterPanel({currentState, updateParent, updateSelected, treeNamesAndColors}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [treeCommonNameList, setTreeCommonNameList] = useState(null);
    // make an object with keys from the array, all values are true
    const [diameterBoxState, setDiameterBoxState] = useState(diameterChoices.reduce(
                                                                (acc, curr, i) => (acc[curr]={
                                                                    checked:true,
                                                                    value: (i + 1) * 6}, acc), {}));
    const [heightBoxState, setHeightBoxState] = useState(heightChoices.reduce(
                                                                (acc, curr, i) => (acc[curr]={
                                                                    checked:true, 
                                                                    value: i}, acc), {}));
    const [selectedTree, setselectedTree] = useState(null);
                                                

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
                diameterArray.push(value.value);  
            }
        }

        for (const [key, value] of Object.entries(heightBoxState)) {
            if (value.checked) {
                heightArray.push(value.value);
            }
        }       
    
        updateParent({...currentState, 
                         diameters: diameterArray.length ? diameterArray: [-1], // filter to [-1] as no trees will match this
                         height_ids: heightArray.length ? heightArray : [-1]});
    }

    // keys in the geojson are uppercase, but title case display is nicer
    const handleTreeClick = (event) => {
        updateParent({... currentState, trees: [event.target.textContent.toUpperCase()]})
        updateSelected();
        setselectedTree(event.target.textContent.toUpperCase());
    }
    


    useEffect(() => {
        setFilterState();
    }, [heightBoxState, diameterBoxState]);


    // https://medium.com/@colebemis/building-a-checkbox-component-with-react-and-styled-components-8d3aa1d826dd
    // for fancy checkboxes
    let diameterCheckboxes = diameterChoices.map((label, i) => {
        return (
            <label key={i} >
                <input type='checkbox' id={label} value={(i + 1) * 6}
                        onChange={handleDiamChange} checked={diameterBoxState[label].checked}/>
                {label}
            </label>
        )
    });

    let heightCheckboxes = heightChoices.map((label, i) => {
        return (
            <label key={i}>
                <input type='checkbox' id={label} value={i} 
                        onChange={handleHeightChange} checked={heightBoxState[label].checked}/>
                {label}
            </label>
        )
    });

    
    /**
     * Only have the build the list once, but the "selected" prop doesn't matter because the 
     * element is not re-rendered by react since it never changes. Will need another solution
     * to deal with highlighting.
     */
    useEffect(() => {
        if (treeNamesAndColors) {
            var nameList = [];
            for (const [key, value] of Object.entries(treeNamesAndColors)) {
                nameList.push(
                    <TreeEntry key={key} onClick={handleTreeClick} 
                            selected={Boolean(key === selectedTree)}>
                        <Dot color={value.color}></Dot>
                        {titleCase(key)}
                    </TreeEntry>
                )
            }
        }

        setTreeCommonNameList(nameList); 

    }, [treeNamesAndColors])

    return (
        <StyledFilterPanel open={isExpanded}>
            <StyledFilterTogglePane >
                {isExpanded && 
                    <>
                        <StyledFilterBoxes>
                        <b>By tree diameter</b>
                        {diameterCheckboxes}
                        </StyledFilterBoxes>
                        <StyledFilterBoxes>
                            <b>By tree height</b>
                            {heightCheckboxes}
                        </StyledFilterBoxes>
                        <StyledFilterTrees>
                            <b>By tree name</b>
                            { treeCommonNameList && treeCommonNameList}
                        </StyledFilterTrees>
                    </>
                }                
            </StyledFilterTogglePane>
            <OpenCloseButton onClick={handleToggle} title={isExpanded ? 'collapse panel' : 'expand panel'}>
                { ! isExpanded && <p style={{'font-size': '1.2rem', 'margin': '-6px 5px 5px 0px'}}>Filter Map</p> } 
                { isExpanded ? ChevronCollapse : Filter }
            </OpenCloseButton>
        </StyledFilterPanel>
    )
}