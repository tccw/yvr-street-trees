import * as React from 'react';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { titleCase } from '../utils';
import { ChevronCollapse, Filter, Info } from '../svg-icons';
import RangeSlider from './range-slider';
import Select from 'react-select';
import { GreyBorderBottomTitle } from '../styles/global-styles';
import { boundaryTrasitionZoomLevel } from '../styles/map-styles';


const StyledFilterPanel = styled.div`
    z-index: 4;
    position: absolute;
    top: 45px;
    right: 0;
    background: #f2f2f2;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    padding: 12px 24px;
    margin: 20px;
    line-height: 2;
    outline: none;
    width: -moz-fit-content;
    width: fit-content;
    max-width: 350px;
    height: -moz-fit-content;
    height: fit-content;
    overflow: hidden;
    display: flex;
    flex-direction: row;

    border-radius: ${props => (props.open ? '8px' : '4px')};
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
    background: ${(props) => (props.color ? props.color : 'white')};
    box-shadow: 0px -6px 10px rgba(255, 255, 255, 1), 0px 2px 7px rgba(0, 0, 0, 0.15);
    padding: 12px 24px;
    margin: 5px;
    line-height: 2;
    outline: none;
    display:flex;
    flex-direction: column;
    height: -moz-fit-content;
    height: fit-content;
    max-width: 90%;
    border-radius: 4px;
`;

const Dot = styled.div`
    height: 13px;
    width: 13px;
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

const LegendLabel = styled.span`
    text-align: left;
    color: #63686a;
    margin-left: 0px;
    margin-top: 0px;
    margin-bottom: 0px;
    width: -moz-fit-content;
    width: fit-content;
    display: table;
    line-height: 1.8rem;
    font-size: 1rem;
    font-weight: 600;

    @media (max-width: 600px) {
        font-size: 0.8rem;
        line-height: 1rem;
    }
`;

const SelectEntry = styled.li`
    list-style-type: none;
    color: #63686a;
    font-size: 0.9rem;
    line-height: 1rem;

    @media (max-width: 360px) {
        font-size: 0.7rem;
    }
`;

const ZoomLink = styled.a`
    color: #2193b9;
`;

const [diamMIN, heightMIN] = [0, 0] ;
const [diamMAX, heightMAX] = [42, 100];
const INFO_COLOR = '#a6e9ff'

// pass the treeFilter setter to this component to set parent state
export function FilterPanel(props) {
    const {currentState, updateParent, updateSelected, treeNamesAndColors, defaultValue, setDefaultValue, currentZoom, zoomIn} = props

    const [isExpanded, setIsExpanded] = useState(false);
    const [treeCommonNameList, setTreeCommonNameList] = useState(null);
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
                        <SelectEntry key={value}>
                             <Dot color={value.color}></Dot> {titleCase(key)}
                        </SelectEntry>
                        ),
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
                                unit='in' step={6} curr_range={diameterRange}
                                disabled={(currentZoom <= boundaryTrasitionZoomLevel)}/>
                            <LegendLabel>  By Height Range (feet) </LegendLabel>
                            <RangeSlider
                                updateRange={(newValue) => setHeightRange(newValue)}
                                min_val={0} max_val={100}
                                unit='ft' step={10} curr_range={heightRange}
                                disabled={(currentZoom <= boundaryTrasitionZoomLevel)}/>
                        </StyledFilterBoxes>
                        { (currentZoom <= boundaryTrasitionZoomLevel) &&
                            <StyledFilterBoxes color={INFO_COLOR}>
                                <div style={{"width": "-moz-fit-content",
                                             "width": "fit-content",
                                             "height": "-moz-fit-content",
                                             "height": "fit-content"}}>
                                    {Info} <b>Height and Diameter Filtering Disabled</b> Please {<ZoomLink onClick={zoomIn} href='#'>zoom</ZoomLink>} in to use filters.
                                </div>
                            </StyledFilterBoxes>
                        }
                        {(currentZoom <= boundaryTrasitionZoomLevel) && (currentState.trees) && (currentState.trees.length > 4) &&
                            <StyledFilterBoxes color={INFO_COLOR}>
                            <div style={{"width": "-moz-fit-content",
                                         "width": "fit-content",
                                         "height": "-moz-fit-content",
                                         "height": "fit-content"}}>
                                {Info} <b>Trees filter</b> currently supports a <b>max of 4 when zoomed out</b>. {<ZoomLink onClick={zoomIn} href='#'>Zoom</ZoomLink>} or remove trees from the filter.
                            </div>
                        </StyledFilterBoxes>
                        }
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
