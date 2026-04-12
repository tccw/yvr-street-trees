import { useEffect, useState } from "react";
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
  updateParent: any;
  currentFilterObject: any;
  treeNamesAndColors: object;
  updateSelected: any;
  selected: any;
  currentZoom: number;
  zoomIn: any;
  defaultValue: any[];
  setDefaultValue: (value: any) => void;
}

interface SelectOption {
    label: JSX.Element;
    value: string;
}

const INFO_COLOR = '#a6e9ff';
const [diamMIN, heightMIN] = [0, 0];
const [diamMAX, heightMAX] = [115, 40];

const defaults = {
  trees: [],
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

  const [defaultValues, setDefaultValues] = useState<any>(defaults);

  function defaultCheck() {
    return (
        arrsEqualInOrder(defaultValues.trees, defaults.trees) &&
        arrsEqualInOrder(defaultValues.diameters, defaults.diameters) &&
        arrsEqualInOrder(defaultValues.heights, defaults.heights)
    );
  };

  function arrsEqualInOrder(arr1: any[], arr2: any[]): boolean {
        if (arr1.length !== arr2.length) {
            return false;
        }

        for (const [idx, val] of arr1.entries()) {
            if (val !== arr2[idx])
                return false
        }

        return true;
  }

  const handleTreeClick = (selection: {label: string, value: string}[]) => {
    updateParent({...currentFilterObject, trees: selection.length ? selection.map((entry: any) => (entry.value)) : []})
    setDefaultValues({
        ...defaultValues,
        trees: selection
      });
}

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

  const handleChangeDiameter = (
    event: Event,
    newValue: number | number[],
    activeThumb: number
  ) => {
    if (!Array.isArray(newValue)) {
        return;
    }

    setDiameterRange(newValue);
    updateParent({
        ...currentFilterObject,
        diameters: newValue
      });
      setDefaultValues({
        ...defaultValues,
        diameters: newValue
      });
  }

  const handleChangeHeight = (
    event: Event,
    newValue: number | number[],
    activeThumb: number
  ) => {
    if (!Array.isArray(newValue)) {
        return;
    }

    setHeightRange(newValue);
    updateParent({
        ...currentFilterObject,
        heights: newValue
      });
    setDefaultValues({
        ...defaultValues,
        heights: newValue
      });
  }

useEffect(() => {
    setDefaultValues({
        ...currentFilterObject,
        trees: treeCommonNameList.filter((value) => currentFilterObject.trees.includes(value.value)),
    })
}, [currentFilterObject]);

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
                key={JSON.stringify(defaultValues.trees)} // using key to force update https://github.com/facebook/react/issues/4101#issuecomment-243625941
                options={treeCommonNameList}
                isMulti
                onChange={(newValue) => {
                  const selection = newValue ? Array.from(newValue).map(item => ({
                    label: item.value, // Use value as string for label
                    value: item.value
                  })) : [];
                  handleTreeClick(selection);
                }}
                defaultValue={defaultValues.trees as SelectOption[]}
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
          : defaultCheck()
          ? Filter({ height: 24, width: 24 })
          : Filtered({ height: 24, width: 24 })}
      </OpenCloseButton>
    </StyledFilterPanel>
  );
};

export default FilterPanel;
