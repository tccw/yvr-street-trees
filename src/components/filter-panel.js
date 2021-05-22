import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { titleCase } from '../utils';
import { ChevronCollapse, Filter } from '../svg-icons';
import RangeSlider from './range-slider'


const StyledFilterPanel = styled.div`
    position: absolute;
    top: 65px;
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
    
    border-width: ${props => (props.open ? '0px' : '1px')};
    border-style: ${props => (props.open ? 'none' : 'solid')};
    border-color: ${props => (props.open ? 'none' : 'darkgrey')};
`;

const StyledFilterTogglePane = styled.div`
    position: relative;
    top: 0px;
    right: 0px;
    background: inheret;
    line-height: 2;
    outline: none;
    width: -moz-fit-content;
    width: fit-content;
    display: flex;
    flex-direction: column;
    
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


// pass the treeFilter setter to this component to set parent state
export function FilterPanel({currentState, updateParent, updateSelected, treeNamesAndColors}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [treeCommonNameList, setTreeCommonNameList] = useState(null);
    // make an object with keys from the array, all values are true
    const [selectedTree, setselectedTree] = useState(null);
    const [diameterRange, setDiameterRange] = useState([0, 43]);
    const [heightRange, setHeightRange] = useState([0, 100]);

    const handleToggle = () => {
        setIsExpanded(! isExpanded);
    }

    const setFilterState = () => {
        let diameterArray = diameterRange;
        var heightArray = Array(Math.round((heightRange[1] - heightRange[0]) / 10)).fill(0).map((_, i) => i + (heightRange[0] / 10));
        heightArray.push(heightArray[heightArray.length - 1] + 1);
              
        updateParent({...currentState, 
            diameters: diameterArray.length ? diameterArray: null, // filter to [-1] as no trees will match this
            height_ids: heightArray.length ? heightArray : [-1]});
    }

    // keys in the geojson are uppercase, but title case display is nicer for display
    const handleTreeClick = (event) => {
        updateParent({...currentState, trees: [event.target.textContent.toUpperCase()]})
        updateSelected();
        setselectedTree(event.target.textContent.toUpperCase());
    }
    
    useEffect(() => {
        setFilterState();
    }, [diameterRange, heightRange]);
    
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
                    <TreeEntry key={key} onClick={handleTreeClick}>
                        <Dot color={value.color}></Dot>
                        {titleCase(key)}
                    </TreeEntry>
                )
            }
        }
        setTreeCommonNameList(nameList); 
    }, [treeNamesAndColors, currentState])

    return (
        <StyledFilterPanel open={isExpanded}>
            <StyledFilterTogglePane >
                {isExpanded && 
                    <>
                        <b>By tree name</b>
                        <StyledFilterTrees>
                            { treeCommonNameList && treeCommonNameList}
                        </StyledFilterTrees>
                        <StyledFilterBoxes>
                            <RangeSlider slider_title='Diameter Filter Range (inches)'
                                updateRange={(newValue) => setDiameterRange(newValue)}
                                min_val={0} max_val={43} 
                                curr_range={diameterRange}/>
                            <RangeSlider slider_title='Height Filter Range (feet)'
                                updateRange={(newValue) => setHeightRange(newValue)}
                                min_val={0} max_val={100} 
                                step={10} curr_range={heightRange}/>
                        </StyledFilterBoxes>
                    </>
                }                
            </StyledFilterTogglePane>
            <OpenCloseButton onClick={handleToggle} title={isExpanded ? 'collapse panel' : 'expand panel'}>
                { ! isExpanded && <p style={{'fontSize': '1.2rem', 'margin': '-6px 5px 5px 0px'}}>Filter Map</p> } 
                { isExpanded ? ChevronCollapse : Filter({height: 24, width: 24}) }
            </OpenCloseButton>
        </StyledFilterPanel>
    )
}
