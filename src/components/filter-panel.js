import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { titleCase } from '../utils';
import { ChevronCollapse, Filter } from '../svg-icons';
import RangeSlider from './range-slider';
import Select from 'react-select';
import { GreyBorderBottomTitle } from '../styles/global-styles'

// width: -moz-fit-content;
//     width: fit-content;
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
    max-width: 450px;
    height: -moz-fit-content;
    height: fit-content;
    overflow: hidden;
    display: flex;
    flex-direction: row;
    
    border-width: ${props => (props.open ? '0px' : '1px')};
    border-style: ${props => (props.open ? 'none' : 'solid')};
    border-color: ${props => (props.open ? 'none' : 'darkgrey')};
    min-height: ${props => (props.open ? '475px' : 'none')};
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

const LegendLabel = styled.h4`
    text-align: left;
    color: #63686a;
    margin-left: 0px;
    margin-top: 0px;
    margin-bottom: 0px;
    width: -moz-fit-content;
    width: fit-content;
    display: table; 
    line-height: 1.8rem;
`;

const [diamMIN, heightMIN] = [0, 0] ;
const [diamMAX, heightMAX] = [42, 100];

// pass the treeFilter setter to this component to set parent state
export function FilterPanel({currentState, updateParent, updateSelected, treeNamesAndColors, defaultValue, setDefaultValue}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [treeCommonNameList, setTreeCommonNameList] = useState(null);
    // make an object with keys from the array, all values are true
    const [selectedTree, setselectedTree] = useState(null);
    const [diameterRange, setDiameterRange] = useState([diamMIN, diamMAX]);
    const [heightRange, setHeightRange] = useState([heightMIN, heightMAX]);

    const handleToggle = () => {
        setIsExpanded(! isExpanded);
    }

    const setFilterState = () => {
        var heightArray = Array(Math.round((heightRange[1] - heightRange[0]) / 10) + 1).fill(0).map((_, i) => i + (heightRange[0] / 10));
        updateParent({...currentState, diameters: diameterRange, height_ids: heightArray});
    }

    // keys in the geojson are uppercase, but title case display is nicer for display
    const handleTreeClick = (selection) => {
        updateParent({...currentState, trees: selection.length ? selection.map((entry) => (entry.value)) : null})
        setDefaultValue(selection); // helps persist through collapses but now is not synchronized with other filtering options
        updateSelected();
        // setselectedTree(event.target.textContent.toUpperCase());
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
                    {
                        label: (
                        <>
                            <Dot color={value.color}></Dot> {titleCase(key)}
                        </>),
                        value: key
                    }
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
                        <GreyBorderBottomTitle margin_bottom='10px' font_size='1.3rem'>
                                Filter by Species, Trunk Diameter, and Tree Height
                            </GreyBorderBottomTitle>
                        <StyledFilterBoxes>
                            <LegendLabel> By Species (Common Name) </LegendLabel>
                            <Select 
                                key={defaultValue} // using key to force update https://github.com/facebook/react/issues/4101#issuecomment-243625941
                                options={treeCommonNameList}
                                isMulti
                                onChange={handleTreeClick}
                                defaultValue={defaultValue}
                            />
                        </StyledFilterBoxes>
                        <StyledFilterBoxes>
                            <LegendLabel> By Diameter Range (inches)</LegendLabel>
                            <RangeSlider 
                                updateRange={(newValue) => setDiameterRange(newValue)}
                                min_val={0} max_val={42}
                                unit='in' step={6} curr_range={diameterRange}/>
                            <LegendLabel>  By Height Range (feet) </LegendLabel>
                            <RangeSlider
                                updateRange={(newValue) => setHeightRange(newValue)}
                                min_val={0} max_val={100} 
                                unit='ft' step={10} curr_range={heightRange}/>
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
