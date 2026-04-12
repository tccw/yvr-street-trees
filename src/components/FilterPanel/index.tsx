import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { boundaryTrasitionZoomLevel } from "../../styles/map-styles.js";
import { ChevronCollapse, Filtered, Info } from "../../svg-icons.js";
import { titleCase } from "../../utils/utils.js";
import { Slider } from "@mui/material";
import {
    Dot,
  Filter,
  GreyBorderBottomTitle,
  LegendLabel,
  OpenCloseButton,
  SelectEntry,
  StyledFilterBoxes,
  StyledFilterPanel,
  StyledFilterTogglePane,
  ZoomLink,
} from "./styles";


interface FilterPanelProps {
  updateParent: (filterObject: any) => void;
  currentFilterObject: any;
  treeNamesAndColors: object;
  updateSelected: any;
  selected: any;
  currentZoom: number;
  zoomIn: any;
}

interface SelectOption {
    label: JSX.Element;
    value: string;
}

const INFO_COLOR = '#a6e9ff';
const [diamMIN, heightMIN] = [0, 0];
const [diamMAX, heightMAX] = [115, 40];

const defaults = {
  trees: [] as string[],
  diameters: [diamMIN, diamMAX],
  heights: [heightMIN, heightMAX],
};

const FilterPanel: React.FC<FilterPanelProps> = (props) => {
  const { updateParent, currentFilterObject, treeNamesAndColors, currentZoom, zoomIn } = props;
  const [isExpanded, setIsExpanded] = useState(false);
  const [treeCommonNameList, setTreeCommonNameList] = useState<SelectOption[]>([]);
  const [diameterRange, setDiameterRange] = useState(defaults.diameters);
  const [heightRange, setHeightRange] = useState<number[]>(defaults.heights);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  // Build the full list of options from the treeNamesAndColors prop
  useEffect(() => {
    let nameList: SelectOption[] = [];
    if (treeNamesAndColors) {
      for (const [key, value] of Object.entries(treeNamesAndColors)) {
        nameList.push({
          label: (
            <SelectEntry key={key}>
              <Dot color={(value as any).color}></Dot> {titleCase(key)}
            </SelectEntry>
          ),
          value: key,
        });
      }
    }
    setTreeCommonNameList(nameList);
  }, [treeNamesAndColors]);

  // Sync local slider state when the filter is changed externally
  // (e.g. clicking "Filter to this tree" from the InfoPanel resets trees
  //  but should also keep whatever diameter/height was already set)
  useEffect(() => {
    if (currentFilterObject.diameters) {
      setDiameterRange(currentFilterObject.diameters);
    }
    if (currentFilterObject.heights) {
      setHeightRange(currentFilterObject.heights);
    }
  }, [currentFilterObject]);

  // Derive the controlled value for the Select from the parent filter object.
  // This is the single source of truth – no local tree-selection state needed.
  const selectedTreeOptions = useMemo<SelectOption[]>(() => {
    const activeTrees: string[] = currentFilterObject.trees ?? [];
    return treeCommonNameList.filter((opt) => activeTrees.includes(opt.value));
  }, [treeCommonNameList, currentFilterObject.trees]);

  function isAtDefaults(): boolean {
    const trees: string[] = currentFilterObject.trees ?? [];
    const diameters: number[] = currentFilterObject.diameters ?? defaults.diameters;
    const heights: number[] = currentFilterObject.heights ?? defaults.heights;
    return (
      trees.length === 0 &&
      diameters[0] === diamMIN && diameters[1] === diamMAX &&
      heights[0] === heightMIN && heights[1] === heightMAX
    );
  }

  const handleTreeClick = (newValue: readonly SelectOption[]) => {
    const treeNames = newValue ? newValue.map((opt) => opt.value) : [];
    updateParent({ ...currentFilterObject, trees: treeNames });
  };

  const handleChangeDiameter = (
    _event: Event,
    newValue: number | number[],
    _activeThumb: number
  ) => {
    if (!Array.isArray(newValue)) return;
    setDiameterRange(newValue);
    updateParent({ ...currentFilterObject, diameters: newValue });
  };

  const handleChangeHeight = (
    _event: Event,
    newValue: number | number[],
    _activeThumb: number
  ) => {
    if (!Array.isArray(newValue)) return;
    setHeightRange(newValue);
    updateParent({ ...currentFilterObject, heights: newValue });
  };

  return (
    <StyledFilterPanel open={isExpanded} className="filter-panel">
      <StyledFilterTogglePane className="toggle-pane">
        {isExpanded && (
          <>
            <GreyBorderBottomTitle margin_bottom="10px" font_size="1.3rem">
              Filter by Species, Trunk Diameter, and Tree Height
            </GreyBorderBottomTitle>
            <StyledFilterBoxes>
              <LegendLabel> By Species (Common Name) </LegendLabel>
              <Select<SelectOption, true>
                options={treeCommonNameList}
                isMulti
                onChange={handleTreeClick}
                value={selectedTreeOptions}
                maxMenuHeight={200}
              />
            </StyledFilterBoxes>
            <StyledFilterBoxes>
                <LegendLabel> By Diameter Range (cm)</LegendLabel>
                <Slider
                    getAriaLabel={() => "Diameter Slider"}
                    value={diameterRange}
                    onChange={handleChangeDiameter}
                    valueLabelDisplay="auto"
                    step={6}
                    marks
                    min={diamMIN}
                    max={diamMAX}
                    disabled={(currentZoom <= boundaryTrasitionZoomLevel)}
                />
                <LegendLabel>  By Height Range (m) </LegendLabel>
                <Slider
                    getAriaLabel={() => "Height Slider"}
                    value={heightRange}
                    onChange={handleChangeHeight}
                    valueLabelDisplay="auto"
                    step={2}
                    marks
                    min={heightMIN}
                    max={heightMAX}
                    disabled={(currentZoom <= boundaryTrasitionZoomLevel)}
                />
            </StyledFilterBoxes>
            { (currentZoom <= boundaryTrasitionZoomLevel) &&
                <StyledFilterBoxes color={INFO_COLOR}>
                    <div style={{"width": "fit-content",
                                    "height": "fit-content"}}>
                        {Info} <b>Height and Diameter Filtering Disabled</b> Please click to {<ZoomLink onClick={zoomIn} href='#'>zoom in</ZoomLink>} in to use filters.
                    </div>
                </StyledFilterBoxes>
                }
                {(currentZoom <= boundaryTrasitionZoomLevel) && (currentFilterObject.trees) && (currentFilterObject.trees.length > 4) &&
                    <StyledFilterBoxes color={INFO_COLOR}>
                    <div style={{"width": "fit-content",
                                    "height": "fit-content"}}>
                        {Info} <b>Trees filter</b> currently supports a <b>max of 4 when zoomed out</b>. {<ZoomLink onClick={zoomIn} href='#'>Zoom</ZoomLink>} or remove trees from the filter.
                    </div>
                </StyledFilterBoxes>
            }
          </>
        )}
      </StyledFilterTogglePane>
      <OpenCloseButton
        onClick={handleToggle}
        title={isExpanded ? "collapse panel" : "expand panel"}
      >
        {!isExpanded && (
          <p style={{ fontSize: "1.2rem", margin: "-6px 5px 5px 0px" }}>
            Filter Map
          </p>
        )}
        {isExpanded
          ? ChevronCollapse
          : isAtDefaults()
          ? Filter({ height: 24, width: 24 })
          : Filtered({ height: 24, width: 24 })}
      </OpenCloseButton>
    </StyledFilterPanel>
  );
};

export default FilterPanel;
