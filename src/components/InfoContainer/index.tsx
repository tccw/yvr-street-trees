import * as React from "react";
import { useState, useEffect } from "react";
import {
  heightStringFromID,
  titleCase,
  toPrettyDateString,
  sentenceCase,
  cloudinaryImageName,
  cloudinaryImageNameCultivar,
} from "../../utils/utils";
import styled from "styled-components";
import { Copy, Check } from "../../svg-icons";
import CustCloudinaryImage from "../custom-cloudinary-image";
import {
  StyledTreeInfo,
  StyledSubText,
  TreeDetailsList,
  TreeListElement,
  TreeDetail,
  TreeDetailKey,
  TreeDetailValue,
  CopyButton,
  Blurb,
  AttributesContainer,
} from "./styles";

/**
 * This container should reviece the properties of the selected tree
 * and the treeStats object which is calculated on first render.
 *
 * @param {any} props
 * @returns
 */
export const TreeInfoComponent = (props: any) => {
  const [copied, setCopied] = useState(false);

  const {
    genus_name,
    species_name,
    tree_id,
    diameter,
    civic_number,
    on_street,
    height_range_id,
    date_planted,
    common_name,
    neighbourhood_name,
    cultivar_name,
    color,
  } = props;

  var listValues = {
    "Tree ID": tree_id,
    Height: `${heightStringFromID(height_range_id)}`,
    Diameter: `${diameter} inches`,
    Address: `${civic_number} ${on_street}`,
    "Date Planted": date_planted
      ? `${toPrettyDateString(date_planted)}`
      : "Before 1989",
  };

  async function onClick() {
    setCopied(true);
    navigator.clipboard.writeText(listValues.Address); // only for modern browsers
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setCopied(false);
  }

  var treeDetails = [];
  for (const [key, value] of Object.entries(listValues)) {
    treeDetails.push(
      <TreeListElement key={key}>
        <TreeDetail>
          <TreeDetailKey>{key}</TreeDetailKey>
          <TreeDetailValue>{value}</TreeDetailValue>
          {key === "Address" && (
            <CopyButton copied={copied} onClick={onClick}>
              {copied ? Check : Copy}
            </CopyButton>
          )}
        </TreeDetail>
      </TreeListElement>
    );
  }

  const citywidePrevalence = (stats: any) => {
    let percentage = Math.round(
      (stats.tree_stats[common_name].total_count / stats.city_tree_count) * 100
    ).toFixed(2);
    return formatPrevalanceResult(parseInt(percentage));
  };
  const neighborhoodPrevalance = (stats: any) => {
    let percentage = Math.round(
      (stats.tree_stats[common_name].neighborhood_counts[neighbourhood_name] /
        stats.neighborhood_stats[neighbourhood_name].total_count) *
        100
    ).toFixed(2);
    return formatPrevalanceResult(parseInt(percentage));
  };

  const formatPrevalanceResult = (percentage: number) => {
    let result;
    if (percentage < 0.5) {
      result = "Less than 0.5";
    } else {
      result =
        percentage >= 1
          ? `About ${Math.round(percentage).toFixed(0)}`
          : percentage.toFixed(2);
    }
    return result;
  };

  const getBlurb = (blurbs: any) => {
    let key = formatSciName().toLowerCase().split(" ").join("_");
    let blurb: JSX.Element[] | null = key in blurbs ? [] : null;
    if (blurb) {
      for (let i = 0; i < blurbs[key].length; i++) {
        blurb.push(<Blurb key={i}>{blurbs[key][i]}</Blurb>);
      }
    }
    return blurb;
  };

  const formatSciName = () => {
    let tmp_species_name = species_name;
    let species_name_arr = species_name.trim().split(" ");
    if (species_name_arr[species_name_arr.length - 1].toLowerCase() === "x") {
      tmp_species_name = `${species_name_arr[species_name_arr.length - 1]} ${
        species_name_arr[0]
      }`;
    }
    return sentenceCase(`${genus_name} ${tmp_species_name}`);
  };

  let cult = cultivar_name ? ` (${titleCase(cultivar_name)})` : "";
  let neighPrevalance = React.useMemo(
    () => neighborhoodPrevalance(props.stats),
    [tree_id]
  );
  let totalPrevalance = React.useMemo(
    () => citywidePrevalence(props.stats),
    [tree_id]
  );
  let blurb = React.useMemo(() => getBlurb(props.blurbs), [tree_id]);

  return (
    <StyledTreeInfo className="tree-attrs">
      <StyledSubText font_size="1.5rem" font_style="italic">
        {`${formatSciName()} ` + cult}
      </StyledSubText>
      <StyledSubText font_size="0.9rem" font_style="none">
        {`${neighPrevalance}% of ${titleCase(neighbourhood_name)} trees.`}
      </StyledSubText>
      <StyledSubText font_size="0.9rem" font_style="none">
        {`${totalPrevalance}% of Vancouver trees.`}
      </StyledSubText>
      {/* <AttributesContainer> */}
        <CustCloudinaryImage
            cloudImageId={cloudinaryImageNameCultivar(genus_name, species_name)}
            // cloudImageId={cloudinaryImageNameCultivar(genus_name, species_name, cultivar_name)}
            color={color}
        />
        <TreeDetailsList className="details-list">{treeDetails}</TreeDetailsList>
      {/* </AttributesContainer> */}

      {props.children}
      {blurb}
    </StyledTreeInfo>
  );
};

export const InfoContainer = React.memo(TreeInfoComponent); // look into if memoizing this results in worse performance (or does anything)
